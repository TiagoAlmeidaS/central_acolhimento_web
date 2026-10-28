import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { Card, Eyebrow, Icon, cx } from "@/ui/atalaia";
import type { IconName } from "@/ui/atalaia";

/** Cartao do formulario: borda e luminancia, sem sombra. */
export function AuthCard({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
  return <Card className={cx("grid gap-5 p-5 min-[560px]:p-6", className)}>{children}</Card>;
}

/** Rotulo mono + titulo de tela. `headingRef` permite levar o foco ao titulo ao trocar de passo. */
export function AuthHeading({
  eyebrow,
  title,
  lead,
  headingRef,
  size = "md",
}: Readonly<{
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  size?: "md" | "lg";
}>) {
  return (
    <header className="grid gap-1.5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className={cx(
          "font-display font-medium tracking-[-0.03em] text-fg outline-none",
          size === "lg" ? "text-[32px] leading-[1.1]" : "text-2xl leading-[1.15]",
        )}
      >
        {title}
      </h1>
      {lead ? <p className="text-sm leading-relaxed text-muted">{lead}</p> : null}
    </header>
  );
}

const NOTICE_TONE = {
  success: { box: "border-success/40 bg-success-soft", text: "text-success", icon: "check" },
  danger: { box: "border-danger/40 bg-danger-soft", text: "text-danger", icon: "alert" },
  info: { box: "border-border-strong bg-sunken", text: "text-muted", icon: "info" },
  warning: { box: "border-warning/40 bg-warning-soft", text: "text-warning", icon: "clock" },
} as const satisfies Record<string, { box: string; text: string; icon: IconName }>;

export type AuthNoticeTone = keyof typeof NOTICE_TONE;

/** Aviso com icone e texto (estado nunca so em cor). `danger` e anunciado como alerta. */
export function AuthNotice({
  tone = "info",
  title,
  children,
  className,
}: Readonly<{ tone?: AuthNoticeTone; title?: ReactNode; children?: ReactNode; className?: string }>) {
  const t = NOTICE_TONE[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-2.5 rounded-control border px-3 py-2.5 text-[13px] leading-snug",
        t.box,
        className,
      )}
    >
      <span className={cx("mt-px", t.text)}>
        <Icon name={t.icon} size={16} />
      </span>
      <div className="grid min-w-0 gap-0.5">
        {title ? <strong className={cx("font-semibold", t.text)}>{title}</strong> : null}
        {children ? <div className="text-fg">{children}</div> : null}
      </div>
    </div>
  );
}

/** Link textual da pagina de acesso, na cor de acento. */
export function AuthLink({
  href,
  children,
  className,
}: Readonly<{ href: string; children: ReactNode; className?: string }>) {
  return (
    <Link href={href} className={cx("font-medium text-primary underline-offset-2 hover:underline", className)}>
      {children}
    </Link>
  );
}

/** Pares rotulo/valor (rotulo mono, valor em texto) para resumos e conferencias. */
export function AuthSummary({ items }: Readonly<{ items: Array<{ label: string; value: ReactNode }> }>) {
  return (
    <dl className="m-0 grid rounded-card border border-border bg-sunken">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cx(
            "grid gap-0.5 px-3.5 py-2.5 min-[560px]:grid-cols-[120px_minmax(0,1fr)] min-[560px]:gap-3",
            index > 0 && "border-t border-border",
          )}
        >
          <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{item.label}</dt>
          <dd className="m-0 min-w-0 break-words text-sm text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
