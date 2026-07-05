export const dynamic = "force-dynamic";

import { listCaregivers, listTenants } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { CaregiverManager } from "@/ui/mvp/caregiver-manager";

export default async function CaregiversPage() {
  const session = await requireServerAuthSession("coordinator");
  const scope = getDataScopeFromSession(session);
  const [caregivers, tenants] = await Promise.all([listCaregivers(scope), listTenants(scope)]);

  const activeCount = caregivers.filter((c) => c.active).length;
  const totalMembers = caregivers.reduce((sum, c) => sum + (c.activeMembers ?? 0), 0);

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
          Coordenação · Equipe
        </p>
        <h1 style={{
          margin: 0,
          fontSize: 28, fontWeight: 800,
          letterSpacing: "-0.03em", color: "var(--text)",
          lineHeight: 1.1,
        }}>
          Cuidadores
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-2)", maxWidth: 520 }}>
          Gerencie a equipe de cuidadores e suas localidades. Cada cuidador acompanha ativamente as pessoas em seu território.
        </p>
      </div>

      <div style={{ padding: "0 40px", display: "flex", flexDirection: "column", gap: 40 }}>
        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {[
            { label: "Total de cuidadores", value: caregivers.length, color: "var(--accent)" },
            { label: "Cuidadores ativos", value: activeCount, color: "#16A34A" },
            { label: "Pessoas assistidas", value: totalMembers, color: "#C2410C" },
            { label: "Localidades", value: tenants.length, color: "#7C3AED" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                padding: "20px 22px", borderRadius: 16,
                background: "var(--surface)", border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, marginBottom: 8 }}>
                {kpi.label}
              </div>
              <div style={{
                fontSize: 32, fontWeight: 800,
                color: kpi.color, letterSpacing: "-0.04em",
                fontVariantNumeric: "tabular-nums", lineHeight: 1,
              }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Overview cards */}
        {caregivers.length > 0 && (
          <section>
            <h2 style={{
              margin: "0 0 16px", fontSize: 14, fontWeight: 700,
              color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              Visão geral da equipe
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}>
              {caregivers.map((caregiver) => {
                const tenant = tenants.find((t) => t.id === caregiver.tenantId);
                return (
                  <div
                    key={caregiver.id}
                    style={{
                      padding: "20px 22px", borderRadius: 16,
                      background: "var(--surface)", border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.015em" }}>
                          {caregiver.name}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 3 }}>
                          {caregiver.email ?? caregiver.phone}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                        background: caregiver.active ? "#DCFCE7" : "#F4F4F5",
                        color: caregiver.active ? "#15803D" : "#71717A",
                        whiteSpace: "nowrap", marginTop: 2,
                      }}>
                        {caregiver.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div style={{
                      marginTop: 16, display: "flex", gap: 20,
                      fontSize: 12.5, color: "var(--text-3)",
                    }}>
                      <span>
                        <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 18 }}>
                          {caregiver.activeMembers ?? 0}
                        </span>{" "}
                        pessoas
                      </span>
                      <span style={{ color: "var(--accent)" }}>
                        {tenant?.city ?? "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Manager form */}
        <section>
          <h2 style={{
            margin: "0 0 16px", fontSize: 14, fontWeight: 700,
            color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            Gerenciar cuidadores
          </h2>
          <CaregiverManager caregivers={caregivers} tenants={tenants} />
        </section>
      </div>
    </div>
  );
}
