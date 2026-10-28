"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/auth/auth-context";
import { cx } from "@/ui/atalaia/cx";
import { AtalaiaMark, Icon, type IconName } from "@/ui/atalaia/icons";
import { ThemeToggle } from "@/ui/atalaia/theme";
import { UserMenu } from "./user-menu";

type NavItem = { href: string; label: string; icon: IconName };
type NavGroup = { label: string; items: NavItem[] };

// Destinos da coordenacao agrupados como no prototipo Atalaia (rotulos mono por secao).
const navGroups: NavGroup[] = [
  {
    label: "Acolhimento",
    items: [
      { href: "/coord", label: "Painel", icon: "painel" },
      { href: "/coord/contatos", label: "Novos contatos", icon: "contatos" },
      { href: "/coord/membros", label: "Assistidos", icon: "assistidos" },
      { href: "/coord/acompanhamentos", label: "Acompanhamentos", icon: "message" },
      { href: "/coord/saidas", label: "Saídas", icon: "saidas" },
    ],
  },
  {
    label: "Encontros",
    items: [{ href: "/coord/tci", label: "TCI", icon: "encontros" }],
  },
  {
    label: "Equipe e rede",
    items: [
      { href: "/coord/cuidadores", label: "Cuidadores", icon: "users" },
      { href: "/coord/igreja", label: "Igreja", icon: "church" },
      { href: "/coord/cidades", label: "Cidades", icon: "city" },
    ],
  },
  {
    label: "Conta",
    items: [{ href: "/coord/perfil", label: "Perfil", icon: "user" }],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/coord") return pathname === "/coord";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppShellProps = Readonly<{
  children: React.ReactNode;
  /** Contagens exibidas ao lado dos itens do menu, por `href` (ex.: Painel com quem precisa de alguem). */
  badges?: Partial<Record<string, number>>;
}>;

export function AppShell({ children, badges }: AppShellProps) {
  const pathname = usePathname();
  const { session } = useAuth();
  const tenantName = session?.membership.tenantName ?? "Sem localidade";

  return (
    <div className="min-h-screen min-[900px]:grid min-[900px]:grid-cols-[236px_minmax(0,1fr)]">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>

      <aside className="sticky top-0 z-20 border-b border-border bg-sunken min-[900px]:flex min-[900px]:h-screen min-[900px]:flex-col min-[900px]:gap-4 min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:px-3 min-[900px]:py-4">
        {/* Marca (e, no celular, igreja + tema + conta na mesma linha) */}
        <div className="flex items-center gap-2.5 px-4 pt-2.5 min-[900px]:px-2 min-[900px]:py-1">
          <Link
            href="/coord"
            className="inline-flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.01em]"
            aria-label="Atalaia, ir para o painel"
          >
            <AtalaiaMark />
            <span className="max-[899px]:sr-only">Atalaia</span>
          </Link>
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold min-[900px]:hidden">{tenantName}</span>
          <ThemeToggle variant="icon" className="min-[900px]:hidden" />
          <UserMenu profileHref="/coord/perfil" compact className="min-[900px]:hidden" />
        </div>

        {/* Igreja atual (desktop) */}
        <div className="hidden gap-0.5 rounded-md border border-border bg-surface p-2 min-[900px]:grid">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">Igreja</span>
          <b className="truncate text-sm font-semibold">{tenantName}</b>
        </div>

        <nav
          aria-label="Seções"
          className="no-scrollbar flex gap-0.5 overflow-x-auto px-3 pb-2 pt-2 min-[900px]:grid min-[900px]:flex-1 min-[900px]:content-start min-[900px]:gap-4 min-[900px]:overflow-y-auto min-[900px]:overflow-x-visible min-[900px]:p-0"
        >
          {navGroups.map((group) => (
            <div key={group.label} className="contents min-[900px]:grid min-[900px]:gap-0.5">
              <p className="hidden px-2.5 pb-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-subtle min-[900px]:block">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const badge = badges?.[item.href];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex h-[34px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-control px-2.5 font-medium transition-colors duration-150",
                      active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface hover:text-fg",
                    )}
                  >
                    <Icon name={item.icon} size={17} />
                    <span>{item.label}</span>
                    {badge ? (
                      <span
                        aria-label={`${badge} precisam de alguém`}
                        className="ml-auto min-w-5 rounded-[10px] bg-danger-soft px-1.5 text-center font-mono text-[11px] font-semibold leading-5 text-danger"
                      >
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Rodape (desktop): tema e conta */}
        <div className="mt-auto hidden gap-2.5 min-[900px]:grid">
          <ThemeToggle />
          <UserMenu profileHref="/coord/perfil" placement="up" />
        </div>
      </aside>

      <main id="conteudo" tabIndex={-1} className="min-w-0 outline-none">
        {children}
      </main>
    </div>
  );
}
