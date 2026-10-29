import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { AtalaiaMark, ThemeToggle, cx } from "@/ui/atalaia";

/** Tokens da faixa noturna: a mesma base quente da landing, igual nos dois temas. */
const NIGHT_VARS = {
  "--night": "#0e0704",
  "--night-2": "#1a0e07",
  "--night-fg": "#fff0de",
  "--night-muted": "#cdbfad",
  "--night-line": "#2a2018",
} as CSSProperties;

/** Brilho de amanhecer, o mesmo vocabulario da faixa de onboarding da referencia. */
const DAWN_GLOW =
  "radial-gradient(120% 40% at 50% 112%, rgba(255,138,76,.35), rgba(107,63,208,.18) 45%, transparent 70%)";

export function AtalaiaBrand({ className }: Readonly<{ className?: string }>) {
  return (
    <Link
      href="/"
      className={cx(
        "inline-flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.01em] text-[var(--night-fg)]",
        className,
      )}
    >
      <AtalaiaMark size={26} />
      <span>Atalaia</span>
    </Link>
  );
}

function DefaultPitch() {
  return (
    <div className="hidden gap-5 min-[900px]:grid">
      <p className="max-w-[16ch] font-display text-[34px] font-medium leading-[1.08] tracking-[-0.035em] text-[var(--night-fg)]">
        Acolhimento sem ninguém esquecido.
      </p>
      <blockquote className="m-0 grid max-w-[34ch] gap-1.5 border-l border-[var(--night-line)] pl-4 text-[var(--night-muted)]">
        <p>“Eu te dei por atalaia sobre a casa de Israel.”</p>
        <cite className="font-mono text-[11px] font-medium uppercase not-italic tracking-[0.14em]">
          Ezequiel 33:7
        </cite>
      </blockquote>
    </div>
  );
}

export type AuthShellProps = {
  children: ReactNode;
  /** Conteudo da faixa noturna abaixo da marca. Padrao: a frase e o versiculo. */
  side?: ReactNode;
  /** Largura maxima da coluna do formulario. */
  width?: "card" | "wide";
  /** Rodape discreto abaixo do formulario (links entre telas). */
  footer?: ReactNode;
};

/**
 * Moldura das telas de acesso: faixa noturna a esquerda (marca, frase, brilho de amanhecer) e
 * o formulario a direita; uma coluna no celular. Server component, o tema vem do ThemeToggle.
 */
export function AuthShell({ children, side, width = "card", footer }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh bg-bg text-fg min-[900px]:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <aside
        style={{ ...NIGHT_VARS, backgroundImage: DAWN_GLOW }}
        className="flex flex-col gap-5 border-b border-[var(--night-line)] bg-[var(--night-2)] px-4 py-5 text-[var(--night-fg)] min-[900px]:gap-10 min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:px-8 min-[900px]:py-8"
      >
        <AtalaiaBrand />
        {side ?? <DefaultPitch />}
        <p className="mt-auto hidden text-xs text-[var(--night-muted)] min-[900px]:block">
          Quem coordena e quem cuida, no mesmo lugar.
        </p>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div className="flex justify-end px-4 pt-3 min-[900px]:px-8 min-[900px]:pt-5">
          <ThemeToggle variant="icon" />
        </div>
        <main
          id="main"
          className={cx(
            "reveal mx-auto flex w-full flex-1 flex-col justify-center gap-5 px-4 pb-12 pt-4 min-[900px]:px-8",
            width === "card" ? "max-w-[448px]" : "max-w-[584px] min-[900px]:mx-0 min-[900px]:ml-[clamp(0px,4vw,56px)]",
          )}
        >
          {children}
          {footer ? <div className="grid gap-2 text-center text-[13px] text-muted">{footer}</div> : null}
        </main>
      </div>
    </div>
  );
}
