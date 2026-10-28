"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useAuth } from "@/auth/auth-context";
import { cx } from "@/ui/atalaia/cx";
import { AtalaiaMark, Icon, type IconName } from "@/ui/atalaia/icons";
import { ThemeToggle } from "@/ui/atalaia/theme";
import { UserMenu } from "./user-menu";

const navItems: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/cuidador", label: "Início", icon: "painel" },
  { href: "/cuidador/contatos", label: "Contatos", icon: "contatos" },
  { href: "/cuidador/acompanhamentos", label: "Ações", icon: "encontros" },
  { href: "/cuidador/perfil", label: "Perfil", icon: "user" },
];

function isActive(pathname: string, href: string) {
  if (href === "/cuidador") return pathname === "/cuidador";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { session } = useAuth();
  const tenantName = session?.membership.tenantName;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[440px] flex-col border-border bg-bg min-[441px]:border-x">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 flex h-12 items-center gap-2.5 border-b border-border bg-sunken px-4 pt-[env(safe-area-inset-top,0px)]">
        <Link href="/cuidador" className="inline-flex items-center gap-2 text-base font-bold tracking-[-0.01em]">
          <AtalaiaMark size={22} />
          <span>Atalaia</span>
        </Link>
        <span className="min-w-0 flex-1 truncate text-right text-xs text-muted">{tenantName}</span>
        <ThemeToggle variant="icon" />
        <UserMenu profileHref="/cuidador/perfil" compact />
      </header>

      <main id="conteudo" tabIndex={-1} className="flex-1 pb-[calc(72px+env(safe-area-inset-bottom,0px))] outline-none">
        {children}
      </main>

      <nav
        aria-label="Seções"
        className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[440px] -translate-x-1/2 justify-around border-t border-border bg-surface pb-[max(8px,env(safe-area-inset-bottom,0px))] pt-1.5"
      >
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-150",
                active ? "text-primary" : "text-muted hover:text-fg",
              )}
            >
              {active ? <span aria-hidden="true" className="absolute inset-x-5 -top-1.5 h-0.5 rounded-full bg-primary" /> : null}
              <Icon name={item.icon} size={20} strokeWidth={active ? 2 : 1.7} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
