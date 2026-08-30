export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { getPeopleDashboardSnapshot } from "@/server/domain/people-dashboard";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId");
    const scope = requestedTenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, requestedTenantId) }
      : { tenantIds: await listAccessibleTenantIds(session) };

    const snapshot = await getPeopleDashboardSnapshot(
      {
        view: searchParams.get("view"),
        period: searchParams.get("period"),
        referenceDate: searchParams.get("referenceDate"),
        state: searchParams.get("state"),
        city: searchParams.get("city"),
        tenantId: requestedTenantId,
        meetingTypeId: searchParams.get("meetingTypeId"),
      },
      scope,
    );

    return Response.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar dashboard de pessoas.";
    const status = message.includes("Acesso negado") || message.includes("fora do escopo") ? 403 : message.includes("Selecione") || message.includes("Data invalida") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
