"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { BottomNavBar, type BottomNavItem } from "@/ui/navigation/bottom-nav";
import { IconCalendar, IconHome, IconUser, IconUsers } from "@/ui/v2-components/icons";

const navItems = [
  { href: "/cuidador", label: "Inicio", icon: <IconHome /> },
  { href: "/cuidador/contatos", label: "Contatos", icon: <IconUsers /> },
  { href: "/cuidador/acompanhamentos", label: "Acoes", icon: <IconCalendar /> },
  { href: "/cuidador/perfil", label: "Perfil", icon: <IconUser /> },
];

export function MobileShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  const items: BottomNavItem[] = navItems.map((item) => ({
    key: item.href,
    label: item.label,
    href: item.href,
    icon: item.icon,
    isActive: pathname === item.href,
  }));

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

      <BottomNavBar items={items} />
    </div>
  );
}
