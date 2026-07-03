import { useState, useEffect, useCallback } from 'react'
import { getContatosTci, createContatoTci, getMembros, atribuirResponsavel } from '@/api/client'
import type { ContatoTci, CriarContatoTciRequest, Membro } from '@/api/types'
import { StatusVida } from '@/api/types'

const statusLabels: Record<StatusVida, string> = {
  [StatusVida.Novo]: 'Novo',
  [StatusVida.Visitado]: 'Visitado',
  [StatusVida.FrequentaReuniao]: 'Frequenta Reunião',
  [StatusVida.Consolidado]: 'Consolidado',
}

export function ConvidadosPage() {
  const [contatos, setContatos] = useState<ContatoTci[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [assignContato, setAssignContato] = useState<ContatoTci | null>(null)
  const [membros, setMembros] = useState<Membro[]>([])
  const [assigning, setAssigning] = useState(false)
  const [form, setForm] = useState<CriarContatoTciRequest>({
    Nome: '',
    Whatsapp: '',
    StatusVida: StatusVida.Novo,
    ResponsavelId: null,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getContatosTci()
      setContatos(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar convidados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm({
      Nome: '',
      Whatsapp: '',
      StatusVida: StatusVida.Novo,
      ResponsavelId: null,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    setError(null)
    try {
      await createContatoTci(form)
      setModalOpen(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  const openAssign = async (contato: ContatoTci) => {
    setAssignContato(contato)
    setError(null)
    try {
      const list = await getMembros()
      setMembros(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar membros')
    }
  }

  const onAssign = async (membro: Membro) => {
    if (!assignContato) return
    setAssigning(true)
    setError(null)
    try {
      await atribuirResponsavel(assignContato.Id, membro.Id)
      setAssignContato(null)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atribuir responsável')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Convidados (TCI)</h2>
          <p className="text-sm text-slate-500">Pessoas para cuidar — cadastro e listagem.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Novo Convidado
        </button>
      </header>

      <div className="p-8 overflow-y-auto flex-1">
        {error && !modalOpen && !assignContato && (
          <div className="mb-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Nome</th>
                  <th className="pb-3 pr-4">WhatsApp</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Responsável</th>
                  <th className="pb-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contatos.map((c) => (
                  <tr key={c.Id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{c.Nome}</td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{c.Whatsapp}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {statusLabels[c.StatusVida]}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{c.ResponsavelId ? c.ResponsavelId.slice(0, 8) + '…' : '—'}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => openAssign(c)}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        Atribuir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contatos.length === 0 && (
              <p className="py-8 text-center text-slate-500">Nenhum convidado cadastrado. Clique em Novo Convidado para começar.</p>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Novo convidado</h3>
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
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                value={form.StatusVida ?? StatusVida.Novo}
                onChange={(e) => setForm((f) => ({ ...f, StatusVida: Number(e.target.value) as StatusVida }))}
              >
                {(Object.entries(statusLabels) as unknown as [StatusVida, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={submit} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold">
                Criar
              </button>
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {assignContato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAssignContato(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Atribuir responsável — {assignContato.Nome}</h3>
            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            )}
            <ul className="max-h-64 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
              {membros.map((m) => (
                <li key={m.Id}>
                  <button
                    type="button"
                    onClick={() => onAssign(m)}
                    disabled={assigning}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                  >
                    {m.Nome} {m.Bairro ? `· ${m.Bairro}` : ''}
                  </button>
                </li>
              ))}
            </ul>
            {membros.length === 0 && <p className="text-sm text-slate-500">Nenhum membro cadastrado.</p>}
            <button type="button" onClick={() => setAssignContato(null)} className="w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
