export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { saveManualOutingGroups } from "@/server/repositories/outing-repository";

export async function PUT(request: Request, { params }: { params: Promise<{ outingId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { outingId } = await params;
    const body = (await request.json()) as { groups?: Array<{ name?: string; driverParticipantId?: string | null; participantIds?: string[] }> };
    if (!Array.isArray(body.groups)) return Response.json({ error: "Campo obrigatorio: groups." }, { status: 400 });
    if (body.groups.some((group) => typeof group.name !== "string" || !Array.isArray(group.participantIds))) {
      return Response.json({ error: "Cada grupo precisa informar name e participantIds." }, { status: 400 });
    }
    return Response.json(await saveManualOutingGroups({
      outingEventId: outingId,
      groups: body.groups.map((group) => ({ name: group.name!, driverParticipantId: group.driverParticipantId ?? null, participantIds: group.participantIds! })),
    }, { tenantIds: await listAccessibleTenantIds(session) }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar grupos.";
    const status = /confirmada|Reabra/i.test(message) ? 409 : 400;
    return Response.json({ error: message }, { status });
  }
}
