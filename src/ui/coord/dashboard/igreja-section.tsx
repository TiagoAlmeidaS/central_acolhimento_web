import type { PeopleDashboardSnapshot } from "@/server/domain/mvp";
import { KpiCard } from "@/ui/mvp/kpi-card";
import { ChurchAttentionCard, ChurchTrendCard, PeopleNominalList, WarningList } from "@/ui/coord/church-panels";
import { formatComparison, type ChurchProfileDashboard } from "@/ui/coord/church-profile";
import { KpiGrid } from "@/ui/coord/dashboard/kpi-grid";

type Props = {
  profile: ChurchProfileDashboard;
  snapshot: PeopleDashboardSnapshot;
  meetingTypeName: string | null;
};

/** Igreja: quem está reunindo, com que frequência e quem parou de aparecer. */
export function IgrejaSection({ profile, snapshot, meetingTypeName }: Props) {
  const hasBase = profile.attendanceBase.eligible > 0;
  const withoutPresence = snapshot.summary.peopleWithoutPresence ?? 0;
  return (
    <div className="grid gap-4">
      <KpiGrid label="Indicadores da igreja">
        <KpiCard label="Membros da igreja" value={profile.activeMemberships} sub="Vínculos ativos" />
        <KpiCard
          label="Pessoas que reuniram"
          value={profile.presentPeople.value}
          sub={`${profile.closedOccurrences.length} chamada(s) · ${formatComparison(profile.presentPeople)}`}
        />
        <KpiCard
          label="Frequência média"
          value={hasBase ? `${profile.averageFrequency.value}%` : "—"}
          sub={hasBase ? `${profile.attendanceBase.present} de ${profile.attendanceBase.eligible}` : "Sem chamada fechada"}
        />
        <KpiCard
          label="Sem presença"
          value={withoutPresence}
          sub="Sem nenhuma presença no período"
          tone={withoutPresence > 0 ? "alert" : "default"}
        />
        <KpiCard label="Justificadas" value={snapshot.summary.justifiedAbsences ?? 0} sub="Mantidas no denominador" />
        <KpiCard
          label="Chamadas pendentes"
          value={profile.pendingOccurrences.length}
          sub="Sem fechamento · não entram na frequência"
          tone={profile.pendingOccurrences.length > 0 ? "alert" : "default"}
        />
        <KpiCard
          label="Para revisão"
          value={profile.attention.length}
          sub="Sinais de frequência e cuidado"
          tone={profile.attention.length > 0 ? "alert" : "default"}
        />
      </KpiGrid>

      <WarningList warnings={snapshot.warnings} />

      <div className="grid gap-4 min-[900px]:grid-cols-2">
        <ChurchTrendCard profile={profile} meetingTypeName={meetingTypeName} />
        <ChurchAttentionCard profile={profile} />
      </div>

      <PeopleNominalList snapshot={snapshot} contacts={false} />
    </div>
  );
}
