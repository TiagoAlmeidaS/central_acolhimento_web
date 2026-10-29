import { CaregiverLoadCard, type CaregiverLoadRow } from "@/ui/coord/overview";
import { KpiCard } from "@/ui/mvp/kpi-card";
import { KpiGrid } from "@/ui/coord/dashboard/kpi-grid";

type Props = {
  /** Já ordenados pela ação mais recente. */
  rows: CaregiverLoadRow[];
  total: number;
  active: number;
  averageCaseload: number;
  overloaded: number;
  stalled: number;
  /** Casos a partir dos quais o cuidador conta como sobrecarregado. */
  overloadThreshold: number;
  stalledDays: number;
};

/** Equipe: quem cuida de quem, com que carga e quem está sem movimento. */
export function EquipeSection({ rows, total, active, averageCaseload, overloaded, stalled, overloadThreshold, stalledDays }: Props) {
  return (
    <div className="grid gap-4">
      <KpiGrid label="Indicadores da equipe">
        <KpiCard label="Total de cuidadores" value={total} sub={`${active} ativos`} />
        <KpiCard label="Carga média" value={averageCaseload} sub="Casos por cuidador ativo" snapshot />
        <KpiCard
          label="Sobrecarregados"
          value={overloaded}
          sub={`${overloadThreshold} casos ou mais`}
          tone={overloaded > 0 ? "alert" : "default"}
          snapshot
        />
        <KpiCard
          label="Sem movimento"
          value={stalled}
          sub={`Ativos sem ação há ${stalledDays} dias ou mais`}
          tone={stalled > 0 ? "alert" : "default"}
          snapshot
        />
      </KpiGrid>
      <CaregiverLoadCard rows={rows} showLastAction meta={`${active} ativos de ${total} · ordenado por última ação`} />
    </div>
  );
}
