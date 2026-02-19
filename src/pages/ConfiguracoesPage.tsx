const teamMembers = [
  { name: 'Ricardo Costa', email: 'ricardo@care.io', role: 'Coordenador', perms: 'Acesso Total, Relatórios, Configs', initials: 'RC' },
  { name: 'Maria Almeida', email: 'maria.cuidadora@care.io', role: 'Cuidador', perms: 'Registros diários, Chat pacientes', initials: 'MA' },
  { name: 'João Silva', email: 'joao.silva@care.io', role: 'Cuidador', perms: 'Registros diários, Chat pacientes', initials: 'JS' },
]

export function ConfiguracoesPage() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Configurações</h2>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 font-medium">Perfil & Sistema</span>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            type="button"
            className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Salvar Alterações
          </button>
        </div>
      </header>

      <div className="p-8 max-w-5xl mx-auto space-y-8 overflow-y-auto flex-1">
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group">
              <div className="size-32 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center text-4xl font-bold text-slate-500">
                CE
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 size-10 bg-primary text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                <input
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary"
                  type="text"
                  defaultValue="Carlos Eduardo Oliveira"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
                <input
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary"
                  type="email"
                  defaultValue="carlos.eduardo@sistema.com.br"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</label>
                <input
                  className="w-full bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                  readOnly
                  type="text"
                  value="Coordenador Geral"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alterar Senha</label>
                <button
                  type="button"
                  className="w-full border border-primary text-primary font-bold py-2 rounded-lg text-sm hover:bg-primary/5 transition-colors"
                >
                  Resetar Senha
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">palette</span>
              <h3 className="font-bold text-lg">Aparência</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Modo Escuro</p>
                  <p className="text-xs text-slate-500">Alternar entre temas claro e escuro</p>
                </div>
                <input type="checkbox" className="rounded text-primary focus:ring-primary" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Notificações Push</p>
                  <p className="text-xs text-slate-500">Alertas críticos no navegador</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
              </div>
            </div>
          </section>
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">cloud_sync</span>
              <h3 className="font-bold text-lg">Dados & Offline</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Sincronização Offline (PWA)</p>
                  <p className="text-xs text-slate-500">Permitir uso sem conexão</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
              </div>
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <span className="text-sm font-semibold">Exportar Relatório Mensal</span>
                <span className="material-symbols-outlined text-sm">download</span>
              </button>
            </div>
          </section>
        </div>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">chat_bubble</span>
              <h3 className="font-bold text-lg">Integração WhatsApp (Evolution API)</h3>
            </div>
            <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
              Conectado
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Endpoint URL</label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                type="text"
                defaultValue="https://api.evolution.io/v1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Instância</label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                type="text"
                defaultValue="care-manager-01"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">API Key</label>
              <div className="relative">
                <input
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm pr-10"
                  type="password"
                  defaultValue="••••••••••••••••"
                />
                <span className="material-symbols-outlined absolute right-3 top-2 text-slate-400 text-sm cursor-pointer">
                  visibility
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs hover:bg-slate-200 transition-colors"
            >
              Testar Conexão
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg text-xs hover:bg-primary/20 transition-colors"
            >
              Re-autenticar Instância
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              <h3 className="font-bold text-lg">Gestão de Equipe</h3>
            </div>
            <button type="button" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              <span className="material-symbols-outlined text-sm">add</span>
              Novo Usuário
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Função</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Permissões</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamMembers.map((u) => (
                  <tr key={u.email} className="group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 text-xs">
                          {u.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                          u.role === 'Coordenador'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <p className="text-xs text-slate-500">{u.perms}</p>
                    </td>
                    <td className="py-4 text-right">
                      <button type="button" className="p-1 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button type="button" className="p-1 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex justify-end gap-4 pt-4 pb-12">
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-8 py-2.5 rounded-lg font-bold text-white bg-primary shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity"
          >
            Salvar Todas as Configurações
          </button>
        </div>
      </div>
    </>
  )
}
