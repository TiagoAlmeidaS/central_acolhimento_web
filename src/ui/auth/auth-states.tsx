import type { ReactNode } from "react";
import { Eyebrow, Icon, cx } from "@/ui/atalaia";
import type { IconName } from "@/ui/atalaia";
import { AuthCard } from "./auth-parts";
import { AuthShell } from "./auth-shell";

/** Fallback de Suspense: mesma moldura, sem piscar entre telas. */
export function AuthLoading({ label = "Carregando…" }: Readonly<{ label?: string }>) {
  return (
    <AuthShell>
      <AuthCard>
        <p role="status" className="flex items-center gap-2.5 text-sm text-muted">
          <span
            aria-hidden="true"
            className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {label}
        </p>
      </AuthCard>
    </AuthShell>
  );
}

/**
 * Estado que ensina o proximo passo (link invalido, convite expirado, canal fechado):
 * diz o que aconteceu, por que, e qual botao resolve.
 */
export function AuthStateCard({
  eyebrow,
  title,
  reason,
  hint,
  actions,
  icon = "alert",
  tone = "warning",
}: Readonly<{
  eyebrow: ReactNode;
  title: ReactNode;
  reason: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  icon?: IconName;
  tone?: "warning" | "danger" | "success";
}>) {
  return (
    <AuthCard>
      <div className="grid gap-3">
        <span
          className={cx(
            "grid size-9 place-items-center rounded-card border",
            tone === "warning" && "border-warning/40 bg-warning-soft text-warning",
            tone === "danger" && "border-danger/40 bg-danger-soft text-danger",
            tone === "success" && "border-success/40 bg-success-soft text-success",
          )}
        >
          <Icon name={icon} size={18} />
        </span>
        <div className="grid gap-1.5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-[-0.03em] text-fg">{title}</h1>
          <p className="text-sm leading-relaxed text-muted">{reason}</p>
          {hint ? <p className="text-[13px] leading-relaxed text-subtle">{hint}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </AuthCard>
  );
}
