import { assertSessionCanAccessRecord, assertSessionRole, getDataScopeFromSession, resolveTenantId } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { listCaregivers, updateCaregiver } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ caregiverId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const { caregiverId } = await context.params;
    const currentCaregiver = (await listCaregivers(getDataScopeFromSession(session))).find((item) => item.id === caregiverId);
    if (!currentCaregiver) {
      return Response.json({ error: "Cuidador nao encontrado." }, { status: 404 });
    }
    assertSessionCanAccessRecord(session, currentCaregiver);
    const body = (await request.json()) as {
      tenantId?: string;
      tenantUserId?: string | null;
      name?: string;
      phone?: string;
      email?: string | null;
      active?: boolean;
      notes?: string;
    };

    if (!body.tenantId || !body.name) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const caregiver = await updateCaregiver(caregiverId, {
      tenantId: resolveTenantId(session, body.tenantId),
      tenantUserId: body.tenantUserId ?? null,
      name: body.name,
      phone: body.phone,
      email: body.email ?? null,
      active: body.active,
      notes: body.notes,
    });

    return Response.json(caregiver);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao editar cuidador." },
      { status: 500 }
    );
  }
}
