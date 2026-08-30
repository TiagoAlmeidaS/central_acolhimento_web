export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { buildPeopleCsv, buildPeoplePdf, getPeopleDashboardSnapshot } from "@/server/domain/people-dashboard";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId");
    const scope = requestedTenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, requestedTenantId) }
      : { tenantIds: await listAccessibleTenantIds(session) };
    const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";
    const snapshot = await getPeopleDashboardSnapshot(
      {
        view: "contacts",
        period: searchParams.get("period"),
        referenceDate: searchParams.get("referenceDate"),
        state: searchParams.get("state"),
        city: searchParams.get("city"),
        tenantId: requestedTenantId,
      },
      scope,
    );

    const dateStamp = snapshot.generatedAt.slice(0, 10);
    console.info("people_report_generated", { reportType: "contacts", format, rowCount: snapshot.people.length, generatedAt: snapshot.generatedAt });

    if (format === "pdf") {
      return new Response(buildPeoplePdf(snapshot), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="dashboard-contatos-${dateStamp}.pdf"`,
        },
      });
    }

    return new Response(buildPeopleCsv(snapshot), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dashboard-contatos-${dateStamp}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar relatorio de contatos.";
    const status = message.includes("Acesso negado") || message.includes("fora do escopo") ? 403 : message.includes("Selecione") || message.includes("Data invalida") ? 400 : 500;
    console.error("people_report_failed", { reportType: "contacts", error: message });
    return Response.json({ error: message }, { status });
  }
}
