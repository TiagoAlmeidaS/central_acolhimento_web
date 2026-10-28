import type { ReactNode } from "react";
import { cx } from "./cx";

export type EmptyStateProps = {
  /** O que esta vazio ("Nenhum contato ainda."). */
  title: string;
  /** Por que esta vazio e o que a pessoa ganha ao preencher. */
  reason: ReactNode;
  /** Dica citando o rotulo do botao que resolve (ex.: Use "Novo contato" no topo). */
  hint?: ReactNode;
  /** O botao que resolve (no maximo um primario). */
  action?: ReactNode;
  className?: string;
};

/** Vazio que ensina: diz por que esta vazio e aponta o botao que resolve. */
export function EmptyState({ title, reason, hint, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        "grid content-start justify-items-start gap-2 rounded-card border border-dashed border-border-strong p-7 text-muted",
        className,
      )}
    >
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p>{reason}</p>
      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
      {action ? <div className="mt-1.5 flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
