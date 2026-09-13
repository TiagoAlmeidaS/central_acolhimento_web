"use client";

import Link from "next/link";
import React from "react";

/**
 * Item da barra inferior. Pode ser um link (href) ou um botao (onClick),
 * como o "Mais" da coordenacao que abre a folha sobreposta.
 */
export type BottomNavItem = {
  key: string;
  label: string;
  icon: React.ReactElement;
  isActive: boolean;
  href?: string;
  onClick?: () => void;
};

const barStyle: React.CSSProperties = {
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
};

function itemStyle(isActive: boolean): React.CSSProperties {
  return {
    flex: 1,
    minHeight: 44,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    textDecoration: "none",
    color: isActive ? "var(--accent)" : "var(--text-3)",
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "-0.005em",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "color 0.15s, transform 0.1s",
    // Reset para o caso de <button>
    background: "none",
    border: "none",
    padding: 0,
  };
}

function pressHandlers() {
  return {
    onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
      event.currentTarget.style.transform = "scale(0.95)";
    },
    onMouseUp: (event: React.MouseEvent<HTMLElement>) => {
      event.currentTarget.style.transform = "";
    },
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
      event.currentTarget.style.transform = "";
    },
  };
}

function renderIcon(icon: React.ReactElement, isActive: boolean) {
  return React.cloneElement(icon as React.ReactElement<{ size?: number; sw?: number }>, {
    size: 22,
    sw: isActive ? 2.2 : 1.8,
  });
}

/**
 * Barra de navegacao inferior compartilhada entre o app do cuidador
 * (MobileShell) e a navegacao mobile da coordenacao (CoordMobileNav).
 */
export function BottomNavBar({ items }: Readonly<{ items: BottomNavItem[] }>) {
  return (
    <nav style={barStyle}>
      {items.map((item) => {
        const content = (
          <>
            {renderIcon(item.icon, item.isActive)}
            <span>{item.label}</span>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={item.onClick}
              style={itemStyle(item.isActive)}
              {...pressHandlers()}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            style={itemStyle(item.isActive)}
            {...pressHandlers()}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
