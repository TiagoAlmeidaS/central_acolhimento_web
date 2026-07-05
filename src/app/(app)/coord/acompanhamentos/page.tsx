export const dynamic = "force-dynamic";

import { listCaregivers, listFollowups, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { FollowupManager } from "@/ui/mvp/followup-manager";
import type { Followup } from "@/server/domain/mvp";

const TYPE_LABELS: Record<Followup["type"], string> = {
  visit: "Visitas",
  call: "Ligações",
  message: "Mensagens",
  prayer: "Orações",
  other: "Outros",
};

const TYPE_COLORS: Record<Followup["type"], string> = {
  visit: "#15803D",
  call: "#1D4ED8",
  message: "#7C3AED",
  prayer: "#E11D48",
  other: "#71717A",
};

export default async function FollowupsPage() {
  const session = await requireServerAuthSession("coordinator");
  const scope = getDataScopeFromSession(session);
  const [followups, tenants, members, caregivers] = await Promise.all([
    listFollowups(scope),
    listTenants(scope),
    listMembers(scope),
    listCaregivers(scope),
  ]);

  // Upcoming actions (nextActionAt in future)
  const now = new Date();
  const upcoming = followups.filter(
    (f) => f.nextActionAt && new Date(f.nextActionAt) > now
  ).length;

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
          Cuidado · Timeline
        </p>
        <h1 style={{
          margin: 0,
          fontSize: 28, fontWeight: 800,
          letterSpacing: "-0.03em", color: "var(--text)",
          lineHeight: 1.1,
        }}>
          Acompanhamentos
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-2)", maxWidth: 560 }}>
          O acompanhamento é a entidade central do MVP — a timeline pastoral em tempo real de cada pessoa.
        </p>
      </div>

      <div style={{ padding: "0 40px", display: "flex", flexDirection: "column", gap: 40 }}>
        {/* KPIs */}
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
              Total registrado
            </div>
            <div style={{
              fontSize: 36, fontWeight: 800, lineHeight: 1,
              color: "var(--accent)", letterSpacing: "-0.05em",
              fontVariantNumeric: "tabular-nums",
            }}>
              {followups.length}
            </div>
            {upcoming > 0 && (
              <div style={{ fontSize: 12, color: "#1D4ED8", marginTop: 6, fontWeight: 600 }}>
                {upcoming} com próxima ação agendada
              </div>
            )}
          </div>

          {(Object.keys(TYPE_LABELS) as Followup["type"][]).map((key) => {
            const count = followups.filter((f) => f.type === key).length;
            return (
              <div key={key} style={{
                padding: "16px 18px", borderRadius: 14,
                background: "var(--surface)", border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 600, marginBottom: 6 }}>
                  {TYPE_LABELS[key]}
                </div>
                <div style={{
                  fontSize: 26, fontWeight: 800, lineHeight: 1,
                  color: TYPE_COLORS[key], letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>

        {/* Manager (form + timeline) */}
        <section>
          <h2 style={{
            margin: "0 0 16px", fontSize: 14, fontWeight: 700,
            color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            Registrar e editar
          </h2>
          <FollowupManager
            followups={followups}
            tenants={tenants}
            members={members}
            caregivers={caregivers}
          />
        </section>
      </div>
    </div>
  );
}
