import { listCaregivers, listFollowups, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { FollowupManager } from "@/ui/mvp/followup-manager";

export default async function FollowupsPage() {
  const [followups, tenants, members, caregivers] = await Promise.all([
    listFollowups(),
    listTenants(),
    listMembers(),
    listCaregivers(),
  ]);

  return (
    <div className="min-h-screen bg-background-light px-6 py-8 md:px-8">
      <div className="max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Cuidado</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Acompanhamentos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            O acompanhamento passa a ser a entidade central do MVP. Esta página já representa a timeline que vamos
            plugar ao banco.
          </p>
        </div>

        <div className="space-y-4">
          {followups.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">{item.member ?? "Sem membro"}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.notes}</p>
                </div>
                <div className="text-sm text-slate-500">
                  <p>{item.occurredAt}</p>
                  <p className="mt-1 font-semibold text-primary">{item.nextActionAt ?? "Sem proxima acao"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <FollowupManager followups={followups} tenants={tenants} members={members} caregivers={caregivers} />
      </div>
    </div>
  );
}
