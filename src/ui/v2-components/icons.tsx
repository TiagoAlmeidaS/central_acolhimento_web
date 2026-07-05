import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  sw?: number;
  fill?: string;
  d?: string;
};

export const Icon: React.FC<IconProps> = ({ d, size = 22, sw = 1.8, fill = "none", children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

export const IconHome: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </Icon>
);

export const IconCalendar: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
);

export const IconMessage: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M21 12a8 8 0 0 1-12 7l-5 1 1-5a8 8 0 1 1 16-3z" />
  </Icon>
);

export const IconSettings: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icon>
);

export const IconSearch: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const IconPlus: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconArrowLeft: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Icon>
);

export const IconArrowRight: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </Icon>
);

export const IconChevronRight: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const IconChevronDown: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const IconWhatsapp: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M20.5 12a8.5 8.5 0 1 1-15.6 4.7L3.5 20l3.4-1.3A8.5 8.5 0 0 0 20.5 12z" />
    <path d="M9 9.5c0 2.5 3 5.5 5.5 5.5l1.5-1.3-1.8-1-1 .7c-1-.4-1.8-1.2-2.2-2.2l.7-1-1-1.8L9 9.5z" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconWhatsappFilled: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.4 1.6 6.3L3 29l6.9-1.6c1.8 1 3.9 1.5 6.1 1.5 7.2 0 13-5.8 13-13S23.2 3 16 3zm7.5 18.2c-.3.9-1.8 1.7-2.5 1.8-.6.1-1.5.1-2.4-.2-.5-.2-1.3-.4-2.2-.8-3.8-1.6-6.3-5.5-6.5-5.7-.2-.2-1.6-2.1-1.6-4 0-1.9 1-2.9 1.4-3.3.4-.4.8-.5 1.1-.5h.8c.3 0 .6 0 .9.7.3.8 1.1 2.7 1.2 2.9.1.2.2.4 0 .7-.1.3-.2.4-.4.7-.2.2-.4.5-.6.7-.2.2-.4.4-.2.8.2.4.9 1.6 2 2.5 1.4 1.2 2.6 1.6 3 1.8.4.2.6.1.8-.1.2-.2.9-1.1 1.2-1.5.2-.4.5-.3.8-.2.3.1 2.1 1 2.5 1.2.4.2.6.3.7.4.1.4.1.9-.2 1.8z" />
  </svg>
);

export const IconMapPin: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);

export const IconClock: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const IconBell: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </Icon>
);

export const IconCheck: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M5 12l5 5L20 6" />
  </Icon>
);

export const IconX: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const IconUser: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

export const IconUsers: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 21a6 6 0 0 1 12 0" />
    <circle cx="17" cy="10" r="2.5" />
    <path d="M15 21a5 5 0 0 1 6.5-4.8" />
  </Icon>
);

export const IconUsersFilled: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="9" r="3.5"/>
    <circle cx="9" cy="18" r="3.5"/>
    <circle cx="17" cy="10" r="2.5"/>
    <path d="M17 14c2.5 0 4.5 1.3 4.5 3v2H15v-2c0-1.7 0-3 2-3z"/>
  </svg>
);

export const IconHeart: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M12 21s-7-4.5-9.5-9.2A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5.8C19 16.5 12 21 12 21z" />
  </Icon>
);

export const IconSparkle: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    <path d="M19 16l.7 2 2 .7-2 .7L19 22l-.7-2.6-2-.7 2-.7z" />
  </Icon>
);

export const IconSend: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </Icon>
);

export const IconMic: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Icon>
);

export const IconPhone: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9z" />
  </Icon>
);

export const IconBuilding: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" />
    <path d="M10 21v-3h4v3" />
  </Icon>
);

export const IconChurch: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M12 2v4M10 4h4" />
    <path d="M12 6 5 11v10h14V11z" />
    <path d="M9 21v-5h6v5" />
  </Icon>
);

export const IconHelpCircle: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4M12 17h.01" />
  </Icon>
);

export const IconLogout: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5M5 12h11" />
  </Icon>
);

export const IconMore: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconShield: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
  </Icon>
);

export const IconHourglass: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M6 2h12M6 22h12" />
    <path d="M6 2v4l6 6-6 6v4M18 2v4l-6 6 6 6v4" />
  </Icon>
);

export const IconLock: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
);

export const IconRefresh: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
  </Icon>
);

export const IconSwap: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />
  </Icon>
);

export const IconVideo: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="3" y="6" width="14" height="12" rx="2" />
    <path d="m21 8-4 4 4 4z" />
  </Icon>
);

export const IconFilter: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M3 5h18M6 12h12M10 19h4" />
  </Icon>
);

export const IconDoc: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Icon>
);

export const IconChart: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <rect x="7" y="11" width="3" height="6" rx="0.5" />
    <rect x="12" y="8" width="3" height="9" rx="0.5" />
    <rect x="17" y="13" width="3" height="4" rx="0.5" />
  </Icon>
);

export const IconVerified: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = "#22C55E" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 1.5l2.4 2 3.2-.2.7 3 2.7 1.6-.9 3 1.6 2.8-2 2.5.1 3.2-3 1-1.6 2.7-3.2-.9-2.8 1.6-2.5-2-3.2.1-1-3-2.7-1.6.9-3-1.6-2.8 2-2.5L1 6.7l3-1L5.7 3l3.2.9L11.7 2.3z" fill={color} />
    <path d="M8 12.5l2.5 2.5L16 9.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BrandMark: React.FC<{ size?: number; bg?: string; fg?: string }> = ({ size = 72, bg = "#E8F1FE", fg = "#2D7FF9" }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28,
    background: bg, display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", boxShadow: "0 6px 18px rgba(45,127,249,0.18)",
  }}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24"
         fill="none" stroke={fg} strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.5-9.5-9.2A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5.8C19 16.5 12 21 12 21z" />
    </svg>
    <div style={{
      position: "absolute", right: -size * 0.08, top: -size * 0.06,
      width: size * 0.32, height: size * 0.32, borderRadius: "50%",
      background: fg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    }}>
      <svg width={size * 0.18} height={size * 0.18} viewBox="0 0 24 24"
           fill="none" stroke="#fff" strokeWidth="3"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 6" />
      </svg>
    </div>
  </div>
);
