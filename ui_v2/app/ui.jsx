// app/ui.jsx — UI primitives matching the bright minimalist reference

// ─── Avatar ────────────────────────────────────────────────────
// Initials rendered behind the photo so the avatar is never empty if the
// image hasn't loaded yet (or fails). alt="" so the browser doesn't paint
// the name as fallback text on top.
const Avatar = ({ src, name, size = 60, online = false, ring = false }) => {
  return (
    <div style={{ position: 'relative', flexShrink: 0,
                  width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        overflow: 'hidden', position: 'relative',
        background: '#E2E8F0', color: '#64748B',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: size * 0.34, letterSpacing: '-0.02em',
        boxShadow: ring ? '0 0 0 3px var(--surface), 0 0 0 4.5px var(--accent)'
                        : '0 0 0 1px rgba(15,23,42,0.04)',
      }}>
        <span style={{ position: 'absolute', inset: 0,
                       display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {initials(name)}
        </span>
        {src && (
          <img src={src} alt="" loading="lazy"
               style={{
                 position: 'absolute', inset: 0,
                 width: '100%', height: '100%', objectFit: 'cover',
                 zIndex: 1,
               }}
               onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}
      </div>
      {online && (
        <div style={{
          position: 'absolute', right: 0, bottom: 2,
          width: size * 0.24, height: size * 0.24, borderRadius: '50%',
          background: '#22C55E', border: '2.5px solid var(--surface)',
        }} />
      )}
    </div>
  );
};

// ─── StatusPill ────────────────────────────────────────────────
const StatusPill = ({ status, size = 'sm' }) => {
  const s = STATUS[status];
  if (!s) return null;
  const dims = {
    xs: { fs: 11, pad: '3px 8px', radius: 8 },
    sm: { fs: 12, pad: '4px 10px', radius: 8 },
    md: { fs: 13, pad: '6px 12px', radius: 10 },
  }[size];
  return (
    <span style={{
      display: 'inline-block', padding: dims.pad, borderRadius: dims.radius,
      background: s.bg, color: s.fg,
      fontSize: dims.fs, fontWeight: 600, lineHeight: 1.2,
      letterSpacing: '-0.005em', whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
};

const StatusDot = ({ status, size = 8 }) => {
  const s = STATUS[status];
  if (!s) return null;
  return <span style={{
    width: size, height: size, borderRadius: '50%',
    background: s.dot, flexShrink: 0, display: 'inline-block',
  }} />;
};

// ─── Button ────────────────────────────────────────────────────
const Button = ({ children, onClick, variant = 'primary', size = 'lg',
                  icon, iconRight, full, disabled, style = {}, ...rest }) => {
  const sizes = {
    sm: { h: 36, px: 14, fs: 13, gap: 6, ic: 16, radius: 10 },
    md: { h: 44, px: 18, fs: 14, gap: 8, ic: 18, radius: 12 },
    lg: { h: 54, px: 22, fs: 15.5, gap: 10, ic: 20, radius: 14 },
  }[size];
  const variants = {
    primary: { bg: 'var(--accent)', fg: '#fff', bd: 'transparent',
               hover: 'var(--accent-strong)' },
    secondary: { bg: 'var(--surface)', fg: 'var(--text)',
                 bd: 'var(--border-strong)' },
    ghost: { bg: 'transparent', fg: 'var(--text)', bd: 'transparent' },
    whatsapp: { bg: '#22C55E', fg: '#fff', bd: 'transparent',
                hover: '#16A34A' },
    danger: { bg: 'var(--status-urgente)', fg: '#fff', bd: 'transparent' },
    link: { bg: 'transparent', fg: 'var(--accent)', bd: 'transparent' },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: sizes.gap, height: sizes.h, padding: `0 ${sizes.px}px`,
      background: variants.bg, color: variants.fg,
      border: `1.5px solid ${variants.bd}`, borderRadius: sizes.radius,
      fontSize: sizes.fs, fontWeight: 600, fontFamily: 'inherit',
      letterSpacing: '-0.01em', cursor: disabled ? 'not-allowed' : 'pointer',
      width: full ? '100%' : 'auto',
      opacity: disabled ? 0.5 : 1,
      transition: 'transform .08s, background .15s',
      boxShadow: variant === 'primary' || variant === 'whatsapp'
        ? '0 6px 16px rgba(45,127,249,0.18)' : 'none',
      ...style,
    }} {...rest}
       onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.985)'}
       onMouseUp={(e) => e.currentTarget.style.transform = ''}
       onMouseLeave={(e) => e.currentTarget.style.transform = ''}>
      {icon && React.cloneElement(icon, { size: sizes.ic })}
      {children}
      {iconRight && React.cloneElement(iconRight, { size: sizes.ic })}
    </button>
  );
};

// ─── IconBtn (circular icon button) ────────────────────────────
const IconBtn = ({ icon, onClick, size = 40, variant = 'soft', style = {}, ...rest }) => {
  const bg = variant === 'soft' ? 'var(--surface-2)'
           : variant === 'flat' ? 'transparent'
           : variant === 'outlined' ? 'var(--surface)'
           : variant === 'tinted' ? 'var(--accent-bg)'
           : 'var(--surface)';
  const fg = variant === 'tinted' ? 'var(--accent)' : 'var(--text)';
  const bd = variant === 'outlined' ? '1.5px solid var(--border)' : 'none';
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, border: bd, color: fg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
      ...style,
    }} {...rest}>
      {React.cloneElement(icon, { size: size * 0.48 })}
    </button>
  );
};

// ─── Card (white surface, soft border) ─────────────────────────
const Card = ({ children, padding = 18, onClick, hoverable = false, style = {} }) => (
  <div onClick={onClick} style={{
    background: 'var(--surface)',
    borderRadius: 18, padding,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    cursor: onClick ? 'pointer' : 'default',
    transition: hoverable ? 'transform .12s, box-shadow .15s' : 'none',
    ...style,
  }}>{children}</div>
);

// ─── Inputs ────────────────────────────────────────────────────
const Input = ({ label, value, onChange, placeholder, icon, type = 'text',
                 hint, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {label && <label style={{
      fontSize: 13.5, fontWeight: 600, color: 'var(--text)',
      letterSpacing: '-0.005em',
    }}>{label}</label>}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      height: 54, padding: '0 18px',
      background: 'var(--surface)',
      border: '1.5px solid var(--border)',
      borderRadius: 14,
    }}>
      <input type={type} value={value || ''}
             onChange={(e) => onChange && onChange(e.target.value)}
             placeholder={placeholder}
             style={{
               flex: 1, minWidth: 0, border: 0, outline: 'none',
               background: 'transparent', fontFamily: 'inherit',
               fontSize: 15, color: 'var(--text)',
               letterSpacing: '-0.005em',
             }} {...rest} />
      {icon && <span style={{ color: 'var(--accent)', display: 'flex' }}>
        {React.cloneElement(icon, { size: 20 })}
      </span>}
    </div>
    {hint && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{hint}</span>}
  </div>
);

const Select = ({ label, value, onChange, options, placeholder, icon }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
    {label && <label style={{
      fontSize: 13.5, fontWeight: 600, color: 'var(--text)',
      letterSpacing: '-0.005em',
    }}>{label}</label>}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      height: 54, padding: '0 18px',
      background: 'var(--surface)',
      border: '1.5px solid var(--border)', borderRadius: 14,
      position: 'relative',
    }}>
      <select value={value || ''}
              onChange={(e) => onChange && onChange(e.target.value)}
              style={{
                flex: 1, border: 0, outline: 'none',
                background: 'transparent', fontFamily: 'inherit',
                fontSize: 15, color: value ? 'var(--text)' : 'var(--accent)',
                appearance: 'none', WebkitAppearance: 'none',
                paddingRight: 24, letterSpacing: '-0.005em',
              }}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      <span style={{ color: 'var(--accent)', display: 'flex', pointerEvents: 'none' }}>
        <IconChevronDown size={18} />
      </span>
    </div>
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {label && <label style={{
      fontSize: 13.5, fontWeight: 600, color: 'var(--text)',
      letterSpacing: '-0.005em',
    }}>{label}</label>}
    <textarea value={value || ''}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder={placeholder} rows={rows}
              style={{
                padding: '16px 18px',
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
                borderRadius: 14, resize: 'none',
                fontFamily: 'inherit', fontSize: 15, color: 'var(--text)',
                outline: 'none', letterSpacing: '-0.005em', lineHeight: 1.5,
              }} />
  </div>
);

// ─── Search bar (matches reference style) ──────────────────────
const SearchInput = ({ value, onChange, placeholder = 'Buscar por nome ou cidade' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    height: 52, padding: '0 18px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 14,
    color: 'var(--accent)',
  }}>
    <IconSearch size={20} />
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
           placeholder={placeholder}
           style={{
             flex: 1, border: 0, outline: 'none', background: 'transparent',
             fontFamily: 'inherit', fontSize: 15,
             color: 'var(--text)', letterSpacing: '-0.005em',
           }} />
  </div>
);

// ─── Status filter pills (blue solid when active) ──────────────
const StatusFilterRow = ({ value, onChange, counts = {} }) => {
  const items = [
    { key: 'all', label: 'Todos' },
    ...STATUS_ORDER.map(k => ({ key: k, label: STATUS[k].shortLabel || STATUS[k].label })),
  ];
  return (
    <div style={{
      display: 'flex', gap: 10, overflowX: 'auto',
      paddingBottom: 4, scrollbarWidth: 'none',
    }}>
      {items.map(it => {
        const active = value === it.key;
        return (
          <button key={it.key} onClick={() => onChange(it.key)} style={{
            padding: '11px 22px', borderRadius: 999,
            background: active ? 'var(--accent)' : 'var(--surface)',
            color: active ? '#fff' : 'var(--text)',
            border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em',
            whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
            fontFamily: 'inherit',
          }}>{it.label}</button>
        );
      })}
    </div>
  );
};

// ─── Tenant chip (multi-tenant context indicator) ───────────────
const TenantChip = ({ tenantId, onClick, size = 'md' }) => {
  const t = tenantById(tenantId);
  const dims = size === 'sm'
    ? { h: 28, fs: 11.5, pad: '0 10px 0 6px', dot: 18 }
    : { h: 32, fs: 12.5, pad: '0 12px 0 6px', dot: 22 };
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      height: dims.h, padding: dims.pad,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 999,
      color: 'var(--text)', fontFamily: 'inherit', cursor: onClick ? 'pointer' : 'default',
    }}>
      <span style={{
        width: dims.dot, height: dims.dot, borderRadius: '50%',
        background: t.cor, color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: dims.dot * 0.45, fontWeight: 700,
      }}>{t.sigla}</span>
      <span style={{ fontSize: dims.fs, fontWeight: 600,
                     letterSpacing: '-0.005em' }}>{t.nome}</span>
    </button>
  );
};

// ─── Stat tile ─────────────────────────────────────────────────
const Stat = ({ label, value, unit, sub, accent }) => (
  <Card padding={18} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500,
                  letterSpacing: '-0.005em' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || 'var(--text)',
                    letterSpacing: '-0.03em', lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {unit && <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{unit}</div>}
    </div>
    {sub && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>}
  </Card>
);

// ─── Section title ─────────────────────────────────────────────
const SectionTitle = ({ children, action }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
    padding: '4px 4px 12px',
  }}>
    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)',
                   letterSpacing: '-0.015em' }}>{children}</span>
    {action}
  </div>
);

// ─── Status stepper (cadastro analysis) ─────────────────────────
const StatusStepper = ({ steps, current }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                gap: 4, padding: '0 8px' }}>
    {steps.map((step, i) => {
      const isCurrent = i === current;
      const isDone = i < current;
      const isFuture = i > current;
      const bg = isDone ? '#22C55E' : isCurrent ? 'var(--accent)' : 'var(--surface-2)';
      const fg = isFuture ? 'var(--text-3)' : '#fff';
      return (
        <React.Fragment key={step.label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 8, flex: '0 0 auto', minWidth: 60 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: bg, color: fg,
              border: isFuture ? '1.5px solid var(--border-strong)' : '0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isCurrent ? '0 0 0 6px rgba(45,127,249,0.12)' : 'none',
            }}>
              {React.cloneElement(step.icon, { size: 20 })}
            </div>
            <span style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: isCurrent ? 'var(--accent)' : isDone ? 'var(--text)' : 'var(--text-3)',
            }}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, marginTop: 21,
              background: i < current ? '#22C55E' : 'var(--border)',
              borderRadius: 1,
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Info banner ───────────────────────────────────────────────
const InfoBanner = ({ icon, children }) => (
  <div style={{
    display: 'flex', gap: 12, padding: '14px 16px',
    background: 'var(--accent-bg)',
    borderRadius: 14, border: '1px solid rgba(45,127,249,0.18)',
  }}>
    <span style={{ flexShrink: 0, color: 'var(--accent)', display: 'flex', paddingTop: 1 }}>
      {icon || <IconHelpCircle size={20} />}
    </span>
    <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5,
                  color: 'var(--text)', letterSpacing: '-0.005em' }}>
      {children}
    </div>
  </div>
);

// ─── iOS-style status bar (lightweight, time only) ─────────────
const StatusBar = ({ dark }) => (
  <div style={{
    height: 50, padding: '0 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    color: dark ? '#fff' : '#0F172A', flexShrink: 0,
    fontFamily: 'var(--font-sans)', fontWeight: 700,
    fontSize: 15, letterSpacing: '-0.01em',
  }}>
    <span style={{ paddingTop: 14 }}>9:41</span>
    <div style={{ paddingTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="17" height="11" viewBox="0 0 17 11">
        <rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/>
        <rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="currentColor"/>
        <rect x="9" y="3" width="3" height="8" rx="0.5" fill="currentColor"/>
        <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor"/>
      </svg>
      <svg width="24" height="11" viewBox="0 0 24 11">
        <rect x="0.5" y="0.5" width="20" height="10" rx="3" fill="none"
              stroke="currentColor" strokeOpacity="0.4"/>
        <rect x="2" y="2" width="17" height="7" rx="1.5" fill="currentColor"/>
        <rect x="21.5" y="3.5" width="1.5" height="4" rx="0.7"
              fill="currentColor" fillOpacity="0.4"/>
      </svg>
    </div>
  </div>
);

// ─── Bottom navigation (4 tabs, role-aware first tab) ──────────
const BottomNav = ({ tab, onTab, role = 'cuidador' }) => {
  const firstTab = role === 'lider'
    ? { key: 'home', label: 'Painel', icon: <IconChart /> }
    : { key: 'home', label: 'Início', icon: <IconHome /> };
  const items = [
    firstTab,
    { key: 'agenda', label: 'Agenda', icon: <IconCalendar /> },
    { key: 'mensagens', label: 'Mensagens', icon: <IconMessage /> },
    { key: 'ajustes', label: 'Ajustes', icon: <IconSettings /> },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingTop: 10, paddingBottom: 28,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 30,
    }}>
      {items.map(it => {
        const active = tab === it.key;
        return (
          <button key={it.key} onClick={() => onTab(it.key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
            background: 'transparent', border: 0, padding: '4px 4px',
            color: active ? 'var(--accent)' : 'var(--text-3)',
            fontSize: 11.5, fontWeight: 600, letterSpacing: '-0.005em',
            fontFamily: 'inherit', cursor: 'pointer',
          }}>
            {React.cloneElement(it.icon, { size: 24, sw: active ? 2.2 : 1.8 })}
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Header (title + tenant + avatar) ───────────────────────────
const ScreenHeader = ({ title, tenantId, right, back, onBack, lift = true }) => (
  <div style={{
    padding: lift ? '4px 22px 14px' : '0 22px 14px',
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--bg)',
  }}>
    {back && (
      <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40}
               style={{ marginLeft: -8 }} />
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <h1 style={{
        margin: 0, fontSize: 22, fontWeight: 700,
        letterSpacing: '-0.025em', color: 'var(--text)',
        lineHeight: 1.15,
      }}>{title}</h1>
      {tenantId && (
        <div style={{ marginTop: 6 }}>
          <TenantChip tenantId={tenantId} size="sm" />
        </div>
      )}
    </div>
    {right}
  </div>
);

Object.assign(window, {
  Avatar, StatusPill, StatusDot, Button, IconBtn, Card,
  Input, Select, Textarea,
  SearchInput, StatusFilterRow, TenantChip, Stat, SectionTitle,
  StatusStepper, InfoBanner, StatusBar, BottomNav, ScreenHeader,
});
