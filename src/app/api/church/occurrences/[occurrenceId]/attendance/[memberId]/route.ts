export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { markChurchAttendance } from "@/server/repositories/church-repository";

export async function PUT(request: Request, { params }: { params: Promise<{ occurrenceId: string; memberId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { occurrenceId, memberId } = await params;
    const body = (await request.json()) as { status?: "unmarked" | "present" | "absent" | "justified"; notes?: string };
    if (!body.status) return Response.json({ error: "Campo obrigatorio: status." }, { status: 400 });
    return Response.json(
      await markChurchAttendance(occurrenceId, memberId, body.status, body.notes ?? "", session.membership.tenantUserId, {
        tenantIds: await listAccessibleTenantIds(session),
      }),
    );
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao marcar presenca." }, { status: 500 });
  }
}
