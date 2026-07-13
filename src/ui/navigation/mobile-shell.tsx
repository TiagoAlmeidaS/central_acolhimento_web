"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { IconCalendar, IconHome, IconUser, IconUsers } from "@/ui/v2-components/icons";

const navItems = [
  { href: "/cuidador", label: "Inicio", icon: <IconHome /> },
  { href: "/cuidador/contatos", label: "Contatos", icon: <IconUsers /> },
  { href: "/cuidador/acompanhamentos", label: "Acoes", icon: <IconCalendar /> },
  { href: "/cuidador/perfil", label: "Perfil", icon: <IconUser /> },
];

export function MobileShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div
      style={{
        maxWidth: 440,
        margin: "0 auto",
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <main style={{ flex: 1, paddingBottom: 100 }}>{children}</main>

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 440,
          paddingTop: 10,
          paddingBottom: 24,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-around",
          zIndex: 100,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.03)",
          backdropFilter: "blur(10px)",
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                textDecoration: "none",
                color: isActive ? "var(--accent)" : "var(--text-3)",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "-0.005em",
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "color 0.15s, transform 0.1s",
              }}
              onMouseDown={(event) => {
                event.currentTarget.style.transform = "scale(0.95)";
              }}
              onMouseUp={(event) => {
                event.currentTarget.style.transform = "";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = "";
              }}
            >
              {React.cloneElement(item.icon as React.ReactElement<{ size?: number; sw?: number }>, {
                size: 22,
                sw: isActive ? 2.2 : 1.8,
              })}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
