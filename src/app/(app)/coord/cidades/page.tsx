export const dynamic = "force-dynamic";

import { listCaregiverInvitations } from "@/server/repositories/invitation-repository";
import { listTenants } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { CaregiverInvitationManager } from "@/ui/mvp/caregiver-invitation-manager";
import { TenantManager } from "@/ui/mvp/tenant-manager";

import { listUserMemberships } from "@/server/repositories/auth-repository";

export default async function CitiesPage() {
  const session = await requireServerAuthSession("coordinator");
  const [memberships, allTenants, invitations] = await Promise.all([
    listUserMemberships(session.user.id),
    listTenants(),
    listCaregiverInvitations(session.membership.tenantId),
  ]);
  const activeTenantId = session.membership.tenantId;
  const tenants = allTenants.filter(
    (t) => t.id === activeTenantId || memberships.some((m) => m.tenantId === t.id)
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
          Coordenação · Multi-Tenant
        </p>
        <h1 style={{
          margin: 0,
          fontSize: 28, fontWeight: 800,
          letterSpacing: "-0.03em", color: "var(--text)",
          lineHeight: 1.1,
        }}>
          Localidades
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-2)", maxWidth: 560 }}>
          Cada localidade é a unidade operacional central do produto — já nascendo preparada para escalar o acolhimento em múltiplas cidades.
        </p>
      </div>

      <div style={{ padding: "0 40px", display: "flex", flexDirection: "column", gap: 48 }}>
        {/* Active tenants overview */}
        {tenants.length > 0 && (
          <section>
            <h2 style={{
              margin: "0 0 16px",
              fontSize: 14, fontWeight: 700,
              color: "var(--text-2)", letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              Panorama — {tenants.length} {tenants.length === 1 ? "localidade" : "localidades"}
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
            }}>
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  style={{
                    padding: "20px 22px",
                    borderRadius: 16,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{
                        fontSize: 16, fontWeight: 700,
                        color: "var(--text)", letterSpacing: "-0.02em",
                      }}>
                        {tenant.name}
                      </div>
                      <div style={{
                        fontSize: 13, color: "var(--text-2)", marginTop: 4,
                      }}>
                        {tenant.city}, {tenant.state}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 999,
                      background: tenant.status === "active" ? "#DCFCE7" : "#F4F4F5",
                      color: tenant.status === "active" ? "#15803D" : "#71717A",
                      whiteSpace: "nowrap", marginTop: 2,
                    }}>
                      {tenant.status === "active" ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  {tenant.coordinator && (
                    <div style={{
                      marginTop: 12, fontSize: 12.5,
                      color: "var(--text-3)",
                    }}>
                      Coord. {tenant.coordinator}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tenant form + list */}
        <section>
          <h2 style={{
            margin: "0 0 16px",
            fontSize: 14, fontWeight: 700,
            color: "var(--text-2)", letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            Gerenciar localidades
          </h2>
          <TenantManager tenants={tenants} />
        </section>

        {/* Caregiver invitations */}
        <section>
          <h2 style={{
            margin: "0 0 16px",
            fontSize: 14, fontWeight: 700,
            color: "var(--text-2)", letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            Convites de cuidadores
          </h2>
          <CaregiverInvitationManager tenants={tenants} invitations={invitations} />
        </section>
      </div>
    </div>
  );
}
