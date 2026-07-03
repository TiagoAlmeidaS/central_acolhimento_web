import { listCaregivers, listTenants } from "@/server/repositories/mvp-repository";
import { CaregiverManager } from "@/ui/mvp/caregiver-manager";

export default async function CaregiversPage() {
  const [caregivers, tenants] = await Promise.all([listCaregivers(), listTenants()]);

  return (
    <div className="min-h-screen bg-background-light px-6 py-8 md:px-8">
      <div className="max-w-6xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Coordenação</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Cuidadores</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Esta tela substitui a versão antiga acoplada ao Vite e já fica alinhada ao domínio do monólito.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {caregivers.map((caregiver) => (
            <article key={caregiver.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{caregiver.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{caregiver.phone}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {caregiver.active ? "Ativo" : "Inativo"}
                </span>
              </div>

              <dl className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <dt>E-mail</dt>
                  <dd className="font-semibold text-slate-900">{caregiver.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Cidade</dt>
                  <dd className="font-semibold text-slate-900">{caregiver.city ?? "Nao vinculada"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Pessoas</dt>
                  <dd className="font-semibold text-slate-900">{caregiver.activeMembers ?? 0}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <CaregiverManager caregivers={caregivers} tenants={tenants} />
      </div>
    </div>
  );
}
