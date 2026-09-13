import React from "react";
import { Card } from "@/ui/v2-components/ui";
import { KpiCard } from "@/ui/mvp/kpi-card";
import {
  ACQUISITION_UNKNOWN_REGISTRAR_KEY,
  ACQUISITION_UNKNOWN_REGISTRAR_LABEL,
  type AcquisitionSummary,
} from "@/server/domain/acquisition";
import {
  IconChart,
  IconCheck,
  IconDoc,
  IconHeart,
  IconHourglass,
  IconUsers,
} from "@/ui/v2-components/icons";

type Props = {
  summary: AcquisitionSummary;
  /** Rotulo do periodo do recorte global, so para o texto de apoio. */
  periodLabel: string;
  /** tenant_user_id -> nome, quando for possivel resolver quem cadastrou. */
  registrarNames: Record<string, string>;
};

function registrarLabel(key: string, tenantUserId: string | null, names: Record<string, string>) {
  if (key === ACQUISITION_UNKNOWN_REGISTRAR_KEY || !tenantUserId) return ACQUISITION_UNKNOWN_REGISTRAR_LABEL;
  return names[tenantUserId] ?? `Usuario ${tenantUserId.slice(0, 8)}`;
}

export function CoordAcquisitionSection({ summary, periodLabel, registrarNames }: Props) {
  const maxChannelCount = summary.channels.reduce((max, item) => Math.max(max, item.count), 0);

  return (
    <>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
        <KpiCard
          icon={<IconUsers />}
          label="Pessoas novas"
          value={summary.total}
          sub={`Cadastros em ${periodLabel}`}
          accent="#2563EB"
          bg="#DBEAFE"
        />
        <KpiCard
          icon={<IconChart />}
          label="Origem principal"
          value={summary.topChannel ? summary.topChannel.label : "—"}
          sub={summary.topChannel ? `${summary.topChannel.count} pessoa(s) · ${summary.topChannel.percent}% do periodo` : "Sem entradas no periodo"}
          accent="#7C3AED"
          bg="rgba(124,58,237,0.12)"
        />
        <KpiCard
          icon={<IconDoc />}
          label="Origem sem registro"
          value={summary.withoutOriginChannel}
          sub={`Fila de reclassificacao · ${summary.total > 0 ? Math.round((summary.withoutOriginChannel / summary.total) * 100) : 0}% das entradas`}
          accent="#EA580C"
          bg="#FFEDD5"
        />
        <KpiCard
          icon={<IconCheck />}
          label="Taxa de 1o contato"
          value={summary.firstContactRate === null ? "—" : `${summary.firstContactRate}%`}
          sub={summary.firstContactRate === null ? "Sem base no periodo" : `${summary.firstContactCount} de ${summary.total} abordados`}
          accent="#16A34A"
          bg="#DCFCE7"
        />
        <KpiCard
          icon={<IconHourglass />}
          label="Novos sem cuidador"
          value={summary.withoutCaregiver}
          sub="Entre as pessoas novas do periodo"
          accent="#E11D48"
          bg="#FFE4E6"
        />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <Card padding={20}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Funil por origem</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>
              Cadastros do periodo por canal de entrada, do maior volume para o menor.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {summary.channels.length > 0 ? summary.channels.map((item) => (
              <div key={item.channel} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
                  <strong style={{ color: "var(--text)", fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.label}
                  </strong>
                  <span style={{ color: "var(--text-3)", fontWeight: 700, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {item.count} · {item.percent}%
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${maxChannelCount > 0 ? Math.max((item.count / maxChannelCount) * 100, 3) : 0}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: item.channel === "other" ? "var(--text-3)" : "var(--accent)",
                    }}
                  />
                </div>
              </div>
            )) : (
              <p style={{ margin: 0, color: "var(--text-3)", fontSize: 13 }}>Nenhum cadastro no recorte selecionado.</p>
            )}
          </div>
        </Card>

        <Card padding={0}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Quem cadastrou</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>
              Autoria por usuario da localidade. A coluna e nova: o historico ainda aparece sem autoria.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {summary.registrars.length > 0 ? summary.registrars.map((item) => {
              const unknown = item.tenantUserId === null;
              return (
                <div
                  key={item.key}
                  style={{
                    padding: "13px 18px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", color: unknown ? "var(--text-3)" : "var(--accent)", flexShrink: 0 }}>
                      {unknown ? <IconHourglass size={17} /> : <IconHeart size={17} />}
                    </span>
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: unknown ? "var(--text-3)" : "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {registrarLabel(item.key, item.tenantUserId, registrarNames)}
                    </span>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {item.count} · {item.percent}%
                  </span>
                </div>
              );
            }) : (
              <p style={{ margin: 0, padding: 18, color: "var(--text-3)", fontSize: 13 }}>Nenhum cadastro no recorte selecionado.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
