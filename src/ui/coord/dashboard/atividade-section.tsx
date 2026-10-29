import type { Followup } from "@/server/domain/mvp";
import { Button, Card, CardBody, CardHeader } from "@/ui/atalaia";
import { KpiCard } from "@/ui/mvp/kpi-card";
import { WeeklySchedulePanel } from "@/ui/mvp/weekly-schedule-panel";
import { ActivityFeed, VisitChart } from "@/ui/coord/overview";
import { KpiGrid } from "@/ui/coord/dashboard/kpi-grid";

type Props = {
  periodLabel: string;
  periodActions: number;
  periodVisits: number;
  last7Days: number;
  /** Ações por dia nos últimos 7 dias (janela fixa). */
  visitsData: Array<{ dia: string; n: number }>;
  followups: Followup[];
};

/** Atividade: o que foi feito no período — ações, visitas, agenda, saídas e TCI. */
export function AtividadeSection({ periodLabel, periodActions, periodVisits, last7Days, visitsData, followups }: Props) {
  return (
    <div className="grid gap-4">
      <KpiGrid label="Indicadores de atividade">
        <KpiCard label="Total de ações" value={periodActions} sub={`Acompanhamentos registrados · ${periodLabel}`} />
        <KpiCard label="Ações nos últimos 7 dias" value={last7Days} sub="Janela fixa de 7 dias" />
        <KpiCard label="Visitas registradas" value={periodVisits} sub={`Ações do tipo visita · ${periodLabel}`} />
      </KpiGrid>

      <Card aria-labelledby="activity-chart-heading">
        <CardHeader id="activity-chart-heading" title="Ações nos últimos 7 dias" meta="acompanhamentos por dia" />
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

      <WeeklySchedulePanel followups={followups} />

      <Card aria-labelledby="field-heading">
        <CardHeader id="field-heading" title="Saídas e sessões de TCI" meta="atividade de campo" />
        <CardBody className="flex flex-wrap gap-2.5">
          <Button href="/coord/saidas" icon="saidas">
            Ir para Saídas
          </Button>
          <Button href="/coord/tci" icon="encontros">
            Ir para TCI
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
