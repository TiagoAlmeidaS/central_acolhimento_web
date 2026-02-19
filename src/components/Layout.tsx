import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'hub' },
  { to: '/relatorios', label: 'Relatórios', icon: 'bar_chart' },
  { to: '/cuidadores', label: 'Cuidadores', icon: 'group' },
  { to: '/convidados', label: 'Convidados', icon: 'person_add' },
  { to: '/configuracoes', label: 'Configurações', icon: 'settings' },
]

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <span className="material-symbols-outlined text-2xl">hub</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Torre de Controle</h1>
            <p className="text-xs text-slate-500">Sistema de Acolhimento</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'sidebar-item-active'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 p-2">
            <div className="size-10 rounded-full bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center text-primary font-bold text-sm">
              U
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">Usuário</span>
              <span className="text-[10px] text-slate-500">Coordenador</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
