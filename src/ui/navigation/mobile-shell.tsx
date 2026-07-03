"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/cuidador", label: "Inicio", icon: "home" },
  { href: "/cuidador/contatos", label: "Contatos", icon: "person_add" },
  { href: "/cuidador/acompanhamentos", label: "Acoes", icon: "event_note" },
];

export function MobileShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background-light">
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md items-center justify-between border-t border-slate-200 bg-white/95 px-6 py-3 backdrop-blur">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs font-semibold ${isActive ? "text-primary" : "text-slate-400"}`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
