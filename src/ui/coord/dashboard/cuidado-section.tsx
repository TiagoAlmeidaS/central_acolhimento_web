import type { PeopleDashboardSnapshot, Seed } from "@/server/domain/mvp";
import { Card, CardBody, CardHeader } from "@/ui/atalaia";
import { KpiCard } from "@/ui/mvp/kpi-card";
import { DashboardMap } from "@/ui/mvp/dashboard-map";
import type { DashboardMapItem } from "@/ui/mvp/dashboard-map-utils";
import type { buildMemberJourneyDistribution, countOperationalAlerts } from "@/ui/mvp/dashboard-status-utils";
import { NeedsCard, type NeedsCaregiver } from "@/ui/coord/needs-card";
import { JourneyCard, LegendDot, StatusDonut, TemperatureCard } from "@/ui/coord/overview";
import { PeopleNominalList, PeopleTimelineCards, WarningList } from "@/ui/coord/church-panels";
import type { NeedItem, SeedStatus } from "@/ui/coord/seed-utils";
import { KpiGrid } from "@/ui/coord/dashboard/kpi-grid";

type Props = {
  needs: NeedItem[];
  needSeeds: Seed[];
  needsCaregivers: NeedsCaregiver[];
  alerts: ReturnType<typeof countOperationalAlerts>;
  /** Pessoas (não linhas) cuja próxima ação mais recente já venceu. */
  overduePeople: number;
  total: number;
  newContactsThisWeek: number;
  activeMembers: number;
  completedMembers: number;
  membersCount: number;
  memberJourney: ReturnType<typeof buildMemberJourneyDistribution>;
  seedCounts: Array<{ status: SeedStatus; count: number }>;
  temperature: { cold: number; warm: number; hot: number };
  snapshot: PeopleDashboardSnapshot;
  mapItems: DashboardMapItem[];
};

/** Cuidado: quem espera uma ação (primeiro), quem está sendo cuidado e o que está parado. */
export function CuidadoSection({
  needs,
  needSeeds,
  needsCaregivers,
  alerts,
  overduePeople,
  total,
  newContactsThisWeek,
  activeMembers,
  completedMembers,
  membersCount,
  memberJourney,
  seedCounts,
  temperature,
  snapshot,
  mapItems,
}: Props) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 min-[1000px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <NeedsCard items={needs} seeds={needSeeds} caregivers={needsCaregivers} />
        <div className="grid content-start gap-4">
          <JourneyCard counts={seedCounts} />
          <TemperatureCard cold={temperature.cold} warm={temperature.warm} hot={temperature.hot} />
        </div>
      </div>

      <KpiGrid label="Indicadores de cuidado">
        <KpiCard label="Total acolhidos" value={total} sub={`+${newContactsThisWeek} nos últimos 7 dias`} />
        <KpiCard
          label="Sendo cuidados"
          value={activeMembers}
          sub={`${total > 0 ? Math.round((activeMembers / total) * 100) : 0}% da base`}
        />
        <KpiCard label="Concluídos" value={completedMembers} sub="Ciclos consolidados" />
        <KpiCard label="Contatos na triagem" value={alerts.totalOpenContacts} sub="Novos, contatados ou em espera" snapshot />
        <KpiCard label="Esperando visita" value={alerts.waitingVisits} sub="Casas abertas aguardando visita" snapshot />
        <KpiCard
          label="Sem cuidador"
          value={alerts.unassignedPeople}
          sub={`${alerts.membersWithoutCaregiver} membro(s) + ${alerts.contactsWithoutCaregiver} contato(s)`}
          tone={alerts.unassignedPeople > 0 ? "alert" : "default"}
          snapshot
        />
        <KpiCard
          label="Casos urgentes"
          value={alerts.urgentMembers}
          sub="Prioridade de resposta"
          tone={alerts.urgentMembers > 0 ? "alert" : "default"}
          snapshot
        />
        <KpiCard
          label="Pessoas com ação vencida"
          value={overduePeople}
          sub="1 por pessoa, pela próxima ação mais recente"
          tone={overduePeople > 0 ? "alert" : "default"}
          snapshot
        />
        <KpiCard label="Atualizados no período" value={snapshot.summary.updatedInPeriod ?? 0} sub="Baseado em updated_at" />
      </KpiGrid>

      <WarningList warnings={snapshot.warnings} />

      <Card aria-labelledby="journey-members-heading">
        <CardHeader id="journey-members-heading" title="Jornada dos membros" meta="distribuição por situação" />
        <CardBody>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <StatusDonut data={memberJourney} total={membersCount} />
            <ul className="grid min-w-44 flex-1 gap-2">
              {memberJourney.map((item) => {
                const pct = membersCount > 0 ? Math.round((item.count / membersCount) * 100) : 0;
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

      <PeopleTimelineCards snapshot={snapshot} contacts />
      <PeopleNominalList snapshot={snapshot} contacts />
      <DashboardMap items={mapItems} />
    </div>
  );
}
