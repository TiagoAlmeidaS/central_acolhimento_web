import { Avatar, Card, CardBody, CardHeader, EmptyState, cx } from "@/ui/atalaia";
import { KpiCard } from "@/ui/mvp/kpi-card";
import { SparkStat } from "@/ui/coord/overview";
import {
  ACQUISITION_UNKNOWN_REGISTRAR_KEY,
  ACQUISITION_UNKNOWN_REGISTRAR_LABEL,
  type AcquisitionSummary,
} from "@/server/domain/acquisition";

type Props = {
  summary: AcquisitionSummary;
  /** Rótulo do período do recorte global, só para o texto de apoio. */
  periodLabel: string;
  /** tenant_user_id -> nome, quando for possível resolver quem cadastrou. */
  registrarNames: Record<string, string>;
  /** Ritmo de entrada das últimas semanas (independe do período do recorte). */
  trend?: { weeks: number[]; total: number; label: string };
};

function registrarLabel(key: string, tenantUserId: string | null, names: Record<string, string>) {
  if (key === ACQUISITION_UNKNOWN_REGISTRAR_KEY || !tenantUserId) return ACQUISITION_UNKNOWN_REGISTRAR_LABEL;
  return names[tenantUserId] ?? `Usuário ${tenantUserId.slice(0, 8)}`;
}

export function CoordAcquisitionSection({ summary, periodLabel, registrarNames, trend }: Props) {
  const maxChannelCount = summary.channels.reduce((max, item) => Math.max(max, item.count), 0);
  const withoutOriginPercent = summary.total > 0 ? Math.round((summary.withoutOriginChannel / summary.total) * 100) : 0;

  return (
    <div className="grid gap-4">
      <section aria-label="Indicadores de aquisição" className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        <KpiCard label="Pessoas novas" value={summary.total} sub={`Cadastros em ${periodLabel}`} />
        <KpiCard
          label="Origem principal"
          value={summary.topChannel ? summary.topChannel.label : "—"}
          sub={
            summary.topChannel
              ? `${summary.topChannel.count} pessoa(s) · ${summary.topChannel.percent}% do período`
              : "Sem entradas no período"
          }
        />
        <KpiCard
          label="Origem sem registro"
          value={summary.withoutOriginChannel}
          sub={`Fila de reclassificação · ${withoutOriginPercent}% das entradas`}
          tone={summary.withoutOriginChannel > 0 ? "alert" : "default"}
        />
        <KpiCard
          label="Taxa de 1º contato"
          value={summary.firstContactRate === null ? "—" : `${summary.firstContactRate}%`}
          sub={
            summary.firstContactRate === null
              ? "Sem base no período"
              : `${summary.firstContactCount} de ${summary.total} abordados`
          }
        />
        <KpiCard
          label="Novos sem cuidador"
          value={summary.withoutCaregiver}
          sub="Entre as pessoas novas do período"
          tone={summary.withoutCaregiver > 0 ? "alert" : "default"}
        />
        {trend ? (
          <SparkStat
            label="Ritmo semanal"
            value={trend.total}
            note="em 8 semanas"
            weeks={trend.weeks}
            weeksLabel={trend.label}
          />
        ) : null}
      </section>

      <div className="grid gap-4 min-[900px]:grid-cols-2">
        <Card aria-labelledby="funnel-heading">
          <CardHeader id="funnel-heading" title="Funil por origem" meta="do maior volume para o menor" />
          <CardBody>
            {summary.channels.length > 0 ? (
              <ul className="grid gap-3">
                {summary.channels.map((item) => (
                  <li key={item.channel} className="grid gap-1.5">
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="min-w-0 truncate font-medium">{item.label}</span>
                      <span className="shrink-0 font-mono tabular-nums text-muted">
                        {item.count} · {item.percent}%
                      </span>
                    </div>
                    <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-sunken">
                      <span
                        className={cx("block h-full rounded-full", item.channel === "other" ? "bg-subtle" : "bg-primary")}
                        style={{ width: `${maxChannelCount > 0 ? Math.max((item.count / maxChannelCount) * 100, 3) : 0}%` }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nenhum cadastro neste recorte."
                reason="Ninguém foi cadastrado no período e na localidade escolhidos, então não há origem para somar."
                hint="Amplie o período ou escolha “Todas” em cidade e localidade e use “Aplicar”. Para cadastrar, use “Novo contato”."
              />
            )}
          </CardBody>
        </Card>

        <Card aria-labelledby="registrars-heading">
          <CardHeader
            id="registrars-heading"
            title="Quem cadastrou"
            meta="a autoria é nova: o histórico aparece sem autoria"
          />
          {summary.registrars.length > 0 ? (
            <ul className="pb-1 pt-2">
              {summary.registrars.map((item) => {
                const unknown = item.tenantUserId === null;
                const name = registrarLabel(item.key, item.tenantUserId, registrarNames);
                return (
                  <li
                    key={item.key}
                    className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 first:border-t-0"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={unknown ? null : name} />
                      <span className={cx("truncate text-[13px]", unknown ? "text-muted" : "font-medium")}>{name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[13px] tabular-nums text-muted">
                      {item.count} · {item.percent}%
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4">
              <EmptyState
                title="Sem autoria para mostrar."
                reason="Nenhum cadastro caiu neste recorte, então ninguém aparece como autor."
                hint="Amplie o período e use “Aplicar”."
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
