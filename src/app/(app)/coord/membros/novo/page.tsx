export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { listCaregivers, listTenants } from "@/server/repositories/mvp-repository";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { MemberManager } from "@/ui/mvp/member-manager";

export default async function NewMemberPage() {
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const [allTenants, allCaregivers] = await Promise.all([listTenants(), listCaregivers()]);
  const tenants = allTenants.filter((tenant) => accessibleTenantIds.includes(tenant.id));
  const caregivers = allCaregivers.filter((caregiver) => accessibleTenantIds.includes(caregiver.tenantId));

  if (tenants.length === 0) {
    notFound();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "24px 16px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
          Coordenacao · Membros
        </p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
          Novo membro
        </h1>
      </div>
      <MemberManager members={[]} tenants={tenants} caregivers={caregivers} hideList />
    </div>
  );
}
