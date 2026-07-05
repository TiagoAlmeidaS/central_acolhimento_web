export const dynamic = "force-dynamic";

import { listCaregivers, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { MemberManager } from "@/ui/mvp/member-manager";
import type { Member } from "@/server/domain/mvp";

const STATUS_LABELS: Record<Member["status"], string> = {
  new: "Novo",
  in_progress: "Em acompanhamento",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

const STATUS_COLORS: Record<Member["status"], { bg: string; fg: string }> = {
  new: { bg: "#FFEDD5", fg: "#C2410C" },
  in_progress: { bg: "#DBEAFE", fg: "#1D4ED8" },
  consolidated: { bg: "#DCFCE7", fg: "#15803D" },
  inactive: { bg: "#F4F4F5", fg: "#71717A" },
};

export default async function MembersPage() {
  const session = await requireServerAuthSession("coordinator");
  const scope = getDataScopeFromSession(session);
  const [members, tenants, caregivers] = await Promise.all([
    listMembers(scope),
    listTenants(scope),
    listCaregivers(scope),
  ]);

  // Aggregate by status
  const statusCounts = Object.keys(STATUS_LABELS).reduce(
    (acc, key) => {
      acc[key as Member["status"]] = members.filter((m) => m.status === key).length;
      return acc;
    },
    {} as Record<Member["status"], number>
  );

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
          Coordenação · Acolhimento
        </p>
        <h1 style={{
          margin: 0,
          fontSize: 28, fontWeight: 800,
          letterSpacing: "-0.03em", color: "var(--text)",
          lineHeight: 1.1,
        }}>
          Membros em acolhimento
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-2)", maxWidth: 560 }}>
          Cadastre e gerencie todas as pessoas acompanhadas pela Central. O fluxo pastoral concentrado num único lugar.
        </p>
      </div>

      <div style={{ padding: "0 40px", display: "flex", flexDirection: "column", gap: 40 }}>
        {/* Status breakdown */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}>
          {(Object.keys(STATUS_LABELS) as Member["status"][]).map((key) => {
            const col = STATUS_COLORS[key];
            return (
              <div
                key={key}
                style={{
                  padding: "20px 22px", borderRadius: 16,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, marginBottom: 8 }}>
                  {STATUS_LABELS[key]}
                </div>
                <div style={{
                  fontSize: 32, fontWeight: 800, lineHeight: 1,
                  color: col.fg, letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {statusCounts[key]}
                </div>
                <div style={{
                  marginTop: 8, height: 4, borderRadius: 2,
                  background: col.bg,
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    background: col.fg,
                    width: members.length > 0
                      ? `${(statusCounts[key] / members.length) * 100}%`
                      : "0%",
                    transition: "width .4s",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Manager (form + table) */}
        <section>
          <h2 style={{
            margin: "0 0 16px", fontSize: 14, fontWeight: 700,
            color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            Gerenciar membros
          </h2>
          <MemberManager members={members} tenants={tenants} caregivers={caregivers} />
        </section>
      </div>
    </div>
  );
}
