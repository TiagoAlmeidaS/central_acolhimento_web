export const dynamic = "force-dynamic";

import { listSeeds, listTenants } from "@/server/repositories/mvp-repository";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { ContactManager } from "@/ui/mvp/contact-manager";
import type { Seed } from "@/server/domain/mvp";

const STATUS_LABELS: Record<Seed["status"], string> = {
  new: "Novos",
  contacted: "Contatados",
  in_progress: "Virou membro",
  consolidated: "Consolidados",
  inactive: "Inativos",
};

const STATUS_COLORS: Record<Seed["status"], string> = {
  new: "#C2410C",
  contacted: "#1D4ED8",
  in_progress: "#7C3AED",
  consolidated: "#15803D",
  inactive: "#71717A",
};

export default async function ContactsPage() {
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const [allTenants, contactsByTenant] = await Promise.all([
    listTenants(),
    Promise.all(accessibleTenantIds.map((tenantId) => listSeeds({ tenantId }))),
  ]);
  const tenants = allTenants.filter((tenant) => accessibleTenantIds.includes(tenant.id));
  const contacts = contactsByTenant
    .flat()
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const pending = contacts.filter((contact) => contact.status === "new" || contact.status === "contacted").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 0 32px" }}>
      <div
        style={{
          padding: "24px 16px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          marginBottom: 24,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 6,
          }}
        >
          Coordenacao · Funil
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--text)",
            lineHeight: 1.1,
          }}
        >
          Novos contatos
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-2)", maxWidth: 560, lineHeight: 1.5 }}>
          Entrada principal do acolhimento. Capture o primeiro contato no mobile e distribua depois para a equipe.
        </p>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: "18px 18px",
              borderRadius: 16,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-card)",
              gridColumn: "span 2",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, marginBottom: 8 }}>
              Total no funil
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                lineHeight: 1,
                color: "var(--accent)",
                letterSpacing: "-0.05em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {contacts.length}
            </div>
            {pending > 0 ? (
              <div style={{ fontSize: 12, color: "#C2410C", marginTop: 6, fontWeight: 600 }}>
                {pending} aguardando acao
              </div>
            ) : null}
          </div>

          {(Object.keys(STATUS_LABELS) as Seed["status"][]).map((key) => {
            const count = contacts.filter((contact) => contact.status === key).length;
            return (
              <div
                key={key}
                style={{
                  padding: "16px 16px",
                  borderRadius: 14,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 600, marginBottom: 6 }}>
                  {STATUS_LABELS[key]}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: STATUS_COLORS[key],
                    letterSpacing: "-0.04em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {count}
                </div>
              </div>
            );
          })}
        </div>

        <section>
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-2)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Captura e triagem
          </h2>
          <ContactManager contacts={contacts} tenants={tenants} />
        </section>
      </div>
    </div>
  );
}
