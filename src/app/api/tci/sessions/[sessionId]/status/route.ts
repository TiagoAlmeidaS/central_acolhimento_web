export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { updateTciSessionStatus } from "@/server/repositories/tci-repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { sessionId } = await params;
    const body = (await request.json()) as { status?: "draft" | "scheduled" | "confirmed" | "completed" | "cancelled" };

    if (!body.status) {
      return Response.json({ error: "Campo obrigatorio: status." }, { status: 400 });
    }

    return Response.json(
      await updateTciSessionStatus(sessionId, body.status, { tenantIds: await listAccessibleTenantIds(session) }),
    );
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar status da sessao TCI." }, { status: 500 });
  }
}
