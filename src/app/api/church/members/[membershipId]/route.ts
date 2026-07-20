export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { updateChurchMembership } from "@/server/repositories/church-repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { membershipId } = await params;
    const body = (await request.json()) as { status?: "active" | "inactive"; startedAt?: string | null; endedAt?: string | null; notes?: string };
    return Response.json(await updateChurchMembership(membershipId, body, { tenantIds: await listAccessibleTenantIds(session) }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar vinculo." }, { status: 500 });
  }
}
