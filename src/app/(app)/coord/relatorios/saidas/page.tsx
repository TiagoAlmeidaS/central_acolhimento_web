export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import { isValidDateOnly } from "@/server/domain/daily-outing-report";
import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { getDailyOutingReport } from "@/server/repositories/daily-outing-report-repository";
import { listTenants } from "@/server/repositories/mvp-repository";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  PageContainer,
  PageHeader,
  Select,
  Stat,
  Table,
  Td,
  Th,
  Tr,
} from "@/ui/atalaia";
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
  const today = todayInSaoPaulo();
  const requestedDate = first(params.date) ?? today;
  const requestedDateTo = first(params.dateTo) ?? requestedDate;
  const date = isValidDateOnly(requestedDate) ? requestedDate : today;
  const dateTo = isValidDateOnly(requestedDateTo) && requestedDateTo >= date ? requestedDateTo : date;
  const tenantId = await resolveTenantIdForUserAccess(session, first(params.tenantId) ?? session.membership.tenantId);
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const tenants = await listTenants({ tenantIds: accessibleTenantIds });
  const tenant = tenants.find((item) => item.id === tenantId);
  if (!tenant) throw new Error("Localidade nao encontrada.");
  const report = await getDailyOutingReport(tenant, date, dateTo);
  console.info("daily_outing_report_viewed", {
    version: report.version,
    tenantId: report.tenant.id,
    date: report.date,
    totals: report.totals,
  });
  const openHouses = report.contacts.filter((contact) => contact.openHouse);
  const mappedHouses = openHouses.filter((contact) => contact.latitude !== null && contact.longitude !== null);
  const unmappedHouses = openHouses.filter((contact) => contact.latitude === null || contact.longitude === null);
  const period = dateTo !== date ? "neste período" : "nesta data";

  return (
    <PageContainer className="daily-outing-report grid gap-4">
      <style>{printStyles}</style>
      <PageHeader
        className="mb-0"
        title="Relatório de saídas"
        subtitle={
          <>
            {tenant.name} · {tenant.city}/{tenant.state} ·{" "}
            {report.dateTo !== report.date ? `${formatDate(report.date)} a ${formatDate(report.dateTo)}` : formatDate(report.date)}
            <span className="mt-1 block font-mono text-[11px] text-subtle">
              {report.version} · gerado em {formatInstant(report.generatedAt)} · {report.timezone}
            </span>
          </>
        }
        action={<DailyOutingReportActions tenantId={report.tenant.id} version={report.version} />}
      />

      <form method="get" className="report-controls flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
        <Input name="date" label="De" type="date" defaultValue={date} wrapperClassName="min-w-[150px]" />
        <Input name="dateTo" label="Até" type="date" defaultValue={dateTo} wrapperClassName="min-w-[150px]" />
        <Select
          name="tenantId"
          label="Localidade"
          defaultValue={tenantId}
          wrapperClassName="min-w-[220px]"
          options={tenants.map((item) => ({ value: item.id, label: `${item.name} - ${item.city}/${item.state}` }))}
        />
        <Button type="submit">Atualizar relatório</Button>
      </form>

      <section className="report-grid grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3" aria-label="Totais">
        <Stat label="Saídas realizadas" value={report.totals.completedOutings} />
        <Stat label="Participações" value={report.totals.participations} />
        <Stat label="Novos contatos" value={report.totals.newContacts} />
        <Stat label="Adolescentes" value={report.totals.adolescents} />
        <Stat label="Casas abertas" value={report.totals.openHouses} />
        <Stat
          label="Sem localização"
          value={report.totals.openHousesWithoutCoordinates}
          tone={report.totals.openHousesWithoutCoordinates > 0 ? "alert" : "default"}
        />
      </section>

      {report.totals.completedOutings === 0 ? (
        <EmptyState
          title={`Nenhuma saída concluída ${period}.`}
          reason="O relatório conta só saídas confirmadas e marcadas como concluídas."
          hint={<>Em Saídas, abra a saída confirmada e use &quot;Concluir execução&quot;.</>}
          action={<Button href="/coord/saidas">Ir para saídas</Button>}
        />
      ) : (
        <>
          <ReportSection title="Resultado por tipo de saída">
            <Table caption="Resultado por tipo de saída">
              <thead>
                <tr>
                  <Th>Tipo</Th>
                  <Th>Saídas</Th>
                  <Th>Participações</Th>
                  <Th>Contatos</Th>
                  <Th>Adolescentes</Th>
                  <Th>Casas abertas</Th>
                </tr>
              </thead>
              <tbody>
                {report.byType.map((item) => (
                  <Tr key={item.outingTypeId ?? "unclassified"}>
                    <Td className="font-medium">{item.name}</Td>
                    <Td className="font-mono">{item.outings}</Td>
                    <Td className="font-mono">{item.participations}</Td>
                    <Td className="font-mono">{item.newContacts}</Td>
                    <Td className="font-mono">{item.adolescents}</Td>
                    <Td className="font-mono">{item.openHouses}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </ReportSection>

          <ReportSection title="Saídas realizadas">
            <Table caption="Saídas realizadas">
              <thead>
                <tr>
                  <Th>Saída</Th>
                  <Th>Tipo</Th>
                  <Th>Concluída em</Th>
                  <Th>Participações</Th>
                  <Th>Novos contatos</Th>
                </tr>
              </thead>
              <tbody>
                {report.outings.map((outing) => (
                  <Tr key={outing.id}>
                    <Td className="font-medium">{outing.name}</Td>
                    <Td>{outing.typeName}</Td>
                    <Td className="font-mono">{formatInstant(outing.completedAt)}</Td>
                    <Td className="font-mono">{outing.participationCount}</Td>
                    <Td className="font-mono">{outing.newContactCount}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </ReportSection>

          <ReportSection title="Novos contatos gerados">
            {report.contacts.length === 0 ? (
              <p className="px-4 pb-4 text-muted">Nenhum novo contato registrado {period}.</p>
            ) : (
              <Table caption="Novos contatos gerados">
                <thead>
                  <tr>
                    <Th>Nome</Th>
                    <Th>Idade</Th>
                    <Th>Faixa</Th>
                    <Th>Saída</Th>
                    <Th>Tipo</Th>
                    <Th>Casa aberta</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.contacts.map((contact) => (
                    <Tr key={contact.id}>
                      <Td className="font-medium">{contact.name}</Td>
                      <Td className="font-mono">{contact.age ?? "Não informada"}</Td>
                      <Td>
                        {contact.ageGroup === "adolescent" ? "Adolescente" : contact.ageGroup === "unknown" ? "Não informada" : "Outra idade"}
                      </Td>
                      <Td>{contact.outingName ?? <span className="text-muted">Sem saída</span>}</Td>
                      <Td>{contact.outingTypeName ?? <span className="text-muted">—</span>}</Td>
                      <Td>{contact.openHouse ? "Sim" : "Não"}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </ReportSection>

          <section className="report-section">
            {mappedHouses.length > 0 ? (
              <DashboardMap
                title="Mapa das casas abertas"
                description={`${mappedHouses.length} casa(s) com coordenadas ${period}.`}
                showLegend={false}
                items={mappedHouses.map((contact) => ({
                  id: contact.id,
                  name: contact.name,
                  city: contact.city,
                  address: contact.address,
                  status: "novo",
                  caregiver: null,
                  lastContact: contact.outingName ?? "Contato do dia",
                  latitude: contact.latitude as number,
                  longitude: contact.longitude as number,
                  age: contact.age,
                }))}
              />
            ) : (
              <Card>
                <CardHeader title="Mapa das casas abertas" />
                <CardBody>
                  <p className="text-muted">Nenhuma casa aberta com coordenadas {period}.</p>
                </CardBody>
              </Card>
            )}
          </section>

          {unmappedHouses.length > 0 ? (
            <Card className="report-section">
              <CardHeader title="Casas abertas sem localização no mapa" />
              <CardBody>
                <ul className="m-0 grid list-disc gap-1.5 pl-5">
                  {unmappedHouses.map((contact) => (
                    <li key={contact.id}>
                      {contact.name} · {contact.address || contact.city || "Endereço não informado"}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
        </>
      )}

      <footer className="border-t border-border pt-3 text-[11.5px] leading-normal text-subtle">
        Documento restrito à coordenação. As contagens de casas abertas representam contatos que disponibilizaram uma casa e não
        domicílios deduplicados.
      </footer>
    </PageContainer>
  );
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="report-section">
      <CardHeader title={title} />
      <div className="pt-2">{children}</div>
    </Card>
  );
}

const printStyles = `
  @page { size: A4 portrait; margin: 12mm; }
  @media print {
    html, body { background: #fff !important; }
    aside, nav, .report-actions, .report-controls { display: none !important; }
    .daily-outing-report { max-width: none !important; padding: 0 !important; }
    .daily-outing-report * { background: transparent !important; color: #111 !important; border-color: #bbb !important; box-shadow: none !important; }
    .report-section, .report-grid > * { break-inside: avoid; }
    .leaflet-control-container { display: none !important; }
  }
`;
