const kpis = [
  { label: 'Total Acolhidos', value: '1.284', sub: '+12% vs mês anterior', icon: 'trending_up', color: 'green' },
  { label: 'Taxa de Retenção', value: '74.2%', sub: 'Meta: 80% faltam 5.8%', icon: 'analytics', color: 'blue' },
  { label: 'Visitas Realizadas', value: '456', sub: 'Média: 15/dia estável', icon: 'home', color: 'purple' },
  { label: 'Novas Decisões', value: '89', sub: 'Recorde Semanal há 2 dias', icon: 'volunteer_activism', color: 'orange' },
]

const tableRows = [
  { leader: 'Marcos Andrade', initials: 'MA', visits: 42, conversions: 8, prev: 'Novo', current: 'Consolidação', currentColor: 'blue' },
  { leader: 'Lúcia Nogueira', initials: 'LN', visits: 38, conversions: 12, prev: 'Consolidação', current: 'Discipulado', currentColor: 'purple' },
  { leader: 'Ricardo Piva', initials: 'RP', visits: 29, conversions: 3, prev: 'Novo', current: 'Consolidação', currentColor: 'blue' },
]

export function RelatoriosPage() {
  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-64"
            placeholder="Pesquisar relatórios..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-4">
          <button type="button" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <button type="button" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined">chat_bubble</span>
          </button>
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">Coord. Silva</p>
              <p className="text-[10px] text-slate-500">Nível Master</p>
            </div>
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">S</div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Relatórios de Gestão</h2>
              <p className="text-slate-500 mt-1">Acompanhamento de metas e evolução espiritual da rede.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white dark:bg-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Exportar PDF
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                Compartilhar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">
                calendar_today
              </span>
              <select className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary">
                <option>Este Mês (Outubro)</option>
                <option>Últimos 3 Meses</option>
                <option>Ano Corrente</option>
              </select>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">
                map
              </span>
              <select className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary">
                <option>Todos os Setores</option>
                <option>Setor Norte</option>
                <option>Setor Sul</option>
              </select>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">
                medical_services
              </span>
              <select className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary">
                <option>Tipo: Acolhimento</option>
                <option>Tipo: Visita Presencial</option>
                <option>Tipo: Telefone</option>
              </select>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">
                sync_alt
              </span>
              <select className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary">
                <option>Status: Consolidação</option>
                <option>Status: Novo</option>
                <option>Status: Discipulado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{k.label}</p>
                  <span
                    className={`p-1.5 rounded-lg material-symbols-outlined text-sm ${
                      k.color === 'green'
                        ? 'bg-green-100 text-green-600'
                        : k.color === 'blue'
                          ? 'bg-blue-100 text-blue-600'
                          : k.color === 'purple'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-orange-100 text-orange-600'
                    }`}
                  >
                    {k.icon}
                  </span>
                </div>
                <h3 className="text-3xl font-black mt-2">{k.value}</h3>
                <p className="text-xs text-slate-400 mt-2">{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-lg">Retenção ao Longo do Tempo</h4>
                <span className="material-symbols-outlined text-slate-400">info</span>
              </div>
              <div className="flex-1 min-h-[250px] flex items-end justify-between gap-2 px-2">
                {[40, 75, 85, 60, 90, 95, 55].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-lg transition-all ${
                      i === 2 || i === 5 ? 'bg-primary/60' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>S1</span>
                <span>S2</span>
                <span>S3</span>
                <span>S4</span>
                <span>S5</span>
                <span>S6</span>
                <span>S7</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-lg">Crescimento: Metabolismo da Alma</h4>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Maturidade
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-slate-300" /> Novos
                  </span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between gap-4">
                {[
                  { label: 'Integração (Fase 1)', pct: 88 },
                  { label: 'Consolidação (Fase 2)', pct: 62 },
                  { label: 'Discipulado (Fase 3)', pct: 45 },
                  { label: 'Envio/Liderança (Fase 4)', pct: 21 },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{item.label}</span>
                      <span>{item.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-lg">Resumo por Liderança e Transições</h4>
              <button type="button" className="text-primary text-sm font-semibold hover:underline">
                Ver tudo
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Líder de Área
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total de Visitas
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Conversões
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status Anterior
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status Atual
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tableRows.map((row) => (
                    <tr key={row.leader} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {row.initials}
                          </div>
                          <span className="text-sm font-semibold">{row.leader}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{row.visits}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-black">
                          {String(row.conversions).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 italic">{row.prev}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`flex items-center gap-1.5 text-xs font-semibold ${
                            row.currentColor === 'blue' ? 'text-blue-600' : 'text-purple-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              row.currentColor === 'blue' ? 'bg-blue-600' : 'bg-purple-600'
                            }`}
                          />
                          {row.current}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button type="button" className="material-symbols-outlined text-slate-400 hover:text-primary">
                          visibility
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6 bg-primary/5 rounded-xl border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary text-white rounded-full">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div>
                <h5 className="font-bold text-primary">Insight da IA Torre</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  O Setor Norte apresentou um crescimento de 24% em transições para Discipulado este mês. Considere
                  replicar o modelo de treinamento em outros setores.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="whitespace-nowrap px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow hover:bg-blue-700 transition-all"
            >
              Ver Plano Detalhado
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
