export const dynamic = "force-dynamic";

import { requireServerAuthSession } from "@/server/auth/session";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { listCaregivers, listFollowups, listMembers, listSeeds, listTenants } from "@/server/repositories/mvp-repository";
import { getPeopleDashboardSnapshot } from "@/server/domain/people-dashboard";
import {
  addDays,
  buildRecentDayRange,
  dateOnlyInDashboardTimezone,
  parseDateOnly,
  todayDateOnly,
} from "@/server/domain/dashboard-date";
import type { DataScope, PeopleDashboardView, SeedOriginChannel } from "@/server/domain/mvp";
import { summarizeAcquisition } from "@/server/domain/acquisition";
import { SEED_ORIGIN_CHANNEL_LABELS, isSeedOriginChannel } from "@/lib/seed-origin";
import { filterTenantIdsByRecorte } from "@/lib/listing-filters";
import { Button, EmptyState, PageContainer, PageHeader } from "@/ui/atalaia";
import type { DashboardMapItem } from "@/ui/mvp/dashboard-map-utils";
import {
  buildMemberJourneyDistribution,
  buildTemperatureDistribution,
  countOperationalAlerts,
  countPeopleWithOverdueNextAction,
  mapMemberStatusToVisualStatus,
} from "@/ui/mvp/dashboard-status-utils";
import { CoordAcquisitionSection } from "@/ui/mvp/coord-acquisition-section";
import { PanelTabs } from "@/ui/coord/overview";
import {
  buildChurchProfileDashboard,
  firstValue,
  isDateBetween,
  resolvePeriodRange,
  type ChurchPeriod,
} from "@/ui/coord/church-profile";
import { BOARD_STATUSES, buildNeeds, firstName, seedMapStatus } from "@/ui/coord/seed-utils";
import { AtividadeSection } from "@/ui/coord/dashboard/atividade-section";
import { CuidadoSection } from "@/ui/coord/dashboard/cuidado-section";
import { EquipeSection } from "@/ui/coord/dashboard/equipe-section";
import { IgrejaSection } from "@/ui/coord/dashboard/igreja-section";
import { RecorteBar } from "@/ui/coord/dashboard/recorte-bar";
import { DASH_SEGMENTS, resolveSegment, type DashSegment } from "@/ui/coord/dashboard/segments";

// Id impossível: usado para montar um DataScope que não casa com nenhuma
// localidade, já que tenantIds vazio é interpretado como "sem filtro".
const SCOPE_SEM_LOCALIDADE = "00000000-0000-0000-0000-000000000000";

/** Casos a partir dos quais um cuidador conta como sobrecarregado (KPI da Equipe). */
const OVERLOAD_THRESHOLD = 4;
/** Dias sem nenhuma ação para um cuidador ativo contar como "sem movimento". */
const STALLED_DAYS = 14;
const DAY_MS = 86_400_000;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function greeting() {
  const hour = Number(
    new Date().toLocaleString("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }),
  );
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function CoordDashboardPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const accessibleScope: DataScope = { tenantIds: accessibleTenantIds };

  // --- Recorte global ------------------------------------------------------
  // Um único conjunto de parâmetros vale para a página inteira. Os nomes antigos
  // (churchPeriod/peoplePeriod, churchDate/peopleDate, churchMeetingTypeId/
  // peopleMeetingTypeId, peopleState/peopleCity/peopleTenantId) seguem sendo
  // lidos como fallback para que URLs salvas antes da unificação continuem
  // funcionando.
  const readParam = (...names: string[]) => {
    for (const name of names) {
      const value = firstValue(resolvedSearchParams[name]);
      if (value) return value;
    }
    return undefined;
  };

  const activeSegment = resolveSegment(readParam("seg", "tab"));
  const rawPeriod = readParam("period", "peoplePeriod", "churchPeriod");
  const period: ChurchPeriod = rawPeriod === "day" || rawPeriod === "month" ? rawPeriod : "week";
  const referenceDate = readParam("date", "peopleDate", "churchDate") ?? todayDateOnly();
  const selectedMeetingTypeId = readParam("meetingTypeId", "peopleMeetingTypeId", "churchMeetingTypeId") ?? "";
  const rawOrigin = readParam("origin");
  const selectedOrigin: SeedOriginChannel | null = isSeedOriginChannel(rawOrigin) ? rawOrigin : null;
  const reportFormat = readParam("format", "peopleFormat") === "pdf" ? "pdf" : "csv";
  // A lente do bloco de pessoas deixou de ser um filtro próprio: o segmento decide.
  const peopleView: PeopleDashboardView = activeSegment === "igreja" ? "church" : "contacts";

  // Tudo carrega pelo escopo acessível -- o mesmo universo que os seletores da
  // barra de recorte oferecem e que getPeopleDashboardSnapshot já usa. É o que
  // listAccessibleTenantIds garante: apenas as localidades em que o usuário tem
  // vínculo (listUserMemberships), nunca a base inteira.
  const [members, caregivers, followups, seeds, accessibleTenants] = await Promise.all([
    listMembers(accessibleScope),
    listCaregivers(accessibleScope),
    listFollowups(accessibleScope),
    listSeeds(accessibleScope),
    listTenants(accessibleScope),
  ]);
  const availableStates = Array.from(new Set(accessibleTenants.map((tenant) => tenant.state).filter(Boolean))).sort();
  const defaultState = availableStates.includes(session.membership.tenantState)
    ? session.membership.tenantState
    : (availableStates[0] ?? session.membership.tenantState);
  const selectedState = readParam("state", "peopleState") ?? defaultState;
  const stateCities = Array.from(
    new Set(accessibleTenants.filter((tenant) => tenant.state === selectedState).map((tenant) => tenant.city).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const selectedCity = readParam("city", "peopleCity") ?? "";
  const cityTenants = accessibleTenants.filter(
    (tenant) => tenant.state === selectedState && (!selectedCity || tenant.city === selectedCity),
  );
  const selectedTenantId = readParam("tenantId", "peopleTenantId") ?? "";

  // Localidades acessíveis que sobrevivem ao recorte: é por elas que o recorte
  // passa a valer também fora do bloco de Pessoas. Precisa sair de
  // accessibleTenants (a mesma fonte dos seletores acima), senão escolher uma
  // localidade acessível fora da sessão zeraria a página inteira.
  const recorteTenantIds = filterTenantIdsByRecorte(accessibleTenants, {
    state: selectedState,
    city: selectedCity,
    tenantId: selectedTenantId,
  });
  const recorteTenantIdSet = new Set(recorteTenantIds);
  const inRecorte = (tenantId: string) => recorteTenantIdSet.has(tenantId);
  // tenantIds vazio significa "sem filtro" nos repositórios, então um recorte que
  // não casa com nenhuma localidade acessível precisa de um escopo que não casa
  // com nada -- caso contrário a Igreja mostraria a base inteira enquanto o
  // restante da página, filtrado em memória por inRecorte, mostra zero.
  const recorteScope: DataScope =
    recorteTenantIds.length > 0 ? { tenantIds: recorteTenantIds } : { tenantIds: [SCOPE_SEM_LOCALIDADE] };

  const scopedMembers = members.filter((member) => inRecorte(member.tenantId));
  const originSeeds = selectedOrigin
    ? seeds.filter((seed) => (seed.originChannel ?? "other") === selectedOrigin)
    : seeds;
  const scopedSeeds = originSeeds.filter((seed) => inRecorte(seed.tenantId));
  const scopedMemberIds = new Set(scopedMembers.map((member) => member.id));
  const scopedFollowups = followups.filter((followup) =>
    followup.memberId ? scopedMemberIds.has(followup.memberId) : inRecorte(followup.tenantId),
  );

  const globalRange = resolvePeriodRange(period, referenceDate);

  // O snapshot de pessoas e o perfil da igreja só alimentam Cuidado e Igreja; os outros
  // segmentos não pagam essas consultas.
  const needsPeopleSnapshot = activeSegment === "cuidado" || activeSegment === "igreja";
  const peopleSnapshot = needsPeopleSnapshot
    ? await getPeopleDashboardSnapshot(
        {
          view: peopleView,
          period,
          referenceDate,
          state: selectedState,
          city: selectedCity || null,
          tenantId: selectedTenantId || null,
          meetingTypeId: selectedMeetingTypeId || null,
        },
        accessibleScope,
      )
    : null;
  const churchProfile =
    activeSegment === "igreja"
      ? await buildChurchProfileDashboard({
          scope: recorteScope,
          period,
          referenceDate,
          meetingTypeId: selectedMeetingTypeId || undefined,
          members: scopedMembers,
          caregivers,
          followups: scopedFollowups,
        })
      : null;
  const selectedChurchMeetingType = selectedMeetingTypeId
    ? (churchProfile?.meetingTypes.find((item) => item.id === selectedMeetingTypeId) ?? null)
    : null;

  const peopleReportParams = new URLSearchParams();
  peopleReportParams.set("format", reportFormat);
  peopleReportParams.set("period", period);
  peopleReportParams.set("referenceDate", referenceDate);
  peopleReportParams.set("state", selectedState);
  if (selectedCity) peopleReportParams.set("city", selectedCity);
  if (selectedTenantId) peopleReportParams.set("tenantId", selectedTenantId);
  if (peopleView === "church" && selectedMeetingTypeId) {
    peopleReportParams.set("meetingTypeId", selectedMeetingTypeId);
  }
  const peopleReportHref = `/api/reports/people/${peopleView === "contacts" ? "contacts" : "church-attendance"}?${peopleReportParams.toString()}`;

  const now = new Date();
  const recentDays = buildRecentDayRange(7);

  // --- Métricas de cuidado ---------------------------------------------------
  const operationalAlerts = countOperationalAlerts(scopedMembers, scopedSeeds);
  const memberJourney = buildMemberJourneyDistribution(scopedMembers);
  const total = scopedMembers.length + operationalAlerts.totalOpenContacts;
  const activeMembers = scopedMembers.filter((member) => member.status === "in_progress").length;
  const completedMembers = scopedMembers.filter(
    (member) => member.status === "consolidated" || member.status === "inactive",
  ).length;
  const newContactsThisWeek = scopedSeeds.filter((seed) => {
    const createdOn = dateOnlyInDashboardTimezone(seed.createdAt);
    return !!createdOn && createdOn >= recentDays[0];
  }).length;
  // Regra única de ação vencida: uma por pessoa, pela próxima ação mais recente.
  const overduePeople = countPeopleWithOverdueNextAction(scopedFollowups);
  const seedCounts = BOARD_STATUSES.map((status) => ({
    status,
    count: scopedSeeds.filter((seed) => seed.status === status).length,
  }));
  const temperature = buildTemperatureDistribution(scopedMembers.filter((member) => member.status !== "inactive"));
  const tempCount = (key: string | null) => temperature.find((item) => item.key === key)?.count ?? 0;

  // "Precisa de alguém": a fila de trabalho do recorte, com atribuição no próprio lugar.
  const needs = buildNeeds({ seeds: scopedSeeds, members: scopedMembers, followups: scopedFollowups, now });
  const needsShown = needs.slice(0, 7);
  const needSeedIds = new Set(needsShown.filter((item) => item.kind === "seed").map((item) => item.id));
  const needSeeds = scopedSeeds.filter((seed) => needSeedIds.has(seed.id));

  // Carga = assistidos ativos por cuidador (mesma conta do limite de atribuição).
  const loadByCaregiver = new Map<string, number>();
  for (const member of members) {
    if (member.caregiverId && member.status !== "inactive") {
      loadByCaregiver.set(member.caregiverId, (loadByCaregiver.get(member.caregiverId) ?? 0) + 1);
    }
  }
  const needsCaregivers = caregivers
    .filter((caregiver) => caregiver.active)
    .map((caregiver) => ({
      id: caregiver.id,
      name: caregiver.name,
      tenantId: caregiver.tenantId,
      load: loadByCaregiver.get(caregiver.id) ?? 0,
    }));

  // --- Atividade -------------------------------------------------------------
  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const visitsData = recentDays.map((day) => {
    const label = weekdayLabels[parseDateOnly(day).getUTCDay()];
    const count = scopedFollowups.filter((followup) => dateOnlyInDashboardTimezone(followup.occurredAt) === day).length;
    return { dia: label, n: count };
  });
  // Ações dentro do recorte de período: o segmento Atividade responde "o que foi
  // feito no período", então seus cartões não podem contar a base histórica.
  const periodFollowups = scopedFollowups.filter((followup) => {
    const occurredOn = dateOnlyInDashboardTimezone(followup.occurredAt);
    return !!occurredOn && isDateBetween(occurredOn, globalRange.start, globalRange.end);
  });

  // --- Aquisição: contatos criados dentro do recorte global ----------------------
  const acquisitionSeeds = scopedSeeds.filter((seed) => {
    const createdOn = dateOnlyInDashboardTimezone(seed.createdAt);
    return !!createdOn && isDateBetween(createdOn, globalRange.start, globalRange.end);
  });
  const acquisition = summarizeAcquisition(acquisitionSeeds);
  // Quem cadastrou só tem nome quando o usuário da localidade também é cuidador;
  // o resto cai no rótulo honesto do próprio módulo de aquisição.
  const registrarNames = Object.fromEntries(
    caregivers
      .filter((caregiver) => caregiver.tenantUserId)
      .map((caregiver) => [caregiver.tenantUserId as string, caregiver.name]),
  );
  // Ritmo de entrada nas últimas 8 semanas (janela fixa, não segue o período do recorte).
  const weeks = Array.from({ length: 8 }, () => 0);
  if (activeSegment === "aquisicao") {
    const todayMs = parseDateOnly(todayDateOnly()).getTime();
    for (const seed of scopedSeeds) {
      const createdOn = dateOnlyInDashboardTimezone(seed.createdAt);
      if (!createdOn) continue;
      const daysAgo = Math.floor((todayMs - parseDateOnly(createdOn).getTime()) / DAY_MS);
      if (daysAgo < 0 || daysAgo >= 56) continue;
      weeks[7 - Math.floor(daysAgo / 7)] += 1;
    }
  }

  // --- Equipe ----------------------------------------------------------------
  const scopedCaregivers = caregivers.filter((caregiver) => inRecorte(caregiver.tenantId));
  const caregiversTotal = scopedCaregivers.length;
  const caregiversActive = scopedCaregivers.filter((caregiver) => caregiver.active).length;
  const caregiverByMember = new Map(scopedMembers.map((member) => [member.id, member.caregiverId]));
  const lastActionByCaregiver = new Map<string, string>();
  for (const followup of scopedFollowups) {
    const caregiverId = caregiverByMember.get(followup.memberId);
    if (!caregiverId) continue;
    const current = lastActionByCaregiver.get(caregiverId);
    if (!current || followup.occurredAt > current) lastActionByCaregiver.set(caregiverId, followup.occurredAt);
  }
  const caregiverRows = scopedCaregivers
    .map((caregiver) => ({
      id: caregiver.id,
      name: caregiver.name,
      active: caregiver.active,
      load: loadByCaregiver.get(caregiver.id) ?? 0,
      lastActionAt: lastActionByCaregiver.get(caregiver.id) ?? null,
    }))
    .sort((a, b) => {
      if (a.lastActionAt && b.lastActionAt) return b.lastActionAt.localeCompare(a.lastActionAt);
      if (a.lastActionAt) return -1;
      if (b.lastActionAt) return 1;
      return a.name.localeCompare(b.name, "pt-BR");
    });
  const activeCaregiverRows = caregiverRows.filter((row) => row.active);
  const overloadedCaregivers = activeCaregiverRows.filter((row) => row.load >= OVERLOAD_THRESHOLD).length;
  const stalledThreshold = addDays(todayDateOnly(), -STALLED_DAYS);
  const stalledCaregivers = activeCaregiverRows.filter(
    (row) => !row.lastActionAt || (dateOnlyInDashboardTimezone(row.lastActionAt) ?? "") < stalledThreshold,
  ).length;
  const averageCaseload =
    caregiversActive > 0
      ? Math.round((activeCaregiverRows.reduce((sum, row) => sum + row.load, 0) / caregiversActive) * 10) / 10
      : 0;

  // --- Mapa ------------------------------------------------------------------
  const caregiverNameById = new Map(caregivers.map((caregiver) => [caregiver.id, caregiver.name]));
  const mapItems: DashboardMapItem[] =
    activeSegment === "cuidado"
      ? [
          ...scopedMembers.map((member) => ({
            id: member.id,
            name: member.name,
            city: member.city || "",
            address: member.address || "",
            status:
              member.isUrgent && member.status !== "consolidated" && member.status !== "inactive"
                ? "urgente"
                : mapMemberStatusToVisualStatus(member.status),
            caregiver: member.caregiverId ? (caregiverNameById.get(member.caregiverId) ?? null) : null,
            lastContact: member.lastContact ?? null,
            latitude: member.latitude,
            longitude: member.longitude,
            age: member.age,
            birthDate: member.birthDate,
          })),
          ...scopedSeeds.map((seed) => ({
            id: seed.id,
            name: seed.referenceName,
            city: seed.city || "",
            address: seed.address || "",
            status: seedMapStatus(seed),
            caregiver: seed.caregiverId ? (caregiverNameById.get(seed.caregiverId) ?? null) : null,
            lastContact: "Novo contato",
            latitude: seed.latitude,
            longitude: seed.longitude,
            age: seed.age,
            birthDate: null,
          })),
        ]
      : [];

  // --- Cabeçalho e navegação -----------------------------------------------------
  const activeSegmentDef = DASH_SEGMENTS.find((segment) => segment.value === activeSegment) ?? DASH_SEGMENTS[0];
  const scopeLabel = [
    globalRange.label,
    selectedState,
    selectedCity || null,
    selectedTenantId ? (accessibleTenants.find((tenant) => tenant.id === selectedTenantId)?.name ?? null) : null,
    selectedOrigin ? SEED_ORIGIN_CHANNEL_LABELS[selectedOrigin] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  /** Recorte preservado na troca de segmento — vale para TODOS os segmentos. */
  function segmentHref(segment: DashSegment) {
    const params = new URLSearchParams();
    params.set("seg", segment);
    if (period !== "week") params.set("period", period);
    if (referenceDate !== todayDateOnly()) params.set("date", referenceDate);
    if (selectedState) params.set("state", selectedState);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedTenantId) params.set("tenantId", selectedTenantId);
    if (selectedMeetingTypeId) params.set("meetingTypeId", selectedMeetingTypeId);
    if (selectedOrigin) params.set("origin", selectedOrigin);
    if (reportFormat !== "csv") params.set("format", reportFormat);
    return `/coord?${params.toString()}`;
  }

  const viewerName = firstName(session.user.firstName || `${session.user.firstName} ${session.user.lastName}`);
  const subtitle = `${now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" })} · ${session.membership.tenantName} (${session.membership.tenantCity} - ${session.membership.tenantState})`;
  // Base vazia de verdade (todas as localidades acessíveis): com recorte vazio o filtro continua útil.
  const firstRun = seeds.length === 0 && members.length === 0;

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

      {firstRun ? (
        <EmptyState
          title="A central está pronta. Falta a primeira pessoa."
          reason="Cadastre quem chegou no último culto ou convide a equipe para cadastrar pela recepção."
          hint="Use o botão “Novo contato” no topo, ou convide a equipe em Cuidadores."
          action={<Button href="/coord/cuidadores?aba=canais">Convidar a equipe</Button>}
        />
      ) : (
        <>
          <RecorteBar
            segment={activeSegment}
            period={period}
            referenceDate={referenceDate}
            availableStates={availableStates}
            state={selectedState}
            stateCities={stateCities}
            city={selectedCity}
            cityTenants={cityTenants}
            tenantId={selectedTenantId}
            origin={selectedOrigin}
            meetingTypes={churchProfile?.meetingTypes ?? []}
            meetingTypeId={selectedMeetingTypeId}
            format={reportFormat}
            scopeLabel={scopeLabel}
            exportHref={peopleReportHref}
          />

          <PanelTabs tabs={DASH_SEGMENTS} active={activeSegment} hrefFor={segmentHref} label="Segmentos do painel" />
          <p className="mb-4 text-muted">{activeSegmentDef.question}</p>

          {activeSegment === "cuidado" && peopleSnapshot ? (
            <CuidadoSection
              needs={needs}
              needSeeds={needSeeds}
              needsCaregivers={needsCaregivers}
              alerts={operationalAlerts}
              overduePeople={overduePeople}
              total={total}
              newContactsThisWeek={newContactsThisWeek}
              activeMembers={activeMembers}
              completedMembers={completedMembers}
              membersCount={scopedMembers.length}
              memberJourney={memberJourney}
              seedCounts={seedCounts}
              temperature={{ cold: tempCount("frio"), warm: tempCount("morno"), hot: tempCount("quente") }}
              snapshot={peopleSnapshot}
              mapItems={mapItems}
            />
          ) : null}

          {activeSegment === "aquisicao" ? (
            <CoordAcquisitionSection
              summary={acquisition}
              periodLabel={globalRange.label}
              registrarNames={registrarNames}
              trend={{
                weeks,
                total: weeks.reduce((sum, value) => sum + value, 0),
                label: `Novos contatos por semana nas últimas 8 semanas: ${weeks.join(", ")}`,
              }}
            />
          ) : null}

          {activeSegment === "igreja" && churchProfile && peopleSnapshot ? (
            <IgrejaSection
              profile={churchProfile}
              snapshot={peopleSnapshot}
              meetingTypeName={selectedChurchMeetingType?.name ?? null}
            />
          ) : null}

          {activeSegment === "equipe" ? (
            <EquipeSection
              rows={caregiverRows}
              total={caregiversTotal}
              active={caregiversActive}
              averageCaseload={averageCaseload}
              overloaded={overloadedCaregivers}
              stalled={stalledCaregivers}
              overloadThreshold={OVERLOAD_THRESHOLD}
              stalledDays={STALLED_DAYS}
            />
          ) : null}

          {activeSegment === "atividade" ? (
            <AtividadeSection
              periodLabel={globalRange.label}
              periodActions={periodFollowups.length}
              periodVisits={periodFollowups.filter((followup) => followup.type === "visit").length}
              last7Days={visitsData.reduce((sum, day) => sum + day.n, 0)}
              visitsData={visitsData}
              followups={scopedFollowups}
            />
          ) : null}
        </>
      )}
    </PageContainer>
  );
}
