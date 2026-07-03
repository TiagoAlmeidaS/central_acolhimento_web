import { DashboardSummary } from "@/ui/dashboard/dashboard-summary";
import { getDashboardSummary, listFollowups } from "@/server/repositories/mvp-repository";

export default async function CoordDashboardPage() {
  const [cards, followups] = await Promise.all([getDashboardSummary(), listFollowups()]);

  return (
    <div className="flex min-h-screen flex-col bg-background-light">
      <header className="border-b border-slate-200 bg-white/90 px-6 py-5 backdrop-blur md:px-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Coordenacao</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Dashboard do MVP</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Este dashboard já nasce no modelo do monólito em Next. O próximo passo é trocar os dados mockados por consultas
          reais no Postgres e nos Route Handlers do próprio app.
        </p>
      </header>

      <main className="flex-1 space-y-8 px-6 py-8 md:px-8">
        <DashboardSummary cards={cards} />

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Fluxo do MVP</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Jornada principal</h2>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Monólito</span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[
                "Login",
                "Selecionar cidade",
                "Dashboard",
                "Registrar novo contato",
                "Converter para membro",
                "Designar cuidador",
                "Registrar acompanhamento",
              ].map((step, index) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Passo {index + 1}</span>
                  <p className="mt-2 text-base font-semibold text-slate-900">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Ultimos acompanhamentos</p>
            <div className="mt-5 space-y-3">
              {followups.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.member ?? "Sem membro"}</p>
                      <p className="text-sm text-slate-500">{item.notes}</p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                      {item.occurredAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
