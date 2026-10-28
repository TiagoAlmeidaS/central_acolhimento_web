import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
};

/** Superficie com borda de 1px e raio de 5px. Profundidade por luminancia, nao por sombra. */
export function Card({ as: Tag = "section", className, ...rest }: CardProps) {
  return <Tag {...rest} className={cx("min-w-0 rounded-card border border-border bg-surface", className)} />;
}

export type CardHeaderProps = {
  /** Titulo do card, exibido em IBM Plex Mono maiusculo. */
  title: ReactNode;
  /** Texto auxiliar a direita do titulo (ex.: "limite de 8"). */
  meta?: ReactNode;
  /** Acao do card (no maximo uma, de preferencia nao primaria). */
  action?: ReactNode;
  /** Nivel do titulo para a hierarquia da pagina (padrao: 2). */
  level?: 2 | 3;
  id?: string;
  className?: string;
};

export function CardHeader({ title, meta, action, level = 2, id, className }: CardHeaderProps) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className={cx("flex items-center justify-between gap-3 px-4 pt-3.5", className)}>
      <div className="flex min-w-0 items-baseline gap-3">
        <Heading
          id={id}
          className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted"
        >
          {title}
        </Heading>
        {meta ? <span className="text-xs text-muted">{meta}</span> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx("px-4 pb-4 pt-3.5", className)} />;
}
