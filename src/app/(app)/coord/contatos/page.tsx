export const dynamic = "force-dynamic";

import { listCaregivers, listSeeds, listTenants } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
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
  const scope = getDataScopeFromSession(session);
  const [contacts, tenants, caregivers] = await Promise.all([
    listSeeds(scope),
    listTenants(scope),
    listCaregivers(scope),
  ]);

  const pending = contacts.filter((c) => c.status === "new" || c.status === "contacted").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 0 48px" }}>
      {/* Page header */}
      <div style={{
        padding: "32px 40px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        marginBottom: 32,
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--accent)", marginBottom: 6,
        }}>
          Coordenação · Funil
        </p>
        <h1 style={{
          margin: 0,
          fontSize: 28, fontWeight: 800,
          letterSpacing: "-0.03em", color: "var(--text)",
          lineHeight: 1.1,
        }}>
          Novos contatos
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-2)", maxWidth: 560 }}>
          Porta de entrada do cuidado. Registre cada novo contato e acompanhe a conversão para membro.
        </p>
      </div>

      <div style={{ padding: "0 40px", display: "flex", flexDirection: "column", gap: 40 }}>
        {/* Status KPIs */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 14,
        }}>
          <div style={{
            padding: "18px 20px", borderRadius: 16,
            background: "var(--surface)", border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
            gridColumn: "span 2",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, marginBottom: 8 }}>
              Total no funil
            </div>
            <div style={{
              fontSize: 36, fontWeight: 800, lineHeight: 1,
              color: "var(--accent)", letterSpacing: "-0.05em",
              fontVariantNumeric: "tabular-nums",
            }}>
              {contacts.length}
            </div>
            {pending > 0 && (
              <div style={{ fontSize: 12, color: "#C2410C", marginTop: 6, fontWeight: 600 }}>
                {pending} aguardando ação
              </div>
            )}
          </div>
          {(Object.keys(STATUS_LABELS) as Seed["status"][]).map((key) => {
            const count = contacts.filter((c) => c.status === key).length;
            return (
              <div key={key} style={{
                padding: "16px 18px", borderRadius: 14,
                background: "var(--surface)", border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 600, marginBottom: 6 }}>
                  {STATUS_LABELS[key]}
                </div>
                <div style={{
                  fontSize: 26, fontWeight: 800, lineHeight: 1,
                  color: STATUS_COLORS[key], letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>

        {/* Manager (form + list) */}
        <section>
          <h2 style={{
            margin: "0 0 16px", fontSize: 14, fontWeight: 700,
            color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            Gerenciar contatos
          </h2>
          <ContactManager contacts={contacts} tenants={tenants} caregivers={caregivers} />
        </section>
      </div>
    </div>
  );
}
