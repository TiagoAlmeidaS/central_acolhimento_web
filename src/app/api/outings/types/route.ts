export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createOutingType, listOutingTypes } from "@/server/repositories/outing-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession();
    if (session.membership.role !== "coordinator") return Response.json({ error: "Perfil sem permissao para administrar tipos de saida." }, { status: 403 });
    const tenantId = new URL(request.url).searchParams.get("tenantId");
    const scope = tenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, tenantId) }
      : { tenantIds: await listAccessibleTenantIds(session) };
    return Response.json(await listOutingTypes(scope, { includeInactive: true }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao listar tipos de saida." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession();
    if (session.membership.role !== "coordinator") return Response.json({ error: "Perfil sem permissao para administrar tipos de saida." }, { status: 403 });
    const body = (await request.json()) as { tenantId?: string; name?: string; description?: string };
    if (!body.tenantId || !body.name?.trim()) return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    const type = await createOutingType({
      tenantId: await resolveTenantIdForUserAccess(session, body.tenantId),
      name: body.name,
      description: body.description,
      createdByTenantUserId: session.membership.tenantUserId,
    });
    return Response.json(type, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao criar tipo de saida." }, { status: 500 });
  }
}
