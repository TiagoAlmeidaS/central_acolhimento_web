export const dynamic = "force-dynamic";

import type { CSSProperties, ReactNode } from "react";
import { isValidDateOnly } from "@/server/domain/daily-outing-report";
import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { getDailyOutingReport } from "@/server/repositories/daily-outing-report-repository";
import { listTenants } from "@/server/repositories/mvp-repository";
import { Card } from "@/ui/v2-components/ui";
import { DashboardMap } from "@/ui/mvp/dashboard-map";
import { DailyOutingReportActions } from "@/ui/mvp/daily-outing-report-actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatInstant(value: string) {
  return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default async function DailyOutingReportPage({ searchParams }: Props) {
  const session = await requireServerAuthSession("coordinator");
  const params = await searchParams;
  const requestedDate = first(params.date) ?? todayInSaoPaulo();
  const date = isValidDateOnly(requestedDate) ? requestedDate : todayInSaoPaulo();
  const tenantId = await resolveTenantIdForUserAccess(session, first(params.tenantId) ?? session.membership.tenantId);
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const tenants = await listTenants({ tenantIds: accessibleTenantIds });
  const tenant = tenants.find((item) => item.id === tenantId);
  if (!tenant) throw new Error("Localidade nao encontrada.");
  const report = await getDailyOutingReport(tenant, date);
  console.info("daily_outing_report_viewed", {
    version: report.version,
    tenantId: report.tenant.id,
    date: report.date,
    totals: report.totals,
  });
  const openHouses = report.contacts.filter((contact) => contact.openHouse);
  const mappedHouses = openHouses.filter((contact) => contact.latitude !== null && contact.longitude !== null);
  const unmappedHouses = openHouses.filter((contact) => contact.latitude === null || contact.longitude === null);

  return (
    <main className="daily-outing-report" style={{ padding: "28px 24px 48px", maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{printStyles}</style>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Central de Acolhimento</p>
          <h1 style={{ margin: "6px 0 0", fontSize: 30, color: "var(--text)", letterSpacing: "-0.03em" }}>Relatorio diario de saidas</h1>
          <p style={{ margin: "7px 0 0", color: "var(--text-2)", fontSize: 14 }}>
            {tenant.name} · {tenant.city}/{tenant.state} · {formatDate(report.date)}
          </p>
          <p style={{ margin: "4px 0 0", color: "var(--text-3)", fontSize: 11.5 }}>
            Versao {report.version} · Gerado em {formatInstant(report.generatedAt)} · {report.timezone}
          </p>
        </div>
        <DailyOutingReportActions tenantId={report.tenant.id} version={report.version} />
      </header>

      <form method="get" className="report-controls" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", padding: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
        <label style={labelStyle}>Data<input name="date" type="date" defaultValue={date} style={inputStyle} /></label>
        <label style={labelStyle}>Localidade<select name="tenantId" defaultValue={tenantId} style={inputStyle}>{tenants.map((item) => <option key={item.id} value={item.id}>{item.name} - {item.city}/{item.state}</option>)}</select></label>
        <button type="submit" style={filterButtonStyle}>Atualizar relatorio</button>
      </form>

      <section className="report-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <Metric label="Saidas realizadas" value={report.totals.completedOutings} />
        <Metric label="Participacoes" value={report.totals.participations} />
        <Metric label="Novos contatos" value={report.totals.newContacts} accent />
        <Metric label="Adolescentes" value={report.totals.adolescents} />
        <Metric label="Casas abertas" value={report.totals.openHouses} />
        <Metric label="Sem localizacao" value={report.totals.openHousesWithoutCoordinates} />
      </section>

      {report.totals.completedOutings === 0 ? (
        <Card padding={28}><div role="status" style={{ textAlign: "center", color: "var(--text-3)" }}>Nenhuma saida concluida nesta data.</div></Card>
      ) : (
        <>
          <ReportSection title="Resultado por tipo de saida">
            <div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><Th>Tipo</Th><Th>Saidas</Th><Th>Participacoes</Th><Th>Contatos</Th><Th>Adolescentes</Th><Th>Casas abertas</Th></tr></thead><tbody>{report.byType.map((item) => <tr key={item.outingTypeId ?? "unclassified"}><Td strong>{item.name}</Td><Td>{item.outings}</Td><Td>{item.participations}</Td><Td>{item.newContacts}</Td><Td>{item.adolescents}</Td><Td>{item.openHouses}</Td></tr>)}</tbody></table></div>
          </ReportSection>

          <ReportSection title="Saidas realizadas">
            <div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><Th>Saida</Th><Th>Tipo</Th><Th>Concluida em</Th><Th>Participacoes</Th><Th>Novos contatos</Th></tr></thead><tbody>{report.outings.map((outing) => <tr key={outing.id}><Td strong>{outing.name}</Td><Td>{outing.typeName}</Td><Td>{formatInstant(outing.completedAt)}</Td><Td>{outing.participationCount}</Td><Td>{outing.newContactCount}</Td></tr>)}</tbody></table></div>
          </ReportSection>

          <ReportSection title="Novos contatos gerados">
            {report.contacts.length === 0 ? <p style={emptyStyle}>Nenhum novo contato vinculado e criado nesta data.</p> : <div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><Th>Nome</Th><Th>Idade</Th><Th>Faixa</Th><Th>Saida</Th><Th>Tipo</Th><Th>Casa aberta</Th></tr></thead><tbody>{report.contacts.map((contact) => <tr key={contact.id}><Td strong>{contact.name}</Td><Td>{contact.age ?? "Nao informada"}</Td><Td>{contact.ageGroup === "adolescent" ? "Adolescente" : contact.ageGroup === "unknown" ? "Nao informada" : "Outra idade"}</Td><Td>{contact.outingName}</Td><Td>{contact.outingTypeName}</Td><Td>{contact.openHouse ? "Sim" : "Nao"}</Td></tr>)}</tbody></table></div>}
          </ReportSection>

          <section className="report-section">
            {mappedHouses.length > 0 ? <DashboardMap title="Mapa das casas abertas" description={`${mappedHouses.length} casa(s) com coordenadas nesta data.`} showLegend={false} items={mappedHouses.map((contact) => ({ id: contact.id, name: contact.name, city: contact.city, address: contact.address, status: "novo", caregiver: null, lastContact: "Gerado pela saida", latitude: contact.latitude, longitude: contact.longitude, age: contact.age }))} /> : <Card padding={24}><h2 style={sectionTitleStyle}>Mapa das casas abertas</h2><p style={emptyStyle}>Nenhuma casa aberta com coordenadas nesta data.</p></Card>}
          </section>

          {unmappedHouses.length > 0 ? <ReportSection title="Casas abertas sem localizacao no mapa"><ul style={{ margin: 0, paddingLeft: 20 }}>{unmappedHouses.map((contact) => <li key={contact.id} style={{ marginBottom: 6 }}>{contact.name} · {contact.address || contact.city || "Endereco nao informado"}</li>)}</ul></ReportSection> : null}
        </>
      )}

      <footer style={{ paddingTop: 12, borderTop: "1px solid var(--border)", color: "var(--text-3)", fontSize: 11.5, lineHeight: 1.5 }}>
        Documento restrito a coordenacao. Contagens de casas abertas representam contatos que disponibilizaram uma casa e nao domicilios deduplicados.
      </footer>
    </main>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <Card padding={16}><div style={{ color: "var(--text-3)", fontSize: 11.5, fontWeight: 700 }}>{label}</div><div style={{ marginTop: 8, fontSize: 28, fontWeight: 850, color: accent ? "var(--accent)" : "var(--text)" }}>{value}</div></Card>;
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return <Card padding={20}><h2 style={sectionTitleStyle}>{title}</h2>{children}</Card>;
}
function Th({ children }: { children: ReactNode }) { return <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{children}</th>; }
function Td({ children, strong = false }: { children: ReactNode; strong?: boolean }) { return <td style={{ padding: "11px 12px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text)", fontWeight: strong ? 700 : 400 }}>{children}</td>; }

const labelStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 6, color: "var(--text-2)", fontSize: 12, fontWeight: 700 };
const inputStyle: CSSProperties = { minWidth: 190, height: 42, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)", color: "var(--text)", padding: "0 12px", fontFamily: "inherit" };
const filterButtonStyle: CSSProperties = { height: 42, padding: "0 16px", border: 0, borderRadius: 10, background: "var(--accent)", color: "#fff", fontWeight: 800, cursor: "pointer" };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 640 };
const sectionTitleStyle: CSSProperties = { margin: "0 0 14px", fontSize: 17, color: "var(--text)", letterSpacing: "-0.015em" };
const emptyStyle: CSSProperties = { margin: 0, color: "var(--text-3)", fontSize: 13 };
const printStyles = `
  @page { size: A4 portrait; margin: 12mm; }
  @media screen and (max-width: 1199px) {
    body aside { display: none !important; }
    .daily-outing-report { padding: 20px 14px 36px !important; }
    .report-controls { flex-direction: column !important; align-items: stretch !important; }
    .report-controls label { width: 100% !important; }
    .report-controls input, .report-controls select, .report-controls button { min-width: 0 !important; width: 100% !important; }
  }
  @media print {
    body { background: #fff !important; }
    aside, .report-actions, .report-controls { display: none !important; }
    .daily-outing-report { max-width: none !important; padding: 0 !important; color: #111 !important; }
    .report-section, .report-grid > * { break-inside: avoid; box-shadow: none !important; }
    .leaflet-control-container { display: none !important; }
  }
`;
