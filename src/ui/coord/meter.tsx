import { cx } from "@/ui/atalaia";

/** Barra de carga (ex.: assistidos de um cuidador / limite). Fica ambar no limite e vermelha acima. */
export function Meter({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  /** Texto para leitores de tela. Padrao: "value de max". */
  label?: string;
  className?: string;
}) {
  const over = value > max;
  const atLimit = value === max;
  return (
    <span
      role="img"
      aria-label={label ?? `${value} de ${max}`}
      className={cx("block h-1.5 min-w-14 overflow-hidden rounded-full bg-sunken", className)}
    >
      <b
        className={cx("block h-full rounded-full", over ? "bg-danger" : atLimit ? "bg-warning" : "bg-primary")}
        style={{ width: `${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%` }}
      />
    </span>
  );
}
