import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { completeOuting } from "@/server/repositories/outing-repository";

export async function POST(_: Request, { params }: { params: Promise<{ outingId: string }> }) {
  try {
    const session = await requireServerAuthSession();
    if (session.membership.role !== "coordinator") return Response.json({ error: "Perfil sem permissao para concluir saidas." }, { status: 403 });
    const { outingId } = await params;
    return Response.json(await completeOuting(outingId, session.membership.tenantUserId, { tenantIds: await listAccessibleTenantIds(session) }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao concluir saida.";
    const status = message.includes("Acesso negado") ? 403 : message.includes("nao encontrada") ? 404 : message.includes("Apenas") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
