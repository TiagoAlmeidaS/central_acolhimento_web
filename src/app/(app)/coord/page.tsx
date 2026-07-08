export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { requireServerAuthSession } from "@/server/auth/session";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import {
  listCaregivers,
  listFollowups,
  listMembers,
  listSeeds,
} from "@/server/repositories/mvp-repository";
import { Avatar, Card, StatusDot, Button } from "@/ui/v2-components/ui";
import { DashboardMap } from "@/ui/mvp/dashboard-map";
import {
  IconUsers,
  IconHeart,
  IconHourglass,
  IconCheck,
  IconBell,
  IconClock,
  IconCalendar,
  IconDoc,
} from "@/ui/v2-components/icons";

// ─── KpiCard Component ─────────────────────────────────────────
interface KpiCardProps {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  accent: string;
  bg: string;
}

function KpiCard({ icon, label, value, sub, trend, accent, bg }: KpiCardProps) {
  return (
    <Card padding={16} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", letterSpacing: "-0.01em" }}>
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: bg,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.025em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>
            +{trend}%
          </span>
        )}
      </div>
      {sub && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{sub}</span>}
    </Card>
  );
}

// ─── VisitChart Component ──────────────────────────────────────
function VisitChart({ data }: { data: Array<{ dia: string; n: number }> }) {
  const max = Math.max(...data.map((d) => d.n)) || 1;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "8px 0 0" }}>
      {data.map((d, i) => {
        const h = (d.n / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={d.dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, width: "100%", position: "relative", display: "flex", alignItems: "flex-end" }}>
              <div
                style={{
                  width: "100%",
                  height: `${h}%`,
                  borderRadius: 6,
                  background: isLast
                    ? "linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%)"
                    : "linear-gradient(180deg, #BFDBFE 0%, #93C5FD 100%)",
                  position: "relative",
                  minHeight: h > 0 ? 8 : 2,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -22,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {d.n}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isLast ? "var(--accent)" : "var(--text-3)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {d.dia}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── StatusDonut Component ─────────────────────────────────────
function StatusDonut({ data, size = 140 }: { data: Array<{ key: string; label: string; count: number }>; size?: number }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const STATUS_COLORS: Record<string, string> = {
    urgente: "#E11D48",
    aguardando: "#EA580C",
    acompanhamento: "#2563EB",
    concluido: "#16A34A",
  };

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        {data.map((d) => {
          const len = (d.count / total) * c;
          const seg = (
            <circle
              key={d.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={STATUS_COLORS[d.key] || "#94A3B8"}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {total}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-3)",
            marginTop: 4,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          pessoas
        </div>
      </div>
    </div>
  );
}

// ─── CapacityRow Component ─────────────────────────────────────
interface CaregiverPerformance {
  id: string;
  name: string;
  casos: number;
  capacidade: "alta" | "normal" | "baixa";
}

function CapacityRow({ c }: { c: CaregiverPerformance }) {
  const totalCap = 5;
  const filled = Math.min(c.casos, totalCap);
  const colorByCap = {
    alta: "#E11D48",
    normal: "#2563EB",
    baixa: "#16A34A",
  }[c.capacidade];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Avatar name={c.name} size={36} ring />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {c.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          {Array.from({ length: totalCap }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 6,
                borderRadius: 2,
                background: i < filled ? colorByCap : "var(--border)",
              }}
            />
          ))}
          <span style={{ fontSize: 11.5, color: "var(--text-3)", marginLeft: 6 }}>
            {c.casos} / {totalCap} casos
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Coordinator Dashboard ────────────────────────────────
export default async function CoordDashboardPage() {
  const session = await requireServerAuthSession("coordinator");
  const scope = getDataScopeFromSession(session);

  const [members, caregivers, followups, seeds] = await Promise.all([
    listMembers(scope),
    listCaregivers(scope),
    listFollowups(scope),
    listSeeds(scope),
  ]);

  // Derived Metrics
  const total = members.length + seeds.filter(s => s.status === "new" || s.status === "contacted").length;
  const ativos = members.filter((m) => m.status === "in_progress").length;
  const semCuidador = members.filter((m) => !m.caregiverId).length + seeds.filter((s) => !s.caregiverId).length;
  const concluidos = members.filter((m) => m.status === "consolidated" || m.status === "inactive").length;

  const novosNaSemana = seeds.filter((s) => {
    if (!s.createdAt) return false;
    const date = new Date(s.createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return date >= oneWeekAgo;
  }).length;

  const urgentes = members.filter((m) => m.notes?.toLowerCase().includes("urgente")).length;

  // Visit chart: last 7 days grouping
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const visitasData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const label = diasSemana[d.getDay()];
    // count followups on this date
    const count = followups.filter((f) => {
      const fDate = new Date(f.occurredAt);
      return fDate.toDateString() === d.toDateString();
    }).length;
    return { dia: label, n: count };
  });

  // Status donut data mapping
  const byStatus = [
    { key: "urgente", label: "Casos Urgentes", count: urgentes },
    { key: "aguardando", label: "Aguardando Vinculação", count: semCuidador },
    { key: "acompanhamento", label: "Em Acompanhamento", count: ativos },
    { key: "concluido", label: "Concluídos/Consolidados", count: concluidos },
  ];

  // Team performance caregivers list
  const cuidadoresTotal = caregivers.length;
  const cuidadoresAtivos = caregivers.filter((c) => c.active).length;
  const equipePerformance: CaregiverPerformance[] = caregivers.slice(0, 4).map((c) => {
    const casosCount = members.filter((m) => m.caregiverId === c.id).length;
    const cap = casosCount >= 4 ? "alta" : casosCount >= 2 ? "normal" : ("baixa" as const);
    return {
      id: c.id,
      name: c.name,
      casos: casosCount,
      capacidade: cap,
    };
  });

  const mapItems = [
    ...members.map((m) => {
      const caregiver = m.caregiverId ? caregivers.find((c) => c.id === m.caregiverId)?.name ?? null : null;
      return {
        id: m.id,
        name: m.name,
        city: m.city || "",
        address: m.address || "",
        status: m.status === "new" ? "urgente" : m.status === "in_progress" ? "acompanhamento" : m.status === "consolidated" ? "concluido" : "concluido",
        caregiver,
        lastContact: m.lastContact ?? null,
        latitude: m.latitude,
        longitude: m.longitude,
      };
    }),
    ...seeds.map((s) => {
      const caregiver = s.caregiverId ? caregivers.find((c) => c.id === s.caregiverId)?.name ?? null : null;
      return {
        id: s.id,
        name: s.referenceName,
        city: s.city || "",
        address: s.address || "",
        status: "aguardando",
        caregiver,
        lastContact: "Novo contato",
        latitude: s.latitude,
        longitude: s.longitude,
      };
    }),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header
        style={{
          padding: "24px 32px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--accent)",
            }}
          >
            Liderança
          </p>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "var(--text)",
            }}
          >
            Painel da Coordenação
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-3)" }}>
            Localidade: {session.membership.tenantName} ({session.membership.tenantCity} - {session.membership.tenantState})
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={`${session.user.firstName} ${session.user.lastName}`} size={46} ring />
        </div>
      </header>

      {/* Main Grid View */}
      <main
        style={{
          flex: 1,
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Urgent alert banner */}
        {urgentes > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderRadius: 16,
              background: "var(--status-urgente-bg)",
              border: "1px solid #FECACA",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#FEE2E2",
                  color: "#E11D48",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconBell size={18} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#991B1B" }}>
                  {urgentes} caso{urgentes > 1 ? "s" : ""} urgente{urgentes > 1 ? "s" : ""} pendente{urgentes > 1 ? "s" : ""} de resolução
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#7F1D1D" }}>
                  Verifique a timeline de acompanhamentos para delegar a um cuidador de plantão.
                </p>
              </div>
            </div>
            <Link
              href="/coord/acompanhamentos"
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: "#E11D48",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Verificar
            </Link>
          </div>
        )}

        {/* KPIs grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <KpiCard
            icon={<IconUsers />}
            label="Total Acolhidos"
            value={total}
            sub={`+${novosNaSemana} esta semana`}
            trend={14}
            accent="#2D7FF9"
            bg="#E8F1FE"
          />
          <KpiCard
            icon={<IconHeart />}
            label="Sendo Cuidados"
            value={ativos}
            sub={`${total > 0 ? Math.round((ativos / total) * 100) : 0}% da base`}
            accent="#16A34A"
            bg="#DCFCE7"
          />
          <KpiCard
            icon={<IconHourglass />}
            label="Sem Cuidador"
            value={semCuidador}
            sub="Aguardando vinculação"
            accent="#EA580C"
            bg="#FFEDD5"
          />
          <KpiCard
            icon={<IconCheck />}
            label="Concluídos"
            value={concluidos}
            sub="Ciclos consolidados"
            accent="#7C3AED"
            bg="rgba(124,58,237,0.12)"
          />
        </section>

        {/* Map View */}
        <DashboardMap items={mapItems} />

        {/* Charts Section */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
          }}
        >
          {/* Visit Chart */}
          <Card padding={20}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                  Ações nos últimos 7 dias
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-3)" }}>
                  Total de {followups.length} acompanhamentos no período
                </p>
              </div>
            </div>
            <VisitChart data={visitasData} />
          </Card>

          {/* Status Donut Distribution */}
          <Card padding={20}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              Distribuição por status
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center" }}>
              <StatusDonut data={byStatus} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {byStatus.map((d) => {
                  const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                  return (
                    <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <StatusDot status={d.key} size={8} />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 12.5,
                          color: "var(--text)",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{d.count}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", minWidth: 32, textAlign: "right" }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>

        {/* Lower Grid: Team capacity & latest actions */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
          }}
        >
          {/* Caregivers List */}
          <Card padding={0}>
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                  Equipe em ação
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-3)" }}>
                  {cuidadoresAtivos} cuidadores ativos de {cuidadoresTotal}
                </p>
              </div>
              <Link
                href="/coord/cuidadores"
                style={{
                  color: "var(--accent)",
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Ver todos
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {equipePerformance.length > 0 ? (
                equipePerformance.map((c) => <CapacityRow key={c.id} c={c} />)
              ) : (
                <p style={{ padding: 18, fontSize: 13, color: "var(--text-3)", margin: 0 }}>
                  Nenhum cuidador cadastrado neste tenant.
                </p>
              )}
            </div>
          </Card>

          {/* Quick Actions / Journey List */}
          <Card padding={20}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              Últimas interações pastorais
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {followups.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>
                      {item.member ?? "Sem membro"}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "var(--accent)",
                      }}
                    >
                      {item.type === "visit"
                        ? "Visita"
                        : item.type === "call"
                        ? "Ligação"
                        : item.type === "message"
                        ? "Mensagem"
                        : item.type === "prayer"
                        ? "Oração"
                        : "Outro"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.4 }}>
                    {item.notes}
                  </p>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)" }}>
                    <span>Registrado em: {new Date(item.occurredAt).toLocaleDateString("pt-BR")}</span>
                    {item.nextActionAt && (
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                        Próx: {new Date(item.nextActionAt).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <Link href="/coord/acompanhamentos" style={{ flex: 1 }}>
                  <Button variant="secondary" size="md" full>
                    Novo Acompanhamento
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
