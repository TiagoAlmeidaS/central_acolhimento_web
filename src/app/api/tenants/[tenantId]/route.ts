import { assertSessionCanAccessRecord } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { updateTenant } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ tenantId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { tenantId } = await context.params;
    const { listUserMemberships } = await import("@/server/repositories/auth-repository");
    const memberships = await listUserMemberships(session.user.id);
    const hasAccess = memberships.some((m) => m.tenantId === tenantId);
    if (!hasAccess) {
      return Response.json({ error: "Acesso negado para esta localidade." }, { status: 403 });
    }
    const body = (await request.json()) as {
      name?: string;
      city?: string;
      state?: string;
      status?: "active" | "inactive";
      coordinator?: string | null;
    };

    if (!body.name || !body.city || !body.state) {
      return Response.json({ error: "Campos obrigatorios: name, city, state." }, { status: 400 });
    }

    const tenant = await updateTenant(tenantId, {
      name: body.name,
      city: body.city,
      state: body.state,
      status: body.status,
      coordinator: body.coordinator ?? null,
    });

    return Response.json(tenant);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao editar cidade." },
      { status: 500 }
    );
  }
}
