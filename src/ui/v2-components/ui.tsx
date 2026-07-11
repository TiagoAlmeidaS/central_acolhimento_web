import React from "react";
import { IconChevronDown, IconChevronRight, IconArrowLeft, IconSearch, IconHelpCircle } from "./icons";

// Helpers
export function initials(name?: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const STATUS: Record<
  string,
  { key: string; label: string; fg: string; bg: string; dot: string; shortLabel?: string }
> = {
  novo: {
    key: "novo",
    label: "Novo",
    fg: "#C2410C",
    bg: "#FFEDD5",
    dot: "#EA580C",
  },
  urgente: {
    key: "urgente",
    label: "Urgente",
    fg: "#E11D48",
    bg: "#FFE4E6",
    dot: "#E11D48",
  },
  aguardando: {
    key: "aguardando",
    label: "Aguardando",
    fg: "#C2410C",
    bg: "#FFEDD5",
    dot: "#EA580C",
  },
  acompanhamento: {
    key: "acompanhamento",
    label: "Em Acompanhamento",
    shortLabel: "Acompanhando",
    fg: "#1D4ED8",
    bg: "#DBEAFE",
    dot: "#2563EB",
  },
  concluido: {
    key: "concluido",
    label: "Concluído",
    fg: "#15803D",
    bg: "#DCFCE7",
    dot: "#16A34A",
  },
  inativo: {
    key: "inativo",
    label: "Inativo",
    fg: "#475569",
    bg: "#E2E8F0",
    dot: "#64748B",
  },
};

export const STATUS_ORDER = ["urgente", "novo", "aguardando", "acompanhamento", "concluido", "inativo"];

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
          background: "#E2E8F0",
          color: "#64748B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: size * 0.34,
          letterSpacing: "-0.02em",
          boxShadow: ring
            ? "0 0 0 3px var(--surface), 0 0 0 4.5px var(--accent)"
            : "0 0 0 1px rgba(15,23,42,0.04)",
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
            background: "#22C55E",
            border: "2.5px solid var(--surface)",
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

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = "sm" }) => {
  const normalized = status.toLowerCase().replace(/[^a-z]/g, "");
  const lookupKey = normalized.includes("urg")
    ? "urgente"
    : normalized.includes("nov")
    ? "novo"
    : normalized.includes("aguard")
    ? "aguardando"
    : normalized.includes("inativ")
    ? "inativo"
    : normalized.includes("concl") || normalized.includes("cons")
    ? "concluido"
    : "acompanhamento";

  const s = STATUS[lookupKey];
  if (!s) return null;

  const dims = {
    xs: { fs: 11, pad: "3px 8px", radius: 8 },
    sm: { fs: 12, pad: "4px 10px", radius: 8 },
    md: { fs: 13, pad: "6px 12px", radius: 10 },
  }[size];

  return (
    <span
      style={{
        display: "inline-block",
        padding: dims.pad,
        borderRadius: dims.radius,
        background: s.bg,
        color: s.fg,
        fontSize: dims.fs,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
};

interface StatusDotProps {
  status: string;
  size?: number;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, size = 8 }) => {
  const normalized = status.toLowerCase().replace(/[^a-z]/g, "");
  const lookupKey = normalized.includes("urg")
    ? "urgente"
    : normalized.includes("nov")
    ? "novo"
    : normalized.includes("aguard")
    ? "aguardando"
    : normalized.includes("inativ")
    ? "inativo"
    : normalized.includes("concl") || normalized.includes("cons")
    ? "concluido"
    : "acompanhamento";

  const s = STATUS[lookupKey];
  if (!s) return null;
  return (
    <span
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
  style = {},
  ...rest
}) => {
  const sizes = {
    sm: { h: 36, px: 14, fs: 13, gap: 6, ic: 16, radius: 10 },
    md: { h: 44, px: 18, fs: 14, gap: 8, ic: 18, radius: 12 },
    lg: { h: 54, px: 22, fs: 15.5, gap: 10, ic: 20, radius: 14 },
  }[size];

  const variants = {
    primary: {
      bg: "var(--accent)",
      fg: "#fff",
      bd: "transparent",
      hover: "var(--accent-strong)",
    },
    secondary: {
      bg: "var(--surface)",
      fg: "var(--text)",
      bd: "var(--border-strong)",
    },
    ghost: { bg: "transparent", fg: "var(--text)", bd: "transparent" },
    whatsapp: { bg: "#22C55E", fg: "#fff", bd: "transparent", hover: "#16A34A" },
    danger: { bg: "var(--status-urgente)", fg: "#fff", bd: "transparent" },
    link: { bg: "transparent", fg: "var(--accent)", bd: "transparent" },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes.gap,
        height: sizes.h,
        padding: `0 ${sizes.px}px`,
        background: variants.bg,
        color: variants.fg,
        border: `1.5px solid ${variants.bd}`,
        borderRadius: sizes.radius,
        fontSize: sizes.fs,
        fontWeight: 600,
        fontFamily: "inherit",
        letterSpacing: "-0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : "auto",
        opacity: disabled ? 0.5 : 1,
        transition: "transform .08s, background .15s",
        boxShadow:
          variant === "primary" || variant === "whatsapp"
            ? "0 6px 16px rgba(45,127,249,0.18)"
            : "none",
        ...style,
      }}
      {...rest}
    >
      {icon && React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: sizes.ic })}
      {children}
      {iconRight && React.cloneElement(iconRight as React.ReactElement<{ size?: number }>, { size: sizes.ic })}
    </button>
  );
};

// ─── IconBtn (circular icon button) ────────────────────────────
interface IconBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactElement;
  size?: number;
  variant?: "soft" | "flat" | "outlined" | "tinted";
}

export const IconBtn: React.FC<IconBtnProps> = ({
  icon,
  onClick,
  size = 40,
  variant = "soft",
  style = {},
  ...rest
}) => {
  const bg =
    variant === "soft"
      ? "var(--surface-2)"
      : variant === "flat"
      ? "transparent"
      : variant === "outlined"
      ? "var(--surface)"
      : variant === "tinted"
      ? "var(--accent-bg)"
      : "var(--surface)";
  const fg = variant === "tinted" ? "var(--accent)" : "var(--text)";
  const bd = variant === "outlined" ? "1.5px solid var(--border)" : "none";
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        border: bd,
        color: fg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        fontFamily: "inherit",
        ...style,
      }}
      {...rest}
    >
      {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: size * 0.48 })}
    </button>
  );
};

// ─── Card (white surface, soft border) ─────────────────────────
interface CardProps {
  children: React.ReactNode;
  padding?: number;
  onClick?: () => void;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 18,
  onClick,
  hoverable = false,
  style = {},
}) => (
  <div
    onClick={onClick}
    style={{
      background: "var(--surface)",
      borderRadius: 18,
      padding,
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-card)",
      cursor: onClick ? "pointer" : "default",
      transition: hoverable ? "transform .12s, box-shadow .15s" : "none",
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Inputs ────────────────────────────────────────────────────
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
  ...rest
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {label && (
      <label
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </label>
    )}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 54,
        padding: "0 18px",
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        borderRadius: 14,
      }}
    >
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          flex: 1,
          minWidth: 0,
          border: 0,
          outline: "none",
          background: "transparent",
          fontFamily: "inherit",
          fontSize: 15,
          color: "var(--text)",
          letterSpacing: "-0.005em",
        }}
        {...rest}
      />
      {icon && (
        <span style={{ color: "var(--accent)", display: "flex" }}>
          {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 20 })}
        </span>
      )}
    </div>
    {hint && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{hint}</span>}
  </div>
);

interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (v: string) => void;
  options: Array<{ value: string; label: string } | string>;
  placeholder?: string;
  icon?: React.ReactElement;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
    {label && (
      <label
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </label>
    )}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 54,
        padding: "0 18px",
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        borderRadius: 14,
        position: "relative",
      }}
    >
      <select
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        required={required}
        style={{
          flex: 1,
          border: 0,
          outline: "none",
          background: "transparent",
          fontFamily: "inherit",
          fontSize: 15,
          color: value ? "var(--text)" : "var(--text-3)",
          appearance: "none",
          WebkitAppearance: "none",
          paddingRight: 24,
          letterSpacing: "-0.005em",
        }}
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
      <span style={{ color: "var(--accent)", display: "flex", pointerEvents: "none" }}>
        <IconChevronDown size={18} />
      </span>
    </div>
  </div>
);

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
  required,
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

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", minWidth: 0 }}>
      {label && (
        <label
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.005em",
          }}
        >
          {label}
        </label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          height: 54,
          padding: "0 18px",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: 14,
          cursor: "pointer",
          position: "relative",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 15,
            color: value ? "var(--text)" : "var(--text-3)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value || placeholder || "Selecione..."}
        </span>
        <span style={{ color: "var(--accent)", display: "flex", pointerEvents: "none" }}>
          <IconChevronDown size={18} />
        </span>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: 14,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxHeight: 250,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            style={{
              padding: "12px 14px",
              border: 0,
              borderBottom: "1px solid var(--border)",
              outline: "none",
              background: "var(--surface-2)",
              fontSize: 14,
              fontFamily: "inherit",
              color: "var(--text)",
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange && onChange(opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  style={{
                    padding: "12px 14px",
                    fontSize: 14.5,
                    cursor: "pointer",
                    background: value === opt ? "var(--accent-bg)" : "transparent",
                    color: value === opt ? "var(--accent)" : "var(--text)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (value !== opt) e.currentTarget.style.background = "var(--surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    if (value !== opt) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div style={{ padding: "14px", fontSize: 13.5, color: "var(--text-3)", textAlign: "center" }}>
                Nenhum resultado
              </div>
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

export const Textarea: React.FC<TextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {label && (
      <label
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </label>
    )}
    <textarea
      value={value || ""}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        padding: "16px 18px",
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        borderRadius: 14,
        resize: "none",
        fontFamily: "inherit",
        fontSize: 15,
        color: "var(--text)",
        outline: "none",
        letterSpacing: "-0.005em",
        lineHeight: 1.5,
      }}
    />
  </div>
);

// ─── Search bar (matches reference style) ──────────────────────
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
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      height: 52,
      padding: "0 18px",
      background: "var(--surface)",
      border: "1.5px solid var(--border)",
      borderRadius: 14,
      color: "var(--accent)",
    }}
  >
    <IconSearch size={20} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        flex: 1,
        border: 0,
        outline: "none",
        background: "transparent",
        fontFamily: "inherit",
        fontSize: 15,
        color: "var(--text)",
        letterSpacing: "-0.005em",
      }}
    />
  </div>
);

// ─── Status filter pills (blue solid when active) ──────────────
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
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 4,
        scrollbarWidth: "none",
      }}
      className="no-scrollbar"
    >
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            style={{
              padding: "11px 22px",
              borderRadius: 999,
              background: active ? "var(--accent)" : "var(--surface)",
              color: active ? "#fff" : "var(--text)",
              border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              whiteSpace: "nowrap",
              cursor: "pointer",
              flexShrink: 0,
              fontFamily: "inherit",
            }}
          >
            {it.label}
          </button>
        );
      })}
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
  tenantColor = "#2D7FF9",
  tenantSigla = "AD",
  onClick,
  size = "md",
}) => {
  const dims =
    size === "sm"
      ? { h: 28, fs: 11.5, pad: "0 10px 0 6px", dot: 18 }
      : { h: 32, fs: 12.5, pad: "0 12px 0 6px", dot: 22 };
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: dims.h,
        padding: dims.pad,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        color: "var(--text)",
        fontFamily: "inherit",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span
        style={{
          width: dims.dot,
          height: dims.dot,
          borderRadius: "50%",
          background: tenantColor,
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: dims.dot * 0.45,
          fontWeight: 700,
        }}
      >
        {tenantSigla}
      </span>
      <span style={{ fontSize: dims.fs, fontWeight: 600, letterSpacing: "-0.005em" }}>
        {tenantName}
      </span>
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
  <Card padding={18} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div
      style={{
        fontSize: 12.5,
        color: "var(--text-2)",
        fontWeight: 500,
        letterSpacing: "-0.005em",
      }}
    >
      {label}
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: accent || "var(--text)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {unit && (
        <div style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>{unit}</div>
      )}
    </div>
    {sub && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</div>}
  </Card>
);

// ─── Section title ─────────────────────────────────────────────
interface SectionTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, action }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "4px 4px 12px",
    }}
  >
    <span
      style={{
        fontSize: 16,
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: "-0.015em",
      }}
    >
      {children}
    </span>
    {action}
  </div>
);

// ─── Status stepper (cadastro analysis) ─────────────────────────
interface StatusStepperProps {
  steps: Array<{ label: string; icon: React.ReactElement }>;
  current: number;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({ steps, current }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 4,
      padding: "0 8px",
    }}
  >
    {steps.map((step, i) => {
      const isCurrent = i === current;
      const isDone = i < current;
      const isFuture = i > current;
      const bg = isDone ? "#22C55E" : isCurrent ? "var(--accent)" : "var(--surface-2)";
      const fg = isFuture ? "var(--text-3)" : "#fff";
      return (
        <React.Fragment key={step.label}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              flex: "0 0 auto",
              minWidth: 60,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: bg,
                color: fg,
                border: isFuture ? "1.5px solid var(--border-strong)" : "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isCurrent ? "0 0 0 6px rgba(45,127,249,0.12)" : "none",
              }}
            >
              {React.cloneElement(step.icon as React.ReactElement<{ size?: number }>, { size: 20 })}
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: isCurrent ? "var(--accent)" : isDone ? "var(--text)" : "var(--text-3)",
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
                marginTop: 21,
                background: i < current ? "#22C55E" : "var(--border)",
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
    style={{
      display: "flex",
      gap: 12,
      padding: "14px 16px",
      background: "var(--accent-bg)",
      borderRadius: 14,
      border: "1px solid rgba(45,127,249,0.18)",
    }}
  >
    <span style={{ flexShrink: 0, color: "var(--accent)", display: "flex", paddingTop: 1 }}>
      {icon || <IconHelpCircle size={20} />}
    </span>
    <div
      style={{
        flex: 1,
        fontSize: 13.5,
        lineHeight: 1.5,
        color: "var(--text)",
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </div>
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
      padding: lift ? "4px 22px 14px" : "0 22px 14px",
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
        size={40}
        style={{ marginLeft: -8 }}
      />
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <h1
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          color: "var(--text)",
          lineHeight: 1.15,
        }}
      >
        {title}
      </h1>
      {tenantName && (
        <div style={{ marginTop: 6 }}>
          <TenantChip
            tenantName={tenantName}
            tenantColor={tenantColor}
            tenantSigla={tenantSigla}
            size="sm"
          />
        </div>
      )}
    </div>
    {right}
  </div>
);
