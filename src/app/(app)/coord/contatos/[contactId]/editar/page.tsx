export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { listSeeds, listTenants } from "@/server/repositories/mvp-repository";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { ContactManager } from "@/ui/mvp/contact-manager";

type PageProps = {
  params: Promise<{ contactId: string }>;
};

export default async function EditContactPage({ params }: PageProps) {
  const { contactId } = await params;
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const [allTenants, contactsByTenant] = await Promise.all([
    listTenants(),
    Promise.all(accessibleTenantIds.map((tenantId) => listSeeds({ tenantId }))),
  ]);

  const tenants = allTenants.filter((tenant) => accessibleTenantIds.includes(tenant.id));
  const contact = contactsByTenant.flat().find((item) => item.id === contactId) ?? null;

  if (!contact) {
    notFound();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "24px 16px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
          Coordenacao · Contatos
        </p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
          Editar contato
        </h1>
      </div>
      <ContactManager contacts={[]} tenants={tenants} hideList initialEditing={contact} />
    </div>
  );
}
