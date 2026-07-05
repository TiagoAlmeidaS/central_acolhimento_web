export const dynamic = "force-dynamic";

import { listCaregivers, listFollowups, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { MobileShell } from "@/ui/navigation/mobile-shell";
import { FollowupManager } from "@/ui/mvp/followup-manager";

export default async function CaregiverFollowupsPage() {
  const session = await requireServerAuthSession("caregiver");
  const scope = getDataScopeFromSession(session);
  const [followups, tenants, members, caregivers] = await Promise.all([
    listFollowups(scope),
    listTenants(scope),
    listMembers(scope),
    listCaregivers(scope),
  ]);

  return (
    <MobileShell>
      <div className="space-y-6 px-4 py-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Meu servico</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Acompanhamentos</h1>
          <p className="mt-2 text-sm text-slate-500">Registre visitas, ligacoes, mensagens e a proxima acao do cuidado.</p>
        </div>

        <FollowupManager followups={followups} tenants={tenants} members={members} caregivers={caregivers} />
      </div>
    </MobileShell>
  );
}
