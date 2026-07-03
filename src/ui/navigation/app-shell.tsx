"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/auth/auth-context";

const navItems = [
  { href: "/coord", label: "Dashboard", icon: "dashboard" },
  { href: "/coord/cidades", label: "Cidades", icon: "location_city" },
  { href: "/coord/contatos", label: "Novos contatos", icon: "person_add" },
  { href: "/coord/membros", label: "Membros", icon: "group" },
  { href: "/coord/cuidadores", label: "Cuidadores", icon: "volunteer_activism" },
  { href: "/coord/acompanhamentos", label: "Acompanhamentos", icon: "event_note" },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-background-light text-slate-900">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white xl:flex xl:flex-col">
        <div className="border-b border-slate-200 px-6 py-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Next Monolith</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Central de Acolhimento</h2>
          <p className="mt-2 text-sm text-slate-500">Web e backend no mesmo projeto.</p>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{user?.email ?? "Modo local"}</p>
            <p className="mt-1 text-xs text-slate-500">Autenticacao local temporaria ativa</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
