"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { BottomNavBar, type BottomNavItem } from "@/ui/navigation/bottom-nav";
import {
  IconBuilding,
  IconCalendar,
  IconCar,
  IconChurch,
  IconDoc,
  IconHeart,
  IconHome,
  IconLogout,
  IconMore,
  IconSparkle,
  IconUser,
  IconUsers,
} from "@/ui/v2-components/icons";

// Itens que ficam dentro da folha "Mais" (o restante do menu lateral).
const moreItems = [
  { href: "/coord/cidades", label: "Cidades", icon: <IconBuilding size={20} /> },
  { href: "/coord/cuidadores", label: "Cuidadores", icon: <IconHeart size={20} /> },
  { href: "/coord/saidas", label: "Saidas", icon: <IconCar size={20} /> },
  { href: "/coord/tci", label: "TCI", icon: <IconSparkle size={20} /> },
  { href: "/coord/relatorios/saidas", label: "Relatorio de saidas", icon: <IconDoc size={20} /> },
  { href: "/coord/perfil", label: "Perfil", icon: <IconUser size={20} /> },
];

/**
 * Navegacao mobile da coordenacao: barra inferior + folha "Mais".
 * Visivel abaixo de xl; a partir de xl o menu lateral do AppShell assume.
 */
export function CoordMobileNav({ onLogout }: Readonly<{ onLogout: () => void }>) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isMoreRoute = moreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  const items: BottomNavItem[] = [
    {
      key: "painel",
      label: "Painel",
      href: "/coord",
      icon: <IconHome />,
      isActive: pathname === "/coord",
    },
    {
      key: "pessoas",
      label: "Pessoas",
      href: "/coord/contatos",
      icon: <IconUsers />,
      isActive: pathname.startsWith("/coord/contatos") || pathname.startsWith("/coord/membros"),
    },
    {
      key: "igreja",
      label: "Igreja",
      href: "/coord/igreja",
      icon: <IconChurch />,
      isActive: pathname.startsWith("/coord/igreja"),
    },
    {
      key: "acoes",
      label: "Acoes",
      href: "/coord/acompanhamentos",
      icon: <IconCalendar />,
      isActive: pathname.startsWith("/coord/acompanhamentos"),
    },
    {
      key: "mais",
      label: "Mais",
      icon: <IconMore />,
      isActive: sheetOpen || isMoreRoute,
      onClick: () => setSheetOpen((open) => !open),
    },
  ];

  return (
    <div className="xl:hidden">
      {sheetOpen ? <MoreSheet onClose={() => setSheetOpen(false)} onLogout={onLogout} pathname={pathname} /> : null}
      <BottomNavBar items={items} />
    </div>
  );
}

function MoreSheet({
  onClose,
  onLogout,
  pathname,
}: Readonly<{ onClose: () => void; onLogout: () => void; pathname: string }>) {
  return (
    <>
      {/* Fundo escurecido: tocar fecha a folha */}
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          border: "none",
          padding: 0,
          zIndex: 200,
          cursor: "pointer",
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mais opcoes"
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 440,
          zIndex: 201,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.12)",
          padding: "12px 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: "var(--border)",
            margin: "0 auto 12px",
          }}
        />

        {moreItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minHeight: 48,
                padding: "12px 14px",
                borderRadius: 14,
                fontSize: 14.5,
                fontWeight: 600,
                textDecoration: "none",
                background: isActive ? "var(--accent-bg)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-2)",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: isActive ? "var(--accent)" : "var(--text-3)",
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minHeight: 48,
            padding: "12px 14px",
            borderRadius: 14,
            border: "none",
            background: "transparent",
            color: "var(--text-2)",
            fontSize: 14.5,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", color: "var(--text-3)" }}>
            <IconLogout size={20} />
          </span>
          <span>Sair</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 8,
            width: "100%",
            minHeight: 48,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1.5px solid var(--border-strong)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Fechar
        </button>
      </div>
    </>
  );
}
