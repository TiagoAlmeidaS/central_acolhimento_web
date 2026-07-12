import {
  assertSessionCanAccessRecord,
  assertSessionRole,
  getDataScopeFromSession,
  listAccessibleTenantIds,
} from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import type { Member } from "@/server/domain/mvp";
import { listMembers, updateMember } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ memberId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const { memberId } = await context.params;
    const currentMember = session.membership.role === "coordinator"
      ? (await Promise.all((await listAccessibleTenantIds(session)).map((tenantId) => listMembers({ tenantId })))).flat().find((item) => item.id === memberId)
      : (await listMembers(getDataScopeFromSession(session))).find((item) => item.id === memberId);

    if (!currentMember) {
      return Response.json({ error: "Membro nao encontrado." }, { status: 404 });
    }

    assertSessionCanAccessRecord(session, currentMember);

    const body = (await request.json()) as { status?: Member["status"] };

    if (!body.status) {
      return Response.json({ error: "Campo obrigatorio: status." }, { status: 400 });
    }

    const member = await updateMember(memberId, {
      tenantId: currentMember.tenantId,
      caregiverId: currentMember.caregiverId,
      seedId: currentMember.seedId,
      name: currentMember.name,
      age: currentMember.age,
      phone: currentMember.phone,
      address: currentMember.address,
      city: currentMember.city,
      birthDate: currentMember.birthDate,
      status: body.status,
      notes: currentMember.notes,
      latitude: currentMember.latitude,
      longitude: currentMember.longitude,
      isUrgent: currentMember.isUrgent,
    });

    return Response.json(member);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar status do membro." },
      { status: 500 }
    );
  }
}
