"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/auth/auth-context";
import { Avatar } from "@/ui/v2-components/ui";
import {
  IconHome,
  IconMapPin,
  IconPlus,
  IconUsers,
  IconHeart,
  IconCalendar,
  IconCar,
  IconLogout,
  IconBuilding,
  IconSparkle,
  IconUser,
} from "@/ui/v2-components/icons";

// Mapeamento de rotas e seus respectivos ícones da V2
const navItems = [
  { href: "/coord", label: "Dashboard", icon: <IconHome size={20} /> },
  { href: "/coord/cidades", label: "Cidades", icon: <IconBuilding size={20} /> },
  { href: "/coord/contatos", label: "Novos contatos", icon: <IconPlus size={20} /> },
  { href: "/coord/membros", label: "Membros", icon: <IconUsers size={20} /> },
  { href: "/coord/cuidadores", label: "Cuidadores", icon: <IconHeart size={20} /> },
  { href: "/coord/acompanhamentos", label: "Acompanhamentos", icon: <IconCalendar size={20} /> },
  { href: "/coord/saidas", label: "Saidas", icon: <IconCar size={20} /> },
  { href: "/coord/tci", label: "TCI", icon: <IconSparkle size={20} /> },
  { href: "/coord/perfil", label: "Perfil", icon: <IconUser size={20} /> },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user, session } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  const userDisplayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Sem sessão";
  const tenantSigla = session?.membership.tenantName ? session.membership.tenantName.substring(0, 2).toUpperCase() : "AD";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Sidebar aside */}
      <aside
        style={{
          width: 280,
          flexShrink: 0,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
        }}
        className="hidden xl:flex"
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--accent)",
            }}
          >
            Acolhimento V2
          </p>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "var(--text)",
            }}
          >
            Central de Acolhimento
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
            Gestão local integrada
          </p>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: 14,
                  padding: "12px 16px",
                  fontSize: 14.5,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background-color 0.15s, color 0.15s",
                  background: isActive ? "var(--accent-bg)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-2)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--surface-2)";
                    e.currentTarget.style.color = "var(--text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-2)";
                  }
                }}
              >
                <span
                  style={{
                    color: isActive ? "var(--accent)" : "var(--text-3)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (User Info & Logout) */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
          <div
            style={{
              padding: "16px",
              background: "var(--surface-2)",
              borderRadius: 16,
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={userDisplayName} size={40} ring />
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userDisplayName}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 11.5,
                    color: "var(--text-3)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.email ?? "Sem e-mail"}
                </p>
              </div>
            </div>

            <div style={{ height: 1, background: "var(--border)" }} />

            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 9.5,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--accent)",
                }}
              >
                {session?.membership.role === "coordinator" ? "Coordenação" : "Cuidador"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>
                {session?.membership.tenantName ?? "Sem localidade"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background-color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface)";
              }}
            >
              <IconLogout size={16} style={{ color: "var(--text-3)" }} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
