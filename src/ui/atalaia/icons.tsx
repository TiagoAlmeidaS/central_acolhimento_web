import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "painel"
  | "contatos"
  | "assistidos"
  | "saidas"
  | "encontros"
  | "ajustes"
  | "search"
  | "plus"
  | "x"
  | "visit"
  | "call"
  | "message"
  | "prayer"
  | "other"
  | "check"
  | "copy"
  | "moon"
  | "sun"
  | "car"
  | "arrow"
  | "arrow-left"
  | "map"
  | "chevron-down"
  | "chevron-right"
  | "menu"
  | "logout"
  | "user"
  | "users"
  | "church"
  | "city"
  | "bell"
  | "alert"
  | "filter"
  | "clock"
  | "phone"
  | "pin"
  | "whatsapp"
  | "sparkle"
  | "refresh"
  | "lock"
  | "doc"
  | "chart"
  | "info";

const PATHS: Record<IconName, ReactNode> = {
  painel: <path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z" />,
  contatos: (
    <>
      <path d="M15 19c0-2.8-2.7-5-6-5s-6 2.2-6 5" />
      <circle cx="9" cy="8" r="3.5" />
      <path d="M19 8v6M16 11h6" />
    </>
  ),
  assistidos: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  saidas: (
    <>
      <path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2M19 16v2" />
      <circle cx="8" cy="13" r=".8" />
      <circle cx="16" cy="13" r=".8" />
    </>
  ),
  encontros: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  ajustes: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  visit: (
    <>
      <path d="M4 11 12 4l8 7M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  call: <path d="M6 4h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2L20 15v3a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2z" />,
  message: <path d="M5 5h14v10H9l-4 4z" />,
  prayer: <path d="M12 3c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7zM7 21h10M9 21v-5h6v5" />,
  other: (
    <>
      <circle cx="6" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18" cy="12" r="1.2" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  moon: <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  car: <path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2M19 16v2" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  logout: <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.4c1.8.7 3 2.3 3 4.6" />
    </>
  ),
  church: (
    <>
      <path d="M12 3v4M10 5h4" />
      <path d="M12 7 6 11v9h12v-9z" />
      <path d="M10 20v-5a2 2 0 0 1 4 0v5" />
    </>
  ),
  city: (
    <>
      <path d="M4 20V8l6-3v15M10 20V10l10 3v7M3 20h18" />
      <path d="M7 10v.01M7 14v.01M14 15v.01M17 16v.01" />
    </>
  ),
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />,
  alert: (
    <>
      <path d="M12 4 3 19h18z" />
      <path d="M12 10v4M12 17v.01" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  phone: <path d="M6 4h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2L20 15v3a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2z" />,
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4 20l1.2-4.1A8 8 0 1 1 8.3 19z" />
      <path d="M9.2 8.8c.2 2.6 2.4 4.8 5 5l1-1.3-1.8-.9-.8.7a3.3 3.3 0 0 1-1.8-1.8l.7-.8-.9-1.8z" />
    </>
  ),
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h5M10 16h5" />
    </>
  ),
  chart: <path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
};

export type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  /** Lado em px (padrao 16). */
  size?: number;
  /** Espessura do traco (padrao 1.7). */
  strokeWidth?: number;
};

/** Icone de traco que herda a cor do texto (currentColor). Decorativo por padrao. */
export function Icon({ name, size = 16, strokeWidth = 1.7, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest["aria-label"] ? undefined : true}
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Marca Atalaia: arco com a luz acesa no centro. */
export function AtalaiaMark({
  size = 26,
  ...rest
}: Omit<SVGProps<SVGSVGElement>, "viewBox"> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" focusable="false" {...rest}>
      <path
        d="M7.5 23.5V13a6.5 6.5 0 0 1 13 0v10.5M4 23.5h20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="14" cy="14.5" r="2.6" fill="var(--lume)" />
    </svg>
  );
}
