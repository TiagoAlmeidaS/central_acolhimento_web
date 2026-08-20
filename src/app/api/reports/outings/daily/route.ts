export const dynamic = "force-dynamic";

import { isValidDateOnly } from "@/server/domain/daily-outing-report";
import { resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { listTenants } from "@/server/repositories/mvp-repository";
import { getDailyOutingReport } from "@/server/repositories/daily-outing-report-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession();
    if (session.membership.role !== "coordinator") return Response.json({ error: "Perfil sem permissao para relatorios de saida." }, { status: 403 });
    const params = new URL(request.url).searchParams;
    const date = params.get("date") ?? "";
    const rawDateTo = params.get("dateTo") ?? "";
    const requestedTenantId = params.get("tenantId") ?? session.membership.tenantId;
    if (!isValidDateOnly(date)) return Response.json({ error: "Data invalida. Use AAAA-MM-DD." }, { status: 400 });
    const dateTo = isValidDateOnly(rawDateTo) && rawDateTo >= date ? rawDateTo : undefined;
    const tenantId = await resolveTenantIdForUserAccess(session, requestedTenantId);
    const tenant = (await listTenants({ tenantId })).find((item) => item.id === tenantId);
    if (!tenant) return Response.json({ error: "Localidade nao encontrada." }, { status: 404 });
    const report = await getDailyOutingReport(tenant, date, dateTo);
    console.info("daily_outing_report_viewed", { version: report.version, tenantId, date, totals: report.totals });
    return Response.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar relatorio diario.";
    const status = message.includes("Acesso negado") || message.includes("Perfil sem permissao") ? 403 : 500;
    return Response.json({ error: message }, { status });
  }
}
