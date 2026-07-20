export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { closeChurchAttendance } from "@/server/repositories/church-repository";

export async function POST(_request: Request, { params }: { params: Promise<{ occurrenceId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { occurrenceId } = await params;
    return Response.json(await closeChurchAttendance(occurrenceId, session.membership.tenantUserId, { tenantIds: await listAccessibleTenantIds(session) }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao fechar chamada." }, { status: 500 });
  }
}
