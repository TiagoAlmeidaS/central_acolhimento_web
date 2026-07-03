import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const spiritualStates = [
  { id: 'novo', label: 'Novo', sub: 'Sementes', emoji: '🌱' },
  { id: 'raizes', label: 'Raízes', sub: 'Crescendo', emoji: '🌿' },
  { id: 'firme', label: 'Firme', sub: 'Frutos', emoji: '🌳' },
] as const

export function MetabolismoAlmaPage() {
  const [state, setState] = useState<string>('novo')
  const [journal, setJournal] = useState('')
  const [notifyCentral, setNotifyCentral] = useState(true)
  const [successOpen, setSuccessOpen] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = () => {
    setSuccessOpen(true)
  }

  const handleCloseSuccess = () => {
    setSuccessOpen(false)
    navigate('/meu-servico')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 w-full">
          <Link
            to="/meu-servico"
            className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Voltar"
          >
            <span className="material-symbols-outlined block">arrow_back</span>
          </Link>
          <div className="flex-1 px-4 text-center">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Metabolismo da Alma
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Relatório de Visita • Gabriel Santos
            </p>
          </div>
          <div className="w-10" aria-hidden />
        </div>
      </header>

      <main className="flex-1 w-full p-4 space-y-8 overflow-y-auto pb-36">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Diário de Jornada
            </h2>
          </div>
          <div className="relative group">
            <textarea
              className="w-full min-h-[220px] p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400 text-base leading-relaxed resize-none shadow-sm"
              placeholder="Como foi a visita? Descreva os momentos marcantes e a conexão espiritual estabelecida hoje..."
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-medium bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded backdrop-blur-sm">
              Modo Reflexivo Ativo
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-primary text-xl">psychology_alt</span>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Estado Espiritual
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {spiritualStates.map((s) => {
              const isChecked = state === s.id
              return (
                <label key={s.id} className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="spiritual-state"
                    className="sr-only"
                    checked={isChecked}
                    onChange={() => setState(s.id)}
                  />
                  <div
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 ${
                      isChecked
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <span
                      className={`text-3xl mb-2 transition-all scale-100 group-active:scale-95 ${
                        isChecked ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'
                      }`}
                    >
                      {s.emoji}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isChecked ? 'text-primary' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-400 text-center leading-tight mt-1">{s.sub}</span>
                  </div>
                </label>
              )
            })}
          </div>
        </section>

        <section className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">hub</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notificar Central</p>
              <p className="text-[11px] text-slate-500">Envio automático para supervisão</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={notifyCentral}
              onChange={(e) => setNotifyCentral(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
          </label>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 pb-8 z-20">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <span>Finalizar e Enviar</span>
            <span className="material-symbols-outlined">send</span>
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-widest">
            A jornada continua
          </p>
        </div>
      </footer>

      {/* Success overlay */}
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-300 ${
          successOpen ? 'bg-slate-900/40 backdrop-blur-sm opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!successOpen}
      >
        <div
          className={`bg-white dark:bg-slate-900 rounded-t-3xl p-8 space-y-6 transform transition-transform duration-300 ${
            successOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2" />
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Relatório Enviado</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-[240px] mx-auto">
                Obrigado por nutrir este crescimento. A Central já foi notificada.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold py-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
