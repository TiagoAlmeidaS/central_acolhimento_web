export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { removeOutingConstraint } from "@/server/repositories/outing-repository";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ outingId: string; constraintId: string }> },
) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { outingId, constraintId } = await params;
    await removeOutingConstraint(outingId, constraintId, { tenantIds: await listAccessibleTenantIds(session) });
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao remover vinculo." }, { status: 500 });
  }
}
