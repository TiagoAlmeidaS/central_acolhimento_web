import { Link } from 'react-router-dom'
import { MobileLayout } from '@/components/MobileLayout'

const appNav = [
  { to: '/meu-servico', label: 'Início', icon: 'home', filled: true },
  { to: '/meu-servico/acolhidos', label: 'Acolhidos', icon: 'group' },
  { to: '/meu-servico/oracoes', label: 'Orações', icon: 'prayer_times' },
  { to: '/meu-servico/perfil', label: 'Perfil', icon: 'account_circle' },
]

const lastMessages = [
  { name: 'Maria Silva', preview: 'Obrigado pelo acolhimento de ontem...', time: '14:05' },
]

export function DashboardMeuServicoPage() {
  return (
    <MobileLayout bottomNav={appNav}>
      <header className="px-6 pt-8 pb-4 bg-white dark:bg-slate-900 border-b border-border-subtle dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-500">
              T
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Bom dia, Tiago</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">chat</span>
                  WhatsApp Conectado
                </span>
              </div>
            </div>
          </div>
          <button type="button" className="p-2 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/metabolismo"
            className="flex flex-col items-center justify-center p-4 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-3xl mb-2">assignment_add</span>
            <span className="text-sm font-semibold">Registrar Visita</span>
          </Link>
          <button
            type="button"
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 border border-border-subtle dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-3xl mb-2 text-primary">person_add</span>
            <span className="text-sm font-semibold">Novos Convidados</span>
          </button>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Meus Cuidados</h2>
            <a href="#" className="text-sm font-medium text-primary">
              Ver todos
            </a>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-border-subtle dark:border-slate-700 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              3 pessoas sob sua responsabilidade direta esta semana.
            </p>
            <div className="flex items-center -space-x-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="size-10 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500"
                >
                  {i}
                </div>
              ))}
              <div className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-400">
                <span className="material-symbols-outlined text-sm">add</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Próxima Oração</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-border-subtle dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-3xl filled">schedule</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">15:30</p>
                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-primary text-[10px] font-bold uppercase rounded leading-none shrink-0">
                  Hoje
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sala de Oração - Ala Sul</p>
            </div>
          </div>
        </section>

        <section className="pb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Últimas Mensagens</h2>
          <div className="space-y-3">
            {lastMessages.map((msg) => (
              <div
                key={msg.name}
                className="flex gap-4 p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-border-subtle dark:border-slate-700"
              >
                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-slate-500">mail</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{msg.name}</p>
                  <p className="text-xs text-slate-500 truncate">"{msg.preview}"</p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium shrink-0 pt-1">{msg.time}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </MobileLayout>
  )
}
