import { listCaregivers, listSeeds, listTenants } from "@/server/repositories/mvp-repository";
import { ContactManager } from "@/ui/mvp/contact-manager";

export default async function ContactsPage() {
  const [contacts, tenants, caregivers] = await Promise.all([listSeeds(), listTenants(), listCaregivers()]);

  return (
    <div className="min-h-screen bg-background-light px-6 py-8 md:px-8">
      <div className="max-w-7xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Coordenacao</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Novos contatos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Essa e a porta de entrada do cuidado. O cuidador registra o contato e a coordenacao acompanha a conversao para membro.
          </p>
        </div>

        <ContactManager contacts={contacts} tenants={tenants} caregivers={caregivers} />
      </div>
    </div>
  );
}
