export const dynamic = "force-dynamic";

import { requireServerAuthSession } from "@/server/auth/session";
import { getDataScopeFromSession, listAccessibleTenantIds } from "@/server/auth/access-scope";
import { listCaregivers, listFollowups, listMembers, listSeeds, listTenants } from "@/server/repositories/mvp-repository";
import { getPeopleDashboardSnapshot } from "@/server/domain/people-dashboard";
import type { DataScope, PeopleDashboardView } from "@/server/domain/mvp";
import { Button, Card, CardBody, CardHeader, EmptyState, PageContainer, PageHeader, Stat } from "@/ui/atalaia";
import { DashboardMap } from "@/ui/mvp/dashboard-map";
import { WeeklySchedulePanel } from "@/ui/mvp/weekly-schedule-panel";
import {
  buildMemberJourneyDistribution,
  buildTemperatureDistribution,
  countOperationalAlerts,
  mapMemberStatusToVisualStatus,
} from "@/ui/mvp/dashboard-status-utils";
import { NeedsCard } from "@/ui/coord/needs-card";
import {
  ActivityFeed,
  CaregiverLoadCard,
  JourneyCard,
  LegendDot,
  PanelTabs,
  SparkStat,
  StatusDonut,
  TemperatureCard,
  VisitChart,
} from "@/ui/coord/overview";
import { ChurchProfilePanel, PeoplePanel } from "@/ui/coord/church-panels";
import { buildChurchProfileDashboard, firstValue, todayDateOnly, type ChurchPeriod } from "@/ui/coord/church-profile";
import {
  BOARD_STATUSES,
  buildNeeds,
  countLateActions,
  daysSince,
  plural,
  seedMapStatus,
  seedStartedAt,
  firstName,
} from "@/ui/coord/seed-utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type DashTab = "geral" | "igreja" | "tci" | "cuidadores" | "acoes";

const TAB_LABELS: Array<{ value: DashTab; label: string }> = [
  { value: "geral", label: "Visão geral" },
  { value: "igreja", label: "Igreja" },
  { value: "tci", label: "TCI" },
  { value: "cuidadores", label: "Cuidadores" },
  { value: "acoes", label: "Últimas ações" },
];

function resolveTab(raw: string | undefined): DashTab {
  // `cuidados` era o nome da antiga aba de triagem e mapa; hoje vive na visão geral.
  if (raw === "igreja" || raw === "tci" || raw === "cuidadores" || raw === "acoes") return raw;
  return "geral";
}

function greeting() {
  const hour = Number(
    new Date().toLocaleString("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }),
  );
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function CoordDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await requireServerAuthSession("coordinator");
  const scope = getDataScopeFromSession(session);
  const activeTab = resolveTab(firstValue(params.tab));

  const [members, caregivers, followups, seeds] = await Promise.all([
    listMembers(scope),
    listCaregivers(scope),
    listFollowups(scope),
    listSeeds(scope),
  ]);

  const now = new Date();
  const needs = buildNeeds({ seeds, members, followups, now });
  const urgentNeeds = needs.filter((item) => item.sev === 3).length;
  const lateActions = countLateActions(members, followups, now);
  const operationalAlerts = countOperationalAlerts(members, seeds);
  const memberJourney = buildMemberJourneyDistribution(members);

  const total = members.length + operationalAlerts.totalOpenContacts;
  const activeMembers = members.filter((member) => member.status === "in_progress").length;
  const completedMembers = members.filter((member) => member.status === "consolidated" || member.status === "inactive").length;
  const newContactsThisWeek = seeds.filter((seed) => daysSince(seedStartedAt(seed), now) < 7).length;
  const weeks = Array.from({ length: 8 }, (_, k) => seeds.filter((seed) => Math.floor(daysSince(seedStartedAt(seed), now) / 7) === 7 - k).length);

  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const visitsData = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const count = followups.filter((followup) => new Date(followup.occurredAt).toDateString() === date.toDateString()).length;
    return { dia: weekdayLabels[date.getDay()], n: count };
  });

  const loadByCaregiver = new Map<string, number>();
  for (const member of members) {
    if (member.caregiverId && member.status !== "inactive") {
      loadByCaregiver.set(member.caregiverId, (loadByCaregiver.get(member.caregiverId) ?? 0) + 1);
    }
  }
  const lastActionByCaregiver = new Map<string, string>();
  const caregiverByMember = new Map(members.map((member) => [member.id, member.caregiverId]));
  for (const followup of followups) {
    const caregiverId = caregiverByMember.get(followup.memberId);
    if (!caregiverId) continue;
    const current = lastActionByCaregiver.get(caregiverId);
    if (!current || followup.occurredAt > current) lastActionByCaregiver.set(caregiverId, followup.occurredAt);
  }
  const caregiverRows = caregivers.map((caregiver) => ({
    id: caregiver.id,
    name: caregiver.name,
    active: caregiver.active,
    load: loadByCaregiver.get(caregiver.id) ?? 0,
    lastActionAt: lastActionByCaregiver.get(caregiver.id) ?? null,
  }));
  const activeCaregiverRows = caregiverRows.filter((row) => row.active).sort((a, b) => b.load - a.load || a.name.localeCompare(b.name, "pt-BR"));
  const caregiversByRecentAction = [...caregiverRows].sort((a, b) => {
    if (a.lastActionAt && b.lastActionAt) return b.lastActionAt.localeCompare(a.lastActionAt);
    if (a.lastActionAt) return -1;
    if (b.lastActionAt) return 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  const mapItems = [
    ...members.map((member) => ({
      id: member.id,
      name: member.name,
      city: member.city || "",
      address: member.address || "",
      status: member.isUrgent && member.status !== "consolidated" && member.status !== "inactive" ? "urgente" : mapMemberStatusToVisualStatus(member.status),
      caregiver: member.caregiverId ? (caregivers.find((item) => item.id === member.caregiverId)?.name ?? null) : null,
      lastContact: member.lastContact ?? null,
      latitude: member.latitude,
      longitude: member.longitude,
      age: member.age,
      birthDate: member.birthDate,
    })),
    ...seeds.map((seed) => ({
      id: seed.id,
      name: seed.referenceName,
      city: seed.city || "",
      address: seed.address || "",
      status: seedMapStatus(seed),
      caregiver: seed.caregiverId ? (caregivers.find((item) => item.id === seed.caregiverId)?.name ?? null) : null,
      lastContact: "Novo contato",
      latitude: seed.latitude,
      longitude: seed.longitude,
      age: seed.age,
      birthDate: null,
    })),
  ];

  const seedCounts = BOARD_STATUSES.map((status) => ({ status, count: seeds.filter((seed) => seed.status === status).length }));

  // Parametros do recorte "Igreja" (so lidos quando a aba esta aberta).
  const churchPeriod = (["day", "month"].includes(firstValue(params.churchPeriod) ?? "") ? firstValue(params.churchPeriod) : "week") as ChurchPeriod;
  const churchDate = firstValue(params.churchDate) ?? todayDateOnly();
  const churchMeetingTypeId = firstValue(params.churchMeetingTypeId) || undefined;
  const peopleView = (firstValue(params.peopleView) === "church" ? "church" : "contacts") as PeopleDashboardView;
  const rawPeoplePeriod = firstValue(params.peoplePeriod);
  const peoplePeriod = rawPeoplePeriod === "day" || rawPeoplePeriod === "month" || rawPeoplePeriod === "week" ? rawPeoplePeriod : "week";
  const peopleDate = firstValue(params.peopleDate) ?? todayDateOnly();
  const peopleMeetingTypeId = firstValue(params.peopleMeetingTypeId) ?? "";
  const peopleFormat = firstValue(params.peopleFormat) === "pdf" ? "pdf" : "csv";
  const selectedPeopleCity = firstValue(params.peopleCity) || "";
  const selectedPeopleTenantId = firstValue(params.peopleTenantId) || "";

  let igrejaBody: React.ReactNode = null;
  let selectedPeopleState = firstValue(params.peopleState) ?? session.membership.tenantState;
  if (activeTab === "igreja") {
    const accessibleTenantIds = await listAccessibleTenantIds(session);
    const accessibleScope: DataScope = { tenantIds: accessibleTenantIds };
    const [tenants, accessibleTenants] = await Promise.all([listTenants(scope), listTenants(accessibleScope)]);
    const availableStates = Array.from(new Set(accessibleTenants.map((tenant) => tenant.state).filter(Boolean))).sort();
    selectedPeopleState = firstValue(params.peopleState) ?? availableStates[0] ?? session.membership.tenantState;
    const stateCities = Array.from(
      new Set(accessibleTenants.filter((tenant) => tenant.state === selectedPeopleState).map((tenant) => tenant.city).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
    const cityTenants = accessibleTenants.filter(
      (tenant) => tenant.state === selectedPeopleState && (!selectedPeopleCity || tenant.city === selectedPeopleCity),
    );

    const peopleSnapshot = await getPeopleDashboardSnapshot(
      {
        view: peopleView,
        period: peoplePeriod,
        referenceDate: peopleDate,
        state: selectedPeopleState,
        city: selectedPeopleCity || null,
        tenantId: selectedPeopleTenantId || null,
        meetingTypeId: peopleMeetingTypeId || null,
      },
      accessibleScope,
    );
    const churchProfile = await buildChurchProfileDashboard({
      scope,
      period: churchPeriod,
      referenceDate: churchDate,
      meetingTypeId: churchMeetingTypeId,
      members,
      caregivers,
      followups,
    });

    const reportParams = new URLSearchParams();
    reportParams.set("format", peopleFormat);
    reportParams.set("period", peoplePeriod);
    reportParams.set("referenceDate", peopleDate);
    reportParams.set("state", selectedPeopleState);
    if (selectedPeopleCity) reportParams.set("city", selectedPeopleCity);
    if (selectedPeopleTenantId) reportParams.set("tenantId", selectedPeopleTenantId);
    if (peopleView === "church" && peopleMeetingTypeId) reportParams.set("meetingTypeId", peopleMeetingTypeId);
    const reportHref = `/api/reports/people/${peopleView === "contacts" ? "contacts" : "church-attendance"}?${reportParams.toString()}`;

    igrejaBody = (
      <div className="grid gap-6">
        <PeoplePanel
          snapshot={peopleSnapshot}
          view={peopleView}
          period={peoplePeriod}
          date={peopleDate}
          state={selectedPeopleState}
          city={selectedPeopleCity}
          tenantId={selectedPeopleTenantId}
          meetingTypeId={peopleMeetingTypeId}
          format={peopleFormat}
          availableStates={availableStates}
          stateCities={stateCities}
          cityTenants={cityTenants}
          meetingTypes={churchProfile.meetingTypes}
          reportHref={reportHref}
        />
        <ChurchProfilePanel
          profile={churchProfile}
          period={churchPeriod}
          date={churchDate}
          meetingTypeId={churchMeetingTypeId ?? ""}
          meetingTypeName={churchMeetingTypeId ? (churchProfile.meetingTypes.find((item) => item.id === churchMeetingTypeId)?.name ?? null) : null}
          tenantName={tenants[0]?.name ?? session.membership.tenantName}
        />
      </div>
    );
  }

  function tabHref(tab: DashTab) {
    if (tab === "geral") return "/coord";
    const query = new URLSearchParams();
    query.set("tab", tab);
    if (tab === "igreja") {
      if (churchPeriod !== "week") query.set("churchPeriod", churchPeriod);
      if (churchDate !== todayDateOnly()) query.set("churchDate", churchDate);
      if (churchMeetingTypeId) query.set("churchMeetingTypeId", churchMeetingTypeId);
      if (peopleView !== "contacts") query.set("peopleView", peopleView);
      if (peoplePeriod !== "week") query.set("peoplePeriod", peoplePeriod);
      if (peopleDate !== todayDateOnly()) query.set("peopleDate", peopleDate);
      if (firstValue(params.peopleState)) query.set("peopleState", selectedPeopleState);
      if (selectedPeopleCity) query.set("peopleCity", selectedPeopleCity);
      if (selectedPeopleTenantId) query.set("peopleTenantId", selectedPeopleTenantId);
      if (peopleMeetingTypeId) query.set("peopleMeetingTypeId", peopleMeetingTypeId);
      if (firstValue(params.peopleFormat)) query.set("peopleFormat", peopleFormat);
    }
    return `/coord?${query.toString()}`;
  }

  const viewerName = firstName(session.user.firstName || `${session.user.firstName} ${session.user.lastName}`);
  const subtitle = `${now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" })} · ${session.membership.tenantName} (${session.membership.tenantCity} - ${session.membership.tenantState})`;
  const firstRun = seeds.length === 0 && members.length === 0;

  // Contatos que aparecem nos itens de “Precisa de alguém” e permitem atribuir no lugar.
  const needsShown = needs.slice(0, 7);
  const needSeedIds = new Set(needsShown.filter((item) => item.kind === "seed").map((item) => item.id));
  const needSeeds = seeds.filter((seed) => needSeedIds.has(seed.id));
  const needsCaregivers = caregivers
    .filter((caregiver) => caregiver.active)
    .map((caregiver) => ({ id: caregiver.id, name: caregiver.name, tenantId: caregiver.tenantId, load: loadByCaregiver.get(caregiver.id) ?? 0 }));

  const temperature = buildTemperatureDistribution(members.filter((member) => member.status !== "inactive"));
  const tempCount = (key: string | null) => temperature.find((item) => item.key === key)?.count ?? 0;

  return (
    <PageContainer>
      <PageHeader
        title={`${greeting()}, ${viewerName}`}
        subtitle={subtitle}
        secondary={
          <Button href={`/coord/relatorios/saidas?date=${todayDateOnly()}&tenantId=${session.membership.tenantId}`} icon="doc">
            Gerar relatório
          </Button>
        }
        action={
          <Button href="/coord/contatos?novo=1" variant="primary" icon="plus">
            Novo contato
          </Button>
        }
      />

      <PanelTabs tabs={TAB_LABELS} active={activeTab} hrefFor={tabHref} />

      {activeTab === "geral" ? (
        firstRun ? (
          <EmptyState
            title="A central está pronta. Falta a primeira pessoa."
            reason="Cadastre quem chegou no último culto ou convide a equipe para cadastrar pela recepção."
            hint={'Use o botão “Novo contato” no topo, ou convide a equipe em Cuidadores.'}
            action={
              <Button href="/coord/cuidadores?aba=canais">Convidar a equipe</Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
              <SparkStat
                label="Novos contatos · 7 dias"
                value={newContactsThisWeek}
                note={`${seeds.length} na jornada`}
                weeks={weeks}
                weeksLabel={`Novos contatos por semana nas últimas 8 semanas: ${weeks.join(", ")}`}
              />
              <Stat
                label="Precisam de alguém"
                value={needs.length}
                note={plural(urgentNeeds, "urgente", "urgentes")}
                tone={needs.length > 0 ? "alert" : "default"}
              />
              <Stat
                label="Ações atrasadas"
                value={lateActions}
                note={`de ${activeMembers} em acompanhamento`}
                tone={lateActions > 0 ? "alert" : "default"}
              />
              <Stat
                label="Consolidados"
                value={members.filter((member) => member.status === "consolidated").length}
                note={`de ${members.length} assistidos`}
              />
            </div>

            <div className="grid gap-4 min-[1000px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="grid content-start gap-4">
                <NeedsCard
                  items={needs}
                  seeds={needSeeds}
                  caregivers={needsCaregivers}
                />
                <JourneyCard counts={seedCounts} />
              </div>
              <div className="grid content-start gap-4">
                <CaregiverLoadCard rows={activeCaregiverRows} />
                <TemperatureCard cold={tempCount("frio")} warm={tempCount("morno")} hot={tempCount("quente")} />
              </div>
            </div>

            <DashboardMap items={mapItems} />
            <WeeklySchedulePanel followups={followups} />
          </div>
        )
      ) : null}

      {activeTab === "igreja" ? igrejaBody : null}

      {activeTab === "tci" ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
            <Stat label="Total acolhidos" value={total} note={`+${newContactsThisWeek} esta semana`} />
            <Stat label="Sendo cuidados" value={activeMembers} note={`${total > 0 ? Math.round((activeMembers / total) * 100) : 0}% da base`} />
            <Stat label="Concluídos" value={completedMembers} note="ciclos consolidados" />
            <Stat label="Novos contatos" value={operationalAlerts.totalOpenContacts} note="em triagem" />
          </div>
          <div className="grid gap-4 min-[900px]:grid-cols-2">
            <Card aria-labelledby="journey-members-heading">
              <CardHeader id="journey-members-heading" title="Jornada dos membros" />
              <CardBody>
                <div className="flex flex-wrap items-center justify-center gap-6">
                  <StatusDonut data={memberJourney} total={members.length} />
                  <ul className="grid min-w-44 flex-1 gap-2">
                    {memberJourney.map((item) => {
                      const pct = members.length > 0 ? Math.round((item.count / members.length) * 100) : 0;
                      return (
                        <li key={item.key} className="flex items-center gap-2.5 text-[13px]">
                          <LegendDot statusKey={item.key} />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          <b className="font-mono font-medium tabular-nums">{item.count}</b>
                          <span className="min-w-8 text-right font-mono text-[11px] text-muted">{pct}%</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </CardBody>
            </Card>
            <Card aria-labelledby="week-actions-heading">
              <CardHeader id="week-actions-heading" title="Ações nos últimos 7 dias" meta={`${followups.length} acompanhamentos`} />
              <CardBody>
                <VisitChart data={visitsData} />
              </CardBody>
            </Card>
          </div>
          <Card aria-labelledby="tci-heading">
            <CardHeader id="tci-heading" title="Sessões de TCI" />
            <CardBody className="grid justify-items-start gap-3">
              <p className="text-[13px] text-muted">Acesse o módulo de TCI para ver sessões, câmaras e participantes.</p>
              <Button href="/coord/tci" icon="encontros">
                Ir para TCI
              </Button>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {activeTab === "cuidadores" ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-3">
            <Stat label="Cuidadores" value={caregivers.length} note={`${caregivers.filter((c) => c.active).length} ativos`} />
            <Stat label="Casos ativos" value={activeMembers} note="assistidos acompanhados" />
            <Stat
              label="Sem cuidador"
              value={operationalAlerts.unassignedPeople}
              note="aguardando vínculo"
              tone={operationalAlerts.unassignedPeople > 0 ? "alert" : "default"}
            />
          </div>
          <CaregiverLoadCard rows={caregiversByRecentAction} showLastAction />
        </div>
      ) : null}

      {activeTab === "acoes" ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-3">
            <Stat label="Total de ações" value={followups.length} note="acompanhamentos registrados" />
            <Stat label="Ações esta semana" value={visitsData.reduce((sum, day) => sum + day.n, 0)} note="últimos 7 dias" />
            <Stat label="Ações vencidas" value={lateActions} note="próximas ações em atraso" tone={lateActions > 0 ? "alert" : "default"} />
          </div>
          <Card aria-labelledby="activity-chart-heading">
            <CardHeader id="activity-chart-heading" title="Atividade semanal" meta="acompanhamentos por dia" />
            <CardBody>
              <VisitChart data={visitsData} />
            </CardBody>
          </Card>
          <ActivityFeed items={followups} />
          <div>
            <Button href="/coord/acompanhamentos" icon="plus">
              Novo acompanhamento
            </Button>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
