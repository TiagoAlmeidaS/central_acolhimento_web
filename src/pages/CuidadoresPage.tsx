import { useState, useEffect, useCallback } from 'react'
import { getMembros, createMembro, updateMembro } from '@/api/client'
import type { Membro, CriarMembroRequest, AtualizarMembroRequest } from '@/api/types'
import { PerfilServico } from '@/api/types'

const perfilLabels: Record<PerfilServico, string> = {
  [PerfilServico.CasaAberta]: 'Casa Aberta',
  [PerfilServico.RedeOracao]: 'Rede Oração',
  [PerfilServico.Coordenador]: 'Coordenador',
}

type StatusKey = 'livre' | 'atencao' | 'critico'

const statusConfig: Record<StatusKey, { bar: string; label: string; labelClass: string; dot: string }> = {
  livre: {
    bar: 'bg-emerald-50 dark:bg-emerald-900/20',
    label: 'Disponível para chamados',
    labelClass: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  atencao: {
    bar: 'bg-amber-50 dark:bg-amber-900/20',
    label: 'Carga Moderada',
    labelClass: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  critico: {
    bar: 'bg-rose-50 dark:bg-rose-900/20',
    label: 'Capacidade Máxima',
    labelClass: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
}

function statusFromLimite(limite: number, _acolhidos: number): StatusKey {
  const acolhidos = _acolhidos ?? 0
  if (acolhidos >= limite) return 'critico'
  if (limite <= 2 && acolhidos >= 1) return 'atencao'
  return 'livre'
}

export function CuidadoresPage() {
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bairroFiltro, setBairroFiltro] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Membro | null>(null)
  const [form, setForm] = useState<CriarMembroRequest>({
    Nome: '',
    Whatsapp: '',
    Bairro: '',
    PerfilServico: PerfilServico.CasaAberta,
    LimiteAcolhimento: 2,
    UserId: null,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getMembros(bairroFiltro || undefined)
      setMembros(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }, [bairroFiltro])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({
      Nome: '',
      Whatsapp: '',
      Bairro: '',
      PerfilServico: PerfilServico.CasaAberta,
      LimiteAcolhimento: 2,
      UserId: null,
    })
    setModalOpen(true)
  }

  const openEdit = (m: Membro) => {
    setEditing(m)
    setForm({
      Nome: m.Nome,
      Whatsapp: m.Whatsapp,
      Bairro: m.Bairro,
      PerfilServico: m.PerfilServico,
      LimiteAcolhimento: m.LimiteAcolhimento,
      UserId: m.UserId,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    setError(null)
    try {
      if (editing) {
        await updateMembro(editing.Id, form as AtualizarMembroRequest)
      } else {
        await createMembro(form)
      }
      setModalOpen(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  const bairrosUnicos = Array.from(new Set(membros.map((m) => m.Bairro))).filter(Boolean).sort()

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestão de Cuidadores</h2>
          <p className="text-sm text-slate-500">Gerencie a disponibilidade e atividades dos irmãos cuidadores.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-64 transition-all"
              placeholder="Filtrar por bairro..."
              type="text"
              value={bairroFiltro}
              onChange={(e) => setBairroFiltro(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Adicionar Novo Cuidador
          </button>
        </div>
      </header>

      <div className="p-8 overflow-y-auto flex-1">
        {error && !modalOpen && (
          <div className="mb-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm">
            {error}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBairroFiltro('')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                !bairroFiltro ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            {bairrosUnicos.slice(0, 5).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBairroFiltro(b)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                  bairroFiltro === b ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {membros.map((m) => {
              const status = statusFromLimite(m.LimiteAcolhimento, 0)
              const config = statusConfig[status]
              return (
                <div
                  key={m.Id}
                  className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="p-5" onClick={() => openEdit(m)}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-700 shadow-sm bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-600 dark:text-slate-400">
                          {m.Nome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ${config.dot} border-2 border-white dark:border-slate-800`}
                          title={config.label}
                        />
                      </div>
                      <button type="button" className="text-slate-400 hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); openEdit(m); }}>
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                      {m.Nome}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">{perfilLabels[m.PerfilServico]} · {m.Bairro}</p>
                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Limite acolhimento</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{m.LimiteAcolhimento}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">WhatsApp</span>
                        <span className="font-medium text-slate-500 truncate max-w-[120px]">{m.Whatsapp}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`${config.bar} px-5 py-2 text-center`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${config.labelClass}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              )
            })}
            <div
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
              onClick={openCreate}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-primary/10">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">add</span>
              </div>
              <span className="text-sm font-semibold text-slate-500 group-hover:text-primary">Novo Cuidador</span>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing ? 'Editar cuidador' : 'Novo cuidador'}</h3>
            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            )}
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              placeholder="Nome"
              value={form.Nome}
              onChange={(e) => setForm((f) => ({ ...f, Nome: e.target.value }))}
            />
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              placeholder="WhatsApp"
              value={form.Whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, Whatsapp: e.target.value }))}
            />
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              placeholder="Bairro"
              value={form.Bairro}
              onChange={(e) => setForm((f) => ({ ...f, Bairro: e.target.value }))}
            />
            <div>
              <label className="block text-xs text-slate-500 mb-1">Perfil</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                value={form.PerfilServico}
                onChange={(e) => setForm((f) => ({ ...f, PerfilServico: Number(e.target.value) as PerfilServico }))}
              >
                {(Object.entries(perfilLabels) as unknown as [PerfilServico, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Limite de acolhimento</label>
              <input
                type="number"
                min={1}
                max={20}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                value={form.LimiteAcolhimento}
                onChange={(e) => setForm((f) => ({ ...f, LimiteAcolhimento: Number(e.target.value) || 1 }))}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={submit} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold">
                {editing ? 'Salvar' : 'Criar'}
              </button>
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
