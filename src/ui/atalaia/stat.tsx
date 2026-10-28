import type { ReactNode } from "react";
import { cx } from "./cx";

export type StatProps = {
  /** Rotulo em IBM Plex Mono maiusculo. */
  label: string;
  value: ReactNode;
  /** Texto pequeno ao lado do numero (ex.: "esta semana"). */
  note?: ReactNode;
  /** `alert` pinta o numero de vermelho (algo precisa de atencao). */
  tone?: "default" | "alert";
  className?: string;
};

/** Indicador: rotulo mono + numero grande em IBM Plex Mono. */
export function Stat({ label, value, note, tone = "default", className }: StatProps) {
  return (
    <div className={cx("min-w-0 rounded-card border border-border bg-surface px-4 py-3.5", className)}>
      <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</span>
      <div
        className={cx(
          "mt-1 flex items-baseline gap-2 font-mono text-[28px] font-medium leading-[1.1] tabular-nums max-[560px]:text-[22px]",
          tone === "alert" ? "text-danger" : "text-fg",
        )}
      >
        {value}
        {note ? <small className="font-sans text-xs font-normal text-muted">{note}</small> : null}
      </div>
    </div>
  );
}
