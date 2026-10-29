import type { ReactNode } from "react";
import { cx } from "./cx";

export type PageHeaderProps = {
  /** Titulo da pagina (h1, Inter Tight). */
  title: ReactNode;
  subtitle?: ReactNode;
  /** A unica acao primaria da pagina. */
  action?: ReactNode;
  /** Controles secundarios (alternador de visualizacao, filtros), a esquerda da acao primaria. */
  secondary?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, action, secondary, className }: PageHeaderProps) {
  return (
    <header className={cx("mb-5 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-medium tracking-[-0.03em] max-[560px]:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
      </div>
      {action || secondary ? (
        <div className="flex flex-wrap items-center gap-2">
          {secondary}
          {action}
        </div>
      ) : null}
    </header>
  );
}
