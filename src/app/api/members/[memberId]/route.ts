import {
  assertSessionCanAccessRecord,
  getDataScopeFromSession,
  resolveCaregiverId,
  resolveTenantId,
} from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { listMembers, updateMember } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ memberId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    const { memberId } = await context.params;
    const currentMember = (await listMembers(getDataScopeFromSession(session))).find((item) => item.id === memberId);
    if (!currentMember) {
      return Response.json({ error: "Membro nao encontrado." }, { status: 404 });
    }
    assertSessionCanAccessRecord(session, currentMember);
    const body = (await request.json()) as {
      tenantId?: string;
      caregiverId?: string | null;
      seedId?: string | null;
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      birthDate?: string | null;
      status?: "new" | "in_progress" | "consolidated" | "inactive";
      notes?: string;
    };

    if (!body.tenantId || !body.name) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const member = await updateMember(memberId, {
      tenantId: resolveTenantId(session, body.tenantId),
      caregiverId: resolveCaregiverId(session, body.caregiverId ?? null, { allowUnassignedForCoordinator: true }),
      seedId: body.seedId ?? null,
      name: body.name,
      phone: body.phone,
      address: body.address,
      city: body.city,
      birthDate: body.birthDate ?? null,
      status: body.status,
      notes: body.notes,
    });

    return Response.json(member);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao editar membro." },
      { status: 500 }
    );
  }
}
