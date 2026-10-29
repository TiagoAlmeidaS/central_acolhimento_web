import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/ui/atalaia";

export type CheckProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  label: ReactNode;
  /** Texto de apoio abaixo do rotulo. */
  hint?: ReactNode;
  wrapperClassName?: string;
};

/** Caixa de selecao com rotulo clicavel, nos tokens Atalaia (foco ambar). */
export function Check({ label, hint, wrapperClassName, className, id, ...rest }: CheckProps) {
  const uid = useId();
  const inputId = id ?? uid;
  return (
    <label
      htmlFor={inputId}
      className={cx(
        "flex cursor-pointer items-start gap-2.5 rounded-control border border-border bg-surface px-3 py-2.5 has-[:checked]:border-primary has-[:checked]:bg-primary-soft",
        wrapperClassName,
      )}
    >
      <input
        {...rest}
        id={inputId}
        type="checkbox"
        className={cx("mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--primary)]", className)}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}
