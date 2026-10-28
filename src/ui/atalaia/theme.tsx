"use client";

import { useSyncExternalStore } from "react";
import { Button, IconButton } from "./button";
import { THEME_STORAGE_KEY } from "./theme-script";

export type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function applyTheme(theme: Theme) {
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Armazenamento indisponivel: o tema vale so ate recarregar.
  }
}

/** Tema atual e a funcao para alterna-lo. Escuro e o padrao. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    theme,
    setTheme: applyTheme,
    toggleTheme: () => applyTheme(theme === "light" ? "dark" : "light"),
  };
}

export type ThemeToggleProps = {
  /** `icon` mostra so o icone (barra superior); `button` mostra icone e rotulo (menu lateral). */
  variant?: "icon" | "button";
  className?: string;
};

export function ThemeToggle({ variant = "button", className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "light" ? "escuro" : "claro";
  const icon = theme === "light" ? "moon" : "sun";

  if (variant === "icon") {
    return <IconButton label={`Usar tema ${next}`} icon={icon} onClick={toggleTheme} className={className} />;
  }
  return (
    <Button variant="ghost" icon={icon} onClick={toggleTheme} className={className ?? "w-full justify-start"}>
      Usar tema {next}
    </Button>
  );
}
