import { listMembers, listSeeds } from "@/server/repositories/mvp-repository";
import { MobileShell } from "@/ui/navigation/mobile-shell";

export default async function CaregiverDashboardPage() {
  const [members, contacts] = await Promise.all([listMembers(), listSeeds()]);
  const visibleMembers = members.slice(0, 3);

  return (
    <MobileShell>
      <div className="space-y-6 px-5 py-6">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Meu servico</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Painel do cuidador</h1>
          <p className="mt-2 text-sm text-slate-500">Visao mobile first para captar contatos e registrar acompanhamentos.</p>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-primary p-4 text-white">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Minhas pessoas</p>
            <p className="mt-3 text-3xl font-black">{visibleMembers.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Novos contatos</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{contacts.length}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Pessoas em acompanhamento</p>
          <div className="mt-4 space-y-3">
            {visibleMembers.map((member) => (
              <div key={member.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{member.name}</p>
                <p className="mt-1 text-sm text-slate-500">{member.status}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
