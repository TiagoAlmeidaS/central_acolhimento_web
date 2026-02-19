import { Link } from 'react-router-dom'
import { MobileLayout } from '@/components/MobileLayout'

const mapaNav = [
  { to: '/mapa', label: 'Board', icon: 'view_kanban', filled: true },
  { to: '/mapa/equipe', label: 'Equipe', icon: 'group' },
  { to: '/mapa/mapa-view', label: 'Mapa', icon: 'map' },
  { to: '/mapa/dados', label: 'Dados', icon: 'analytics' },
  { to: '/mapa/ajustes', label: 'Ajustes', icon: 'settings' },
]

const columns = [
  {
    id: 'novo-tci',
    title: 'Novo TCI',
    count: 12,
    countClass: 'bg-primary/10 text-primary',
    cards: [
      { name: 'João Paulo Silva', note: 'Primeira visita, indicação de Maria.', temp: 'hot', time: '2h atrás', responsaveis: ['J', 'M'] },
      { name: 'Beatriz Mendonça', note: 'Busca aconselhamento familiar.', temp: 'warm', time: '5h atrás', responsaveis: ['B'] },
      { name: 'Lucas Ferreira', note: 'Interesse em grupo de jovens.', temp: 'cold', time: 'Ontem', responsaveis: ['L'] },
    ],
  },
  {
    id: 'em-visita',
    title: 'Em Visita',
    count: 8,
    countClass: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    cards: [
      { name: 'Carla Oliveira', note: 'Visita domiciliar hoje às 19h.', temp: 'hot', time: 'Agendado', tags: ['Família', 'Urgente'], responsavel: 'Ricardo' },
    ],
  },
  {
    id: 'em-consolidacao',
    title: 'Em Consolidação',
    count: 5,
    countClass: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    cards: [],
    empty: true,
  },
  {
    id: 'casa-deus',
    title: 'Casa de Deus',
    count: 20,
    countClass: 'bg-success/10 text-success',
    cards: [
      { name: 'Marcos Vinícius', note: 'Membro ativo no ministério de louvor.', temp: 'integrado', time: '2d atrás' },
    ],
  },
]

const tempConfig = {
  hot: { border: 'border-temp-hot', badge: 'bg-temp-hot/10 text-temp-hot', label: 'Quente' },
  warm: { border: 'border-temp-warm', badge: 'bg-temp-warm/10 text-temp-warm', label: 'Morno' },
  cold: { border: 'border-temp-cold', badge: 'bg-temp-cold/10 text-temp-cold', label: 'Frio' },
  integrado: { border: 'border-success', badge: 'bg-success/10 text-success', label: 'Integrado' },
} as const

type TempKey = keyof typeof tempConfig

export function MapaAcolhimentoPage() {
  return (
    <MobileLayout bottomNav={mapaNav} contentClass="pb-24" fab={
      <Link
        to="/metabolismo"
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-20"
        aria-label="Novo"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </Link>
    }>
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" className="flex items-center justify-center rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">menu</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight">Mapa de Acolhimento</h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center justify-center rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">search</span>
          </button>
          <button type="button" className="flex items-center justify-center rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">filter_list</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto no-scrollbar bg-background-light dark:bg-background-dark">
        <div className="flex h-full p-4 gap-4 items-start min-h-[calc(100dvh-120px)]">
          {columns.map((col) => (
            <section key={col.id} className="kanban-column flex flex-col h-full shrink-0 min-w-[280px] max-w-[280px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {col.title}
                  </h2>
                  <span className={`${col.countClass} text-xs font-bold px-2 py-0.5 rounded-full`}>{col.count}</span>
                </div>
                <button type="button" className="text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 pb-20">
                {col.empty ? (
                  <div className="flex-1 min-h-[120px] flex flex-col gap-3 pb-20 text-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-4">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-4xl mb-2">
                      group_work
                    </span>
                    <p className="text-xs text-slate-400">Mova um cartão para esta etapa</p>
                  </div>
                ) : (
                  col.cards.map((card) => {
                    const temp = tempConfig[card.temp as TempKey] ?? tempConfig.cold
                    return (
                      <div
                        key={card.name}
                        className={`bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border-l-4 ${temp.border} relative group active:scale-[0.98] transition-all`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`${temp.badge} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>
                            {temp.label}
                          </span>
                          <span className="text-[10px] text-slate-400">{card.time}</span>
                        </div>
                        <h3 className="font-bold text-sm mb-1">{card.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{card.note}</p>
                        {'tags' in card && card.tags && (
                          <div className="flex gap-1 mb-3">
                            {card.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[9px] px-1.5 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-2 mt-1">
                          <div className="flex items-center gap-2">
                            {'responsaveis' in card && card.responsaveis && (
                              <div className="flex -space-x-2">
                                {card.responsaveis.map((r) => (
                                  <div
                                    key={r}
                                    className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold"
                                  >
                                    {r}
                                  </div>
                                ))}
                              </div>
                            )}
                            {'responsavel' in card && card.responsavel && (
                              <>
                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600" />
                                <span className="text-[10px] font-medium text-slate-500">Resp: {card.responsavel}</span>
                              </>
                            )}
                            {card.temp === 'integrado' && (
                              <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                            )}
                          </div>
                          {card.temp !== 'integrado' && (
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[18px]">
                              drag_indicator
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      </main>

      <div className="h-8 bg-white dark:bg-slate-900 shrink-0" aria-hidden />
    </MobileLayout>
  )
}
