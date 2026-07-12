export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { confirmOuting } from "@/server/repositories/outing-repository";

export async function POST(_: Request, { params }: { params: Promise<{ outingId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { outingId } = await params;
    const detail = await confirmOuting(outingId, { tenantIds: await listAccessibleTenantIds(session) });
    return Response.json(detail);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao confirmar saida." }, { status: 500 });
  }
}
