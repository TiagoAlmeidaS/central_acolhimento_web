import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import {
  normalizeStatusKey,
  STATUS_INFO,
  TEMPERATURE_INFO,
  type PillTone,
  type Temperature,
} from "./status-map";

const TONE: Record<PillTone, string> = {
  neutral: "bg-sunken text-muted",
  primary: "bg-primary-soft text-primary",
  warning: "bg-warning-soft text-warning",
  cold: "bg-cold-soft text-cold",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  muted: "bg-sunken text-subtle",
  warm: "bg-warm-soft text-warm",
  hot: "bg-hot-soft text-hot",
  lume: "bg-lume-soft text-lume-ink",
};

export type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
  /** Ponto colorido antes do texto (padrao: sim). */
  dot?: boolean;
  children: ReactNode;
};

/** Pilula de estado. Sempre com texto: a cor nunca fala sozinha. */
export function Pill({ tone = "neutral", dot = true, className, children, ...rest }: PillProps) {
  return (
    <span
      {...rest}
      className={cx(
        "inline-flex h-5 items-center gap-[5px] whitespace-nowrap rounded-control px-[7px] text-[11px] font-semibold tracking-[0.02em]",
        dot && "before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type StatusPillProps = Omit<PillProps, "tone" | "children"> & {
  /**
   * Situacao do contato/assistido. Aceita as chaves visuais (`novo`, `urgente`, `aguardando`,
   * `esperando_visita`, `acompanhamento`, `concluido`, `inativo`) e as do dominio
   * (`new`, `contacted`, `waiting_visit`, `in_progress`, `consolidated`, `inactive`).
   */
  status: string;
  /** Troca o texto exibido (a cor continua a da situacao). */
  label?: string;
  /** Usa o rotulo curto, quando houver. */
  short?: boolean;
};

export function StatusPill({ status, label, short = false, ...rest }: StatusPillProps) {
  const info = STATUS_INFO[normalizeStatusKey(status)];
  return (
    <Pill {...rest} tone={info.tone}>
      {label ?? (short ? (info.shortLabel ?? info.label) : info.label)}
    </Pill>
  );
}

export type TempPillProps = Omit<PillProps, "tone" | "children"> & {
  temperature: Temperature;
};

/** Temperatura espiritual: frio, morno ou quente. */
export function TempPill({ temperature, ...rest }: TempPillProps) {
  const info = TEMPERATURE_INFO[temperature];
  return (
    <Pill {...rest} tone={info.tone}>
      {info.label}
    </Pill>
  );
}
