import { Icon, cx } from "@/ui/atalaia";

/**
 * Passos do onboarding na faixa noturna: circulo numerado (ou check), rotulo mono "PASSO n" e nome.
 * No celular vira uma linha horizontal e so o passo atual mostra o nome.
 */
export function OnboardingSteps({
  steps,
  current,
}: Readonly<{ steps: readonly string[]; current: number }>) {
  return (
    <div className="grid gap-5 min-[900px]:gap-10">
      <ol
        aria-label="Passos para criar a central"
        className="m-0 flex list-none gap-3.5 overflow-x-auto p-0 min-[900px]:grid min-[900px]:gap-[18px] min-[900px]:overflow-visible"
      >
        {steps.map((label, index) => {
          const done = index < current;
          const on = index === current;
          return (
            <li
              key={label}
              aria-current={on ? "step" : undefined}
              className={cx(
                "grid shrink-0 grid-cols-[26px_auto] items-center gap-3 min-[900px]:items-start",
                on ? "text-[var(--night-fg)]" : "text-[var(--night-muted)]",
              )}
            >
              <b
                aria-hidden="true"
                className={cx(
                  "grid size-[26px] place-items-center rounded-full border font-mono text-xs font-medium",
                  done || on
                    ? "border-lume bg-lume text-[#1b1405]"
                    : "border-[var(--night-line)] bg-transparent",
                )}
              >
                {done ? <Icon name="check" size={13} /> : index + 1}
              </b>
              <span className={cx("grid gap-px", on ? "grid" : "max-[899px]:hidden")}>
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--night-muted)]">
                  Passo {index + 1}
                  {done ? <span className="sr-only"> (concluído)</span> : null}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="hidden text-sm text-[var(--night-muted)] min-[900px]:block">
        Leva uns dois minutos. Depois de criar, você entra com o e-mail e a senha da coordenação e convida a equipe de
        cuidadores.
      </p>
    </div>
  );
}
