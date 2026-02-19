import { Link } from 'react-router-dom'

const kanbanColumns = [
  { id: 'novo', title: 'Novo Contato', count: 4, color: 'bg-primary' },
  { id: 'visita', title: 'Primeira Visita', count: 2, color: 'bg-warning' },
  { id: 'acompanhamento', title: 'Em Acompanhamento', count: 8, color: 'bg-success' },
  { id: 'integrado', title: 'Integrado', count: 15, color: 'bg-primary' },
]

const capacityItems: { name: string; range: string; value: number; dotClass: string; badgeClass: string }[] = [
  { name: 'João Silva', range: '0-1 acolhido', value: 1, dotClass: 'bg-success', badgeClass: 'bg-success/10 text-success' },
  { name: 'Maria Oliveira', range: '2-3 acolhidos', value: 3, dotClass: 'bg-warning', badgeClass: 'bg-warning/10 text-warning' },
  { name: 'Pedro Albuquerque', range: '4+ acolhidos', value: 5, dotClass: 'bg-danger', badgeClass: 'bg-danger/10 text-danger' },
  { name: 'Carla Rocha', range: '2-3 acolhidos', value: 2, dotClass: 'bg-warning', badgeClass: 'bg-warning/10 text-warning' },
  { name: 'José Dantas', range: '0-1 acolhido', value: 0, dotClass: 'bg-success', badgeClass: 'bg-success/10 text-success' },
]

export function DashboardPage() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-primary">
            <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">hub</span>
            </div>
            <div>
              <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">
                Torre de Controle
              </h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sistema de Acolhimento</p>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-primary text-sm font-semibold border-b-2 border-primary pb-1">
              Dashboard
            </Link>
            <Link to="/relatorios" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">
              Relatórios
            </Link>
            <Link to="/cuidadores" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">
              Cuidadores
            </Link>
            <Link to="/configuracoes" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">
              Configurações
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary"
              placeholder="Buscar convidado..."
              type="text"
            />
          </div>
          <button type="button" className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-danger rounded-full border-2 border-white dark:border-slate-900" />
          </button>
          <div className="size-10 rounded-full bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center text-primary font-bold">
            U
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-[1600px] mx-auto w-full overflow-y-auto">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Taxa de Retenção TCI</p>
              <span className="material-symbols-outlined text-primary">analytics</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">87.4%</h3>
              <span className="text-success text-xs font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">trending_up</span> 2.4%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '87.4%' }} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Casas Ativas</p>
              <span className="material-symbols-outlined text-success">home_work</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">92%</h3>
              <span className="text-slate-400 text-xs font-medium">Meta: 95%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-success h-full rounded-full" style={{ width: '92%' }} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-danger flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Alerta de Inatividade</p>
              <span className="material-symbols-outlined text-danger">warning</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-danger">14</h3>
              <span className="text-danger text-xs font-bold">Casos urgentes</span>
            </div>
            <p className="text-xs text-slate-400">Exige intervenção nas últimas 48h</p>
          </div>
        </section>

        <div className="flex flex-col xl:flex-row gap-8 flex-1 min-h-0">
          <section className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                Jornada Espiritual
              </h2>
              <button
                type="button"
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Novo Convidado
              </button>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar flex-1 items-start min-h-[280px]">
              {kanbanColumns.map((col) => (
                <div
                  key={col.id}
                  className="kanban-column flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 min-w-[280px] min-h-full"
                >
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
                      <span className={`size-2 rounded-full ${col.color}`} />
                      {col.title} ({col.count})
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-lg">more_horiz</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">Ana Souza</h4>
                        <span className="px-2 py-0.5 rounded bg-warning/10 text-warning text-[10px] font-bold">3 dias</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">call</span> Pendente retorno
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border border-white dark:border-slate-800 text-[8px] font-bold">
                          JD
                        </div>
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-lg">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="w-full xl:w-80 flex flex-col gap-4 shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-full">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">group_work</span>
                  Gestão de Capacidade
                </h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Cuidadores Ativos</p>
              </div>
              <div className="p-4 flex flex-col gap-4 custom-scrollbar overflow-y-auto">
                {capacityItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-2 rounded-full ${item.dotClass}`} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{item.name}</span>
                        <span className="text-[10px] text-slate-400">{item.range}</span>
                      </div>
                    </div>
                    <span className={`${item.badgeClass} text-xs font-bold px-2 py-1 rounded`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-auto p-4 bg-primary/5 dark:bg-primary/10 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <span>Capacidade Total</span>
                    <span className="text-primary">78%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '78%' }} />
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Balancear Cargas
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-4">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-success" /> Servidor Online
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">update</span> Última sincronização: Agora
          </span>
        </div>
        <div className="flex gap-6">
          <a className="hover:text-primary" href="#">Manual do Sistema</a>
          <a className="hover:text-primary" href="#">Termos de Uso</a>
          <a className="hover:text-primary font-bold text-slate-600 dark:text-slate-300" href="#">Suporte Técnico</a>
        </div>
      </footer>
    </>
  )
}
