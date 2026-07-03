import { listCaregivers, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { MemberManager } from "@/ui/mvp/member-manager";

export default async function MembersPage() {
  const [members, tenants, caregivers] = await Promise.all([listMembers(), listTenants(), listCaregivers()]);

  return (
    <div className="min-h-screen bg-background-light px-6 py-8 md:px-8">
      <div className="max-w-7xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Coordenação</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Membros em acolhimento</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            O cadastro agora já nasce com linguagem de negócio alinhada ao MVP, substituindo a ideia antiga de
            convidados/TCI.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Cuidador</th>
                <th className="px-6 py-4">Cidade</th>
                <th className="px-6 py-4">Último contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{member.caregiver ?? "Nao atribuido"}</td>
                  <td className="px-6 py-4 text-slate-600">{member.city}</td>
                  <td className="px-6 py-4 text-slate-600">{member.lastContact ?? "Sem contato"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <MemberManager members={members} tenants={tenants} caregivers={caregivers} />
      </div>
    </div>
  );
}
