export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { prepareChurchAttendance } from "@/server/repositories/church-repository";

export async function GET(_request: Request, { params }: { params: Promise<{ occurrenceId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { occurrenceId } = await params;
    return Response.json(await prepareChurchAttendance(occurrenceId, { tenantIds: await listAccessibleTenantIds(session) }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao abrir chamada." }, { status: 500 });
  }
}
