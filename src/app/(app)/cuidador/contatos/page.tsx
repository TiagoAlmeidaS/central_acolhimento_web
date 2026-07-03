import { listCaregivers, listSeeds, listTenants } from "@/server/repositories/mvp-repository";
import { MobileShell } from "@/ui/navigation/mobile-shell";
import { ContactManager } from "@/ui/mvp/contact-manager";

export default async function CaregiverContactsPage() {
  const [contacts, tenants, caregivers] = await Promise.all([listSeeds(), listTenants(), listCaregivers()]);

  return (
    <MobileShell>
      <div className="space-y-6 px-4 py-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Meu servico</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Novos contatos</h1>
          <p className="mt-2 text-sm text-slate-500">Registre rapidamente quem acabou de entrar no fluxo de acolhimento.</p>
        </div>

        <ContactManager contacts={contacts} tenants={tenants} caregivers={caregivers} />
      </div>
    </MobileShell>
  );
}
