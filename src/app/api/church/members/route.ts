export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createChurchMembership, listChurchMemberships } from "@/server/repositories/church-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const scope = tenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, tenantId) }
      : { tenantIds: await listAccessibleTenantIds(session) };

    return Response.json(await listChurchMemberships(scope));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao listar membros da Igreja." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const body = (await request.json()) as { tenantId?: string; memberId?: string; startedAt?: string | null; notes?: string };
    if (!body.tenantId || !body.memberId) {
      return Response.json({ error: "Campos obrigatorios: tenantId, memberId." }, { status: 400 });
    }

    const membership = await createChurchMembership({
      tenantId: await resolveTenantIdForUserAccess(session, body.tenantId),
      memberId: body.memberId,
      startedAt: body.startedAt ?? null,
      notes: body.notes ?? "",
      createdByTenantUserId: session.membership.tenantUserId,
    });

    return Response.json(membership, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao vincular membro a Igreja." }, { status: 500 });
  }
}
