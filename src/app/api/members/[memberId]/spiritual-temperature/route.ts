import {
  assertSessionCanAccessRecord,
  getDataScopeFromSession,
  listAccessibleTenantIds,
} from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { listMembers, updateMember } from "@/server/repositories/mvp-repository";
import type { SpiritualTemperature } from "@/server/domain/mvp";

type RouteContext = {
  params: Promise<{ memberId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    const { memberId } = await context.params;
    const currentMember = session.membership.role === "coordinator"
      ? (await Promise.all((await listAccessibleTenantIds(session)).map((tenantId) => listMembers({ tenantId })))).flat().find((item) => item.id === memberId)
      : (await listMembers(getDataScopeFromSession(session))).find((item) => item.id === memberId);
    if (!currentMember) {
      return Response.json({ error: "Membro nao encontrado." }, { status: 404 });
    }
    assertSessionCanAccessRecord(session, currentMember);

    const body = (await request.json()) as { spiritualTemperature?: SpiritualTemperature | null };
    const { spiritualTemperature } = body;

    await updateMember(memberId, {
      tenantId: currentMember.tenantId,
      caregiverId: currentMember.caregiverId,
      name: currentMember.name,
      phone: currentMember.phone,
      address: currentMember.address,
      postalCode: currentMember.postalCode,
      street: currentMember.street,
      neighborhood: currentMember.neighborhood,
      addressNumber: currentMember.addressNumber,
      state: currentMember.state,
      city: currentMember.city,
      status: currentMember.status,
      spiritualTemperature: spiritualTemperature ?? null,
      notes: currentMember.notes,
      latitude: currentMember.latitude,
      longitude: currentMember.longitude,
      isUrgent: currentMember.isUrgent ?? false,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar temperatura espiritual." },
      { status: 500 },
    );
  }
}
