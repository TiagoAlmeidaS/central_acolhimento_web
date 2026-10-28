import React from "react";
import { getInitials } from "@/ui/atalaia/avatar";
import { buttonClass } from "@/ui/atalaia/button";
import { Chip } from "@/ui/atalaia/chip";
import { cx } from "@/ui/atalaia/cx";
import { Pill } from "@/ui/atalaia/pill";
import {
  normalizeStatusKey,
  STATUS_INFO,
  STATUS_KEY_ORDER,
  type PillTone,
} from "@/ui/atalaia/status-map";
import { IconChevronDown, IconArrowLeft, IconSearch, IconHelpCircle } from "./icons";

/*
 * Camada de compatibilidade: mantem as APIs de v2-components/ui e aplica o visual Atalaia
 * (tokens, controles de 32px, raio 3/5px, IBM Plex Mono nos rotulos). Telas novas devem usar
 * as primitivas de `@/ui/atalaia`.
 */

// Helpers
export function initials(name?: string | null): string {
  return getInitials(name);
}

const TONE_COLORS: Record<PillTone, { fg: string; bg: string }> = {
  neutral: { fg: "var(--muted)", bg: "var(--sunken)" },
  primary: { fg: "var(--primary)", bg: "var(--primary-soft)" },
  warning: { fg: "var(--warning)", bg: "var(--warning-soft)" },
  cold: { fg: "var(--cold)", bg: "var(--cold-soft)" },
  success: { fg: "var(--success)", bg: "var(--success-soft)" },
  danger: { fg: "var(--danger)", bg: "var(--danger-soft)" },
  muted: { fg: "var(--subtle)", bg: "var(--sunken)" },
  warm: { fg: "var(--warm)", bg: "var(--warm-soft)" },
  hot: { fg: "var(--hot)", bg: "var(--hot-soft)" },
  lume: { fg: "var(--lume-ink)", bg: "var(--lume-soft)" },
};

export const STATUS: Record<
  string,
  { key: string; label: string; fg: string; bg: string; dot: string; shortLabel?: string }
> = Object.fromEntries(
  Object.values(STATUS_INFO).map((info) => {
    const colors = TONE_COLORS[info.tone];
    return [
      info.key,
      { key: info.key, label: info.label, shortLabel: info.shortLabel, fg: colors.fg, bg: colors.bg, dot: colors.fg },
    ];
  }),
);

export const STATUS_ORDER: string[] = STATUS_KEY_ORDER;

// ─── Avatar ────────────────────────────────────────────────────
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  online?: boolean;
  ring?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 60, online = false, ring = false }) => {
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          position: "relative",
          background: "var(--primary-soft)",
          color: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: Math.max(9, size * 0.34),
          letterSpacing: "0.02em",
          boxShadow: ring ? "0 0 0 2px var(--surface), 0 0 0 3.5px var(--primary)" : "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {initials(name)}
        </span>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 1,
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>
      {online && (
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 2,
            width: size * 0.24,
            height: size * 0.24,
            borderRadius: "50%",
            background: "var(--success)",
            border: "2px solid var(--surface)",
          }}
        />
      )}
    </div>
  );
};

// ─── StatusPill ────────────────────────────────────────────────
interface StatusPillProps {
  status: string;
  size?: "xs" | "sm" | "md";
}

const PILL_SIZE: Record<NonNullable<StatusPillProps["size"]>, string> = {
  xs: "h-[18px] px-1.5 text-[10.5px]",
  sm: "",
  md: "h-6 px-2 text-xs",
};

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = "sm" }) => {
  const info = STATUS_INFO[normalizeStatusKey(status)];
  return (
    <Pill tone={info.tone} className={PILL_SIZE[size]}>
      {info.label}
    </Pill>
  );
};

interface StatusDotProps {
  status: string;
  size?: number;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, size = 8 }) => {
  const s = STATUS[normalizeStatusKey(status)];
  if (!s) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: s.dot,
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );
};

// ─── Button ────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "whatsapp" | "danger" | "link";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactElement;
  iconRight?: React.ReactElement;
  full?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "lg",
  icon,
  iconRight,
  full,
  disabled,
  className,
  style = {},
  ...rest
}) => {
  const ic = { sm: 14, md: 16, lg: 16 }[size];
  const atalaiaVariant = { primary: "primary", secondary: "neutral", ghost: "ghost", whatsapp: "neutral", danger: "danger", link: "ghost" }[
    variant
  ] as "primary" | "neutral" | "ghost" | "danger";
  const variantStyle: React.CSSProperties =
    variant === "whatsapp"
      ? { background: "var(--success)", borderColor: "var(--success)", color: "var(--bg)" }
      : variant === "link"
      ? { color: "var(--primary)" }
      : {};
  const sizeStyle: React.CSSProperties = size === "lg" ? { height: 36, padding: "0 16px" } : {};

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClass(atalaiaVariant, size === "sm" ? "sm" : "md", cx(full && "w-full", className))}
      style={{ ...sizeStyle, ...variantStyle, ...style }}
      {...rest}
    >
      {icon && React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: ic })}
      {children}
      {iconRight && React.cloneElement(iconRight as React.ReactElement<{ size?: number }>, { size: ic })}
    </button>
  );
};

// ─── IconBtn (icon button) ─────────────────────────────────────
interface IconBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactElement;
  size?: number;
  variant?: "soft" | "flat" | "outlined" | "tinted";
}

const ICON_BTN_VARIANT: Record<NonNullable<IconBtnProps["variant"]>, string> = {
  soft: "border-transparent bg-sunken text-fg hover:bg-raised",
  flat: "border-transparent bg-transparent text-fg hover:bg-sunken",
  outlined: "border-border-strong bg-surface text-fg hover:bg-sunken",
  tinted: "border-transparent bg-primary-soft text-primary",
};

export const IconBtn: React.FC<IconBtnProps> = ({
  icon,
  onClick,
  size = 32,
  variant = "soft",
  className,
  style = {},
  ...rest
}) => (
  <button
    onClick={onClick}
    className={cx(
      "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control border p-0 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
      ICON_BTN_VARIANT[variant],
      className,
    )}
    style={{ width: size, height: size, ...style }}
    {...rest}
  >
    {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: Math.round(size * 0.5) })}
  </button>
);

// ─── Card (surface with border) ────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  padding?: number;
  onClick?: () => void;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, padding = 16, onClick, hoverable = false, style = {} }) => (
  <div
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (event) => {
            if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              onClick();
            }
          }
        : undefined
    }
    className={cx(
      "min-w-0 rounded-card border border-border bg-surface",
      (hoverable || onClick) && "transition-colors duration-150 hover:border-border-strong",
      onClick && "cursor-pointer",
    )}
    style={{ padding, ...style }}
  >
    {children}
  </div>
);

// ─── Inputs ────────────────────────────────────────────────────
const LABEL_CLASS = "text-xs font-semibold text-muted";
const BOX_CLASS =
  "flex min-h-8 items-center gap-2 rounded-control border border-border-strong bg-surface px-2.5 focus-within:border-primary focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-primary max-[560px]:min-h-9";
const INNER_CLASS =
  "min-w-0 flex-1 border-0 bg-transparent py-[5px] text-fg outline-none placeholder:text-subtle focus-visible:outline-none";

interface InputProps {
  label?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactElement;
  type?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  autoComplete?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  pattern?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  hint,
  required,
  id,
  ...rest
}) => {
  const uid = React.useId();
  const inputId = id ?? uid;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      <div className={BOX_CLASS}>
        <input
          id={inputId}
          type={type}
          value={value || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={INNER_CLASS}
          {...rest}
        />
        {icon && (
          <span className="flex text-subtle">
            {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 16 })}
          </span>
        )}
      </div>
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </div>
  );
};

interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (v: string) => void;
  options: Array<{ value: string; label: string } | string>;
  placeholder?: string;
  icon?: React.ReactElement;
  required?: boolean;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, value, onChange, options, placeholder, required, disabled }) => {
  const uid = React.useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && (
        <label htmlFor={uid} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      <div className={cx(BOX_CLASS, "relative", disabled && "opacity-60")}>
        <select
          id={uid}
          value={value || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={cx(INNER_CLASS, "appearance-none pr-6", value ? "text-fg" : "text-subtle")}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => {
            const v = typeof o === "object" ? o.value : o;
            const l = typeof o === "object" ? o.label : o;
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
        <span className="pointer-events-none absolute right-2.5 flex text-subtle">
          <IconChevronDown size={14} />
        </span>
      </div>
    </div>
  );
};

interface SearchableSelectProps {
  label?: string;
  value?: string;
  onChange?: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={containerRef} className="relative flex min-w-0 flex-col gap-1">
      {label && <span className={LABEL_CLASS}>{label}</span>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={cx(BOX_CLASS, "w-full cursor-pointer justify-between text-left")}
      >
        <span className={cx("truncate", value ? "text-fg" : "text-subtle")}>{value || placeholder || "Selecione..."}</span>
        <span className="pointer-events-none flex text-subtle">
          <IconChevronDown size={14} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-[1000] mt-1 flex max-h-64 flex-col overflow-hidden rounded-card border border-border-strong bg-surface shadow-[var(--shadow)]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            aria-label="Buscar na lista"
            className="min-h-8 border-0 border-b border-border bg-sunken px-2.5 py-1.5 text-fg outline-none placeholder:text-subtle focus-visible:outline-none"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <div role="listbox" className="flex-1 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  role="option"
                  aria-selected={value === opt}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange && onChange(opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cx(
                    "cursor-pointer px-2.5 py-2 transition-colors duration-150",
                    value === opt ? "bg-primary-soft text-primary" : "text-fg hover:bg-sunken",
                  )}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-[13px] text-subtle">Nenhum resultado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface TextareaProps {
  label?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export const Textarea: React.FC<TextareaProps> = ({ label, value, onChange, placeholder, rows = 4 }) => {
  const uid = React.useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && (
        <label htmlFor={uid} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      <textarea
        id={uid}
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="resize-y rounded-control border border-border-strong bg-surface px-2.5 py-2 leading-normal text-fg placeholder:text-subtle focus:border-primary focus:outline-2 focus:-outline-offset-1 focus:outline-primary"
      />
    </div>
  );
};

// ─── Search bar ────────────────────────────────────────────────
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Buscar por nome ou cidade",
}) => (
  <label className={cx(BOX_CLASS, "text-subtle")}>
    <IconSearch size={15} />
    <span className="sr-only">{placeholder}</span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={INNER_CLASS}
    />
  </label>
);

// ─── Status filter chips ───────────────────────────────────────
interface StatusFilterRowProps {
  value: string;
  onChange: (key: string) => void;
}

export const StatusFilterRow: React.FC<StatusFilterRowProps> = ({ value, onChange }) => {
  const items = [
    { key: "all", label: "Todos" },
    ...STATUS_ORDER.map((k) => ({ key: k, label: STATUS[k].shortLabel || STATUS[k].label })),
  ];
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {items.map((it) => (
        <Chip key={it.key} label={it.label} pressed={value === it.key} onClick={() => onChange(it.key)} />
      ))}
    </div>
  );
};

// ─── Tenant chip (multi-tenant context indicator) ───────────────
interface TenantChipProps {
  tenantName: string;
  tenantColor?: string;
  tenantSigla?: string;
  onClick?: () => void;
  size?: "sm" | "md";
}

export const TenantChip: React.FC<TenantChipProps> = ({
  tenantName,
  tenantColor = "var(--primary)",
  tenantSigla = "AD",
  onClick,
  size = "md",
}) => {
  const dims =
    size === "sm"
      ? { h: 24, fs: 12, pad: "0 10px 0 4px", dot: 18 }
      : { h: 28, fs: 13, pad: "0 12px 0 4px", dot: 20 };
  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-2 rounded-[14px] border border-border bg-surface text-fg"
      style={{ height: dims.h, padding: dims.pad, cursor: onClick ? "pointer" : "default" }}
    >
      <span
        style={{
          width: dims.dot,
          height: dims.dot,
          borderRadius: "50%",
          background: tenantColor,
          color: "var(--primary-fg)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: dims.dot * 0.45,
          fontWeight: 700,
        }}
      >
        {tenantSigla}
      </span>
      <span style={{ fontSize: dims.fs, fontWeight: 600 }}>{tenantName}</span>
    </button>
  );
};

// ─── Stat tile ─────────────────────────────────────────────────
interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: string;
}

export const Stat: React.FC<StatProps> = ({ label, value, unit, sub, accent }) => (
  <Card padding={16} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <div className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <div
        className="font-mono"
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: accent || "var(--fg)",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {unit && <div style={{ fontSize: 12, color: "var(--muted)" }}>{unit}</div>}
    </div>
    {sub && <div style={{ fontSize: 12, color: "var(--subtle)" }}>{sub}</div>}
  </Card>
);

// ─── Section title ─────────────────────────────────────────────
interface SectionTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, action }) => (
  <div className="flex items-baseline justify-between px-1 pb-3 pt-1">
    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{children}</span>
    {action}
  </div>
);

// ─── Status stepper ────────────────────────────────────────────
interface StatusStepperProps {
  steps: Array<{ label: string; icon: React.ReactElement }>;
  current: number;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({ steps, current }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4, padding: "0 8px" }}>
    {steps.map((step, i) => {
      const isCurrent = i === current;
      const isDone = i < current;
      const isFuture = i > current;
      const bg = isDone ? "var(--success)" : isCurrent ? "var(--primary)" : "var(--sunken)";
      const fg = isFuture ? "var(--subtle)" : isDone ? "var(--bg)" : "var(--primary-fg)";
      return (
        <React.Fragment key={step.label}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: "0 0 auto", minWidth: 60 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: bg,
                color: fg,
                border: isFuture ? "1px solid var(--border-strong)" : "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isCurrent ? "0 0 0 4px var(--primary-soft)" : "none",
              }}
            >
              {React.cloneElement(step.icon as React.ReactElement<{ size?: number }>, { size: 18 })}
            </div>
            <span
              className="font-mono"
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isCurrent ? "var(--primary)" : isDone ? "var(--fg)" : "var(--subtle)",
              }}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                marginTop: 17,
                background: i < current ? "var(--success)" : "var(--border)",
                borderRadius: 1,
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Info banner ───────────────────────────────────────────────
interface InfoBannerProps {
  icon?: React.ReactElement;
  children: React.ReactNode;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({ icon, children }) => (
  <div
    className="flex gap-3 rounded-card px-4 py-3"
    style={{
      background: "var(--primary-soft)",
      border: "1px solid color-mix(in srgb, var(--primary) 24%, transparent)",
    }}
  >
    <span style={{ flexShrink: 0, color: "var(--primary)", display: "flex", paddingTop: 1 }}>
      {icon || <IconHelpCircle size={18} />}
    </span>
    <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: "var(--fg)" }}>{children}</div>
  </div>
);

// ─── ScreenHeader ───────────────────────────────────────────────
interface ScreenHeaderProps {
  title: string;
  tenantName?: string;
  tenantColor?: string;
  tenantSigla?: string;
  right?: React.ReactNode;
  back?: boolean;
  onBack?: () => void;
  lift?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  tenantName,
  tenantColor,
  tenantSigla,
  right,
  back,
  onBack,
  lift = true,
}) => (
  <div
    style={{
      padding: lift ? "4px 20px 12px" : "0 20px 12px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "var(--bg)",
    }}
  >
    {back && (
      <IconBtn
        icon={<IconArrowLeft />}
        onClick={onBack}
        variant="flat"
        size={32}
        aria-label="Voltar"
        style={{ marginLeft: -8 }}
      />
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <h1 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
        {title}
      </h1>
      {tenantName && (
        <div style={{ marginTop: 6 }}>
          <TenantChip tenantName={tenantName} tenantColor={tenantColor} tenantSigla={tenantSigla} size="sm" />
        </div>
      )}
    </div>
    {right}
  </div>
);
