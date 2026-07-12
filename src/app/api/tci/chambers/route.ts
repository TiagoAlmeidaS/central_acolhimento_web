export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createTciChamber, listTciChambers } from "@/server/repositories/tci-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;
    const scope = requestedTenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, requestedTenantId) }
      : { tenantIds: await listAccessibleTenantIds(session) };
    return Response.json(await listTciChambers(scope));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao listar camaras." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const body = (await request.json()) as {
      tenantId?: string;
      name?: string;
      description?: string;
      capacity?: number | null;
      active?: boolean;
    };

    if (!body.tenantId || !body.name?.trim()) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const chamber = await createTciChamber({
      tenantId: await resolveTenantIdForUserAccess(session, body.tenantId),
      name: body.name.trim(),
      description: body.description ?? "",
      capacity: body.capacity ?? null,
      active: body.active ?? true,
    });

    return Response.json(chamber, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao criar camara." }, { status: 500 });
  }
}
