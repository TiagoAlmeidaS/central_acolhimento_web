import type { ReactNode } from "react";
import { cx } from "@/ui/atalaia";

export interface KpiCardProps {
  label: string;
  value: string | number;
  /** Frase curta que explica o número (aparece abaixo dele). */
  sub?: string;
  /** Marca o cartão como retrato do momento (fila em aberto), não do período filtrado. */
  snapshot?: boolean;
  /** `alert` pinta o número de vermelho (algo precisa de atenção). */
  tone?: "default" | "alert";
  /**
   * Props herdadas do desenho anterior (ícone e cores fixas). O Atalaia não usa mais ícone
   * nem cor por cartão: a cor só aparece quando `tone="alert"`. Mantidas para não quebrar chamadas.
   */
  icon?: ReactNode;
  accent?: string;
  bg?: string;
}

/** Indicador do painel: rótulo mono maiúsculo, número em IBM Plex Mono e a frase que o explica. */
export function KpiCard({ label, value, sub, snapshot, tone = "default" }: KpiCardProps) {
  const isText = typeof value === "string" && value.length > 6;
  return (
    <div className="flex min-w-0 flex-col rounded-card border border-border bg-surface px-4 py-3.5">
      <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</span>
      <div
        className={cx(
          "mt-1 break-words font-mono font-medium leading-[1.1] tabular-nums",
          isText ? "text-xl" : "text-[28px] max-[560px]:text-[22px]",
          tone === "alert" ? "text-danger" : "text-fg",
        )}
      >
        {value}
      </div>
      {sub ? <span className="mt-1.5 text-xs text-muted">{sub}</span> : null}
      {snapshot ? (
        <span className="mt-auto pt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          Retrato de agora · não segue o período
        </span>
      ) : null}
    </div>
  );
}
