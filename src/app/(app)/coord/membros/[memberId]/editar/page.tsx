export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { listCaregivers, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { MemberManager } from "@/ui/mvp/member-manager";

type PageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function EditMemberPage({ params }: PageProps) {
  const { memberId } = await params;
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const [allTenants, allCaregivers, membersByTenant] = await Promise.all([
    listTenants(),
    listCaregivers(),
    Promise.all(accessibleTenantIds.map((tenantId) => listMembers({ tenantId }))),
  ]);

  const tenants = allTenants.filter((tenant) => accessibleTenantIds.includes(tenant.id));
  const caregivers = allCaregivers.filter((caregiver) => accessibleTenantIds.includes(caregiver.tenantId));
  const member = membersByTenant.flat().find((item) => item.id === memberId) ?? null;

  if (!member) {
    notFound();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "24px 16px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
          Coordenacao · Membros
        </p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
          Editar membro
        </h1>
      </div>
      <MemberManager members={[]} tenants={tenants} caregivers={caregivers} hideList initialEditing={member} />
    </div>
  );
}
