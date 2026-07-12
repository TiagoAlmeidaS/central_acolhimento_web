export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { removeOutingParticipant } from "@/server/repositories/outing-repository";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ outingId: string; participantId: string }> },
) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { outingId, participantId } = await params;
    await removeOutingParticipant(outingId, participantId, { tenantIds: await listAccessibleTenantIds(session) });
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao remover participante." }, { status: 500 });
  }
}
