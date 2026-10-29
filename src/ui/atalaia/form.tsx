import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "./cx";
import { Icon } from "./icons";

/** Classes dos controles de 32px (3px de raio, foco ambar). Exportadas para o compat layer. */
export const CONTROL_CLASS =
  "w-full min-h-8 rounded-control border border-border-strong bg-surface px-2.5 py-[5px] text-fg placeholder:text-subtle focus:border-primary focus:outline-2 focus:-outline-offset-1 focus:outline-primary disabled:cursor-not-allowed disabled:opacity-60 read-only:text-muted aria-[invalid=true]:border-danger max-[560px]:min-h-9";

type FieldChrome = {
  /** Rotulo visivel (12px, `muted`). */
  label?: ReactNode;
  /** Ajuda abaixo do controle. */
  hint?: ReactNode;
  /** Mensagem de erro; marca o controle como invalido e e anunciada (role=alert). */
  error?: ReactNode;
};

export type FieldProps = FieldChrome & {
  /** id do controle que o rotulo descreve. */
  htmlFor?: string;
  hintId?: string;
  errorId?: string;
  className?: string;
  children: ReactNode;
};

/** Rotulo + controle + ajuda/erro. Os controles prontos (Input, Select, Textarea) ja usam. */
export function Field({ label, hint, error, htmlFor, hintId, errorId, className, children }: FieldProps) {
  return (
    <div className={cx("grid min-w-0 gap-1", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-xs font-semibold text-muted">
          {label}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <small id={hintId} className="text-xs text-subtle">
          {hint}
        </small>
      ) : null}
      {error ? (
        <small id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </small>
      ) : null}
    </div>
  );
}

function describedBy(hint: ReactNode, error: ReactNode, hintId: string, errorId: string) {
  if (error) return errorId;
  if (hint) return hintId;
  return undefined;
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldChrome & { wrapperClassName?: string };

export function Input({ label, hint, error, wrapperClassName, id, className, ...rest }: InputProps) {
  const uid = useId();
  const inputId = id ?? uid;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={inputId}
      hintId={hintId}
      errorId={errorId}
      className={wrapperClassName}
    >
      <input
        {...rest}
        id={inputId}
        aria-invalid={error ? true : rest["aria-invalid"]}
        aria-describedby={describedBy(hint, error, hintId, errorId) ?? rest["aria-describedby"]}
        className={cx(CONTROL_CLASS, className)}
      />
    </Field>
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  FieldChrome & {
    wrapperClassName?: string;
    /** Atalho: gera as <option>. Alternativa a passar `children`. */
    options?: Array<{ value: string; label: string } | string>;
    /** Primeira opcao vazia, desabilitada. */
    placeholder?: string;
  };

export function Select({
  label,
  hint,
  error,
  wrapperClassName,
  id,
  className,
  options,
  placeholder,
  children,
  ...rest
}: SelectProps) {
  const uid = useId();
  const selectId = id ?? uid;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={selectId}
      hintId={hintId}
      errorId={errorId}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          {...rest}
          id={selectId}
          aria-invalid={error ? true : rest["aria-invalid"]}
          aria-describedby={describedBy(hint, error, hintId, errorId) ?? rest["aria-describedby"]}
          className={cx(CONTROL_CLASS, "appearance-none pr-8", className)}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options?.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const text = typeof option === "string" ? option : option.label;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-subtle">
          <Icon name="chevron-down" size={14} />
        </span>
      </div>
    </Field>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldChrome & { wrapperClassName?: string };

export function Textarea({ label, hint, error, wrapperClassName, id, className, rows = 3, ...rest }: TextareaProps) {
  const uid = useId();
  const areaId = id ?? uid;
  const hintId = `${areaId}-hint`;
  const errorId = `${areaId}-error`;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={areaId}
      hintId={hintId}
      errorId={errorId}
      className={wrapperClassName}
    >
      <textarea
        {...rest}
        id={areaId}
        rows={rows}
        aria-invalid={error ? true : rest["aria-invalid"]}
        aria-describedby={describedBy(hint, error, hintId, errorId) ?? rest["aria-describedby"]}
        className={cx(CONTROL_CLASS, "min-h-[84px] resize-y", className)}
      />
    </Field>
  );
}

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Rotulo acessivel (nao visivel). Padrao: o placeholder. */
  label?: string;
  wrapperClassName?: string;
};

/** Campo de busca com lupa, 32px. */
export function SearchInput({
  label,
  wrapperClassName,
  className,
  id,
  placeholder = "Buscar",
  ...rest
}: SearchInputProps) {
  const uid = useId();
  const inputId = id ?? uid;
  return (
    <div className={cx("relative min-w-0", wrapperClassName)}>
      <label htmlFor={inputId} className="sr-only">
        {label ?? placeholder}
      </label>
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-subtle">
        <Icon name="search" size={15} />
      </span>
      <input
        autoComplete="off"
        {...rest}
        id={inputId}
        type="search"
        placeholder={placeholder}
        className={cx(CONTROL_CLASS, "pl-8", className)}
      />
    </div>
  );
}
