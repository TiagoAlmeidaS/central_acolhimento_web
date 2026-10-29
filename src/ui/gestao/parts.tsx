import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/ui/atalaia";

/** Rótulo de seção em IBM Plex Mono maiúsculo (títulos dentro de páginas e drawers). */
export function SectionLabel({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...rest}
      className={cx("font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted", className)}
    />
  );
}

/** Lista chave/valor do drawer de leitura (`dl`). */
export function Kv({ items, className }: { items: Array<{ label: string; value: ReactNode }>; className?: string }) {
  return (
    <dl className={cx("m-0 grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]", className)}>
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-muted">{item.label}</dt>
          <dd className="m-0 min-w-0 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Linha de ajuste: título e explicação à esquerda, controle à direita (Ajustes). */
export function SettingRow({
  title,
  text,
  children,
}: {
  title: ReactNode;
  text?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 border-border p-4 min-[720px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] min-[720px]:gap-6 [&+&]:border-t">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {text ? <p className="mt-1 text-[13px] text-muted">{text}</p> : null}
      </div>
      <div className="grid content-start gap-2.5">{children}</div>
    </div>
  );
}

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & { label: ReactNode };

/** Interruptor acessível (checkbox com `role=switch`) com texto sempre visível. */
export function Switch({ label, className, ...rest }: SwitchProps) {
  return (
    <label className={cx("inline-flex cursor-pointer items-center gap-2.5", className)}>
      <input
        {...rest}
        type="checkbox"
        role="switch"
        className="relative m-0 h-5 w-[34px] shrink-0 cursor-pointer appearance-none rounded-[10px] bg-border-strong transition-colors duration-150 after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-fgafter:transition-transform after:duration-200 after:content-[''] checked:bg-primary checked:after:translate-x-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
      />
      <span>{label}</span>
    </label>
  );
}

type CheckRowProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  description?: ReactNode;
};

/** Checkbox em linha com texto (e descrição opcional). */
export function CheckRow({ label, description, className, ...rest }: CheckRowProps) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-2.5 py-1", className)}>
      <input {...rest} type="checkbox" className="mt-[3px] size-4 shrink-0 accent-[var(--primary)]" />
      <span className="min-w-0">
        <span className="block">{label}</span>
        {description ? <span className="block text-xs text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

/** Grade de duas colunas para formulários de drawer (uma coluna no celular). */
export function FormGrid({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx("grid gap-3 min-[420px]:grid-cols-2", className)} />;
}

/** Mensagem de erro de formulário, anunciada para leitores de tela. */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-control border border-danger bg-danger-soft px-3 py-2 text-[13px] text-danger">
      {children}
    </p>
  );
}

/** Aviso informativo ou de atenção: usa tokens e funciona nos dois temas. */
export function Notice({ tone = "info", children }: { tone?: "info" | "warning"; children: ReactNode }) {
  return (
    <p
      role="status"
      className={cx(
        "rounded-control border px-3 py-2 text-[13px]",
        tone === "warning" ? "border-warning bg-warning-soft text-warning" : "border-border-strong bg-sunken text-muted",
      )}
    >
      {children}
    </p>
  );
}
