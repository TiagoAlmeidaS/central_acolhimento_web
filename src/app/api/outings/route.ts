export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createOuting, listOutings } from "@/server/repositories/outing-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;
    const accessibleTenantIds = await listAccessibleTenantIds(session);
    const scope = requestedTenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, requestedTenantId) }
      : { tenantIds: accessibleTenantIds };

    const outings = await listOutings(scope);
    return Response.json(outings);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao listar saidas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const body = (await request.json()) as {
      tenantId?: string;
      name?: string;
      description?: string;
      scheduledFor?: string | null;
      targetGroupSize?: number;
      allowGroupsWithoutCar?: boolean;
      outingTypeId?: string;
    };

    if (!body.tenantId || !body.name?.trim() || !body.outingTypeId) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name, outingTypeId." }, { status: 400 });
    }

    const outing = await createOuting({
      tenantId: await resolveTenantIdForUserAccess(session, body.tenantId),
      name: body.name.trim(),
      description: body.description ?? "",
      scheduledFor: body.scheduledFor ?? null,
      targetGroupSize: body.targetGroupSize,
      allowGroupsWithoutCar: body.allowGroupsWithoutCar,
      createdByTenantUserId: session.membership.tenantUserId,
      outingTypeId: body.outingTypeId,
    });

    return Response.json(outing, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao criar saida." }, { status: 500 });
  }
}
