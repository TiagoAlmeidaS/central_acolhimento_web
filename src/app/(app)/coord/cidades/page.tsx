import { listCaregiverInvitations } from "@/server/repositories/invitation-repository";
import { listTenants } from "@/server/repositories/mvp-repository";
import { CaregiverInvitationManager } from "@/ui/mvp/caregiver-invitation-manager";
import { TenantManager } from "@/ui/mvp/tenant-manager";

export default async function CitiesPage() {
  const [tenants, invitations] = await Promise.all([listTenants(), listCaregiverInvitations()]);

  return (
    <div className="min-h-screen bg-background-light px-6 py-8 md:px-8">
      <div className="max-w-6xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Tenant</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Cidades</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            A cidade entra agora como entidade central do produto para a base já nascer pronta para escalar.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tenants.map((tenant) => (
            <article key={tenant.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{tenant.name}</h2>
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                  {tenant.status === "active" ? "Ativa" : "Inativa"}
                </span>
              </div>
              <dl className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-4">
                  <dt>Cidade</dt>
                  <dd className="font-semibold text-slate-900">{tenant.city}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Estado</dt>
                  <dd className="font-semibold text-slate-900">{tenant.state}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Coordenador</dt>
                  <dd className="font-semibold text-slate-900">{tenant.coordinator ?? "Nao definido"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <TenantManager tenants={tenants} />
        <CaregiverInvitationManager tenants={tenants} invitations={invitations} />
      </div>
    </div>
  );
}
