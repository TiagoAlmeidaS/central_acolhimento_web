import { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export type MobileNavItem = {
  to: string
  label: string
  icon: string
  filled?: boolean
}

type MobileLayoutProps = {
  children: ReactNode
  bottomNav?: MobileNavItem[]
  fab?: ReactNode
  /** Extra padding bottom when there's a bottom nav (default: pb-20) */
  contentClass?: string
}

export function MobileLayout({ children, bottomNav, fab, contentClass = 'pb-20' }: MobileLayoutProps) {
  const location = useLocation()
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 max-w-md mx-auto shadow-2xl relative">
      <div className={`flex-1 flex flex-col overflow-hidden ${contentClass}`}>
        {children}
      </div>
      {fab}
      {bottomNav && bottomNav.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-border-subtle dark:border-slate-800 px-6 py-2 z-10">
          <div className="flex justify-between items-center">
            {bottomNav.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                    isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isActive || item.filled ? 'filled' : ''}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
