import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: ReactNode;
  /** Contagem exibida em IBM Plex Mono. */
  count?: number;
  /** Filtro ativo (aria-pressed). */
  pressed?: boolean;
  /** `alert` pinta a contagem de vermelho quando ela for maior que zero. */
  tone?: "default" | "alert";
};

/** Chip de filtro com contagem. Alterna com `pressed`. */
export function Chip({ label, count, pressed = false, tone = "default", className, type = "button", ...rest }: ChipProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-pressed={pressed}
      className={cx(
        "inline-flex h-7 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[14px] border px-2.5 text-[13px] transition-colors duration-150 max-[560px]:min-h-9",
        pressed
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-surface text-fg hover:bg-sunken",
        className,
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cx(
            "font-mono text-[11px]",
            tone === "alert" && count > 0 && !pressed ? "text-danger" : undefined,
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function pluralize(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export type NeedsChipProps = Omit<ChipProps, "label" | "tone" | "count"> & {
  /** Quantas pessoas esperam uma acao (urgentes, sem cuidador ou com acao atrasada). */
  count: number;
  /** Rotulo do chip (padrao: "Precisa de alguem"). */
  label?: string;
  /** Mostra a frase em `role=status` ao lado do chip (padrao: sim). */
  sentence?: boolean;
};

/**
 * Padrao "Precisa de alguem": chip com a contagem e uma frase anunciada por leitores de tela
 * ("3 pessoas esperam uma acao" / "Ninguem esperando"). Deve vir antes dos demais filtros.
 */
export function NeedsChip({ count, label = "Precisa de alguém", sentence = true, ...rest }: NeedsChipProps) {
  return (
    <>
      <Chip {...rest} label={label} count={count} tone="alert" />
      {sentence ? (
        <span role="status" className="text-xs text-muted">
          {count > 0 ? `${pluralize(count, "pessoa espera", "pessoas esperam")} uma ação` : "Ninguém esperando"}
        </span>
      ) : null}
    </>
  );
}
