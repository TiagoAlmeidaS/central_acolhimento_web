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
import { Avatar, Button, Card, StatusDot } from "@/ui/v2-components/ui";
import { DashboardMap } from "@/ui/mvp/dashboard-map";
import {
  buildMemberJourneyDistribution,
  countOperationalAlerts,
  mapMemberStatusToVisualStatus,
} from "@/ui/mvp/dashboard-status-utils";
import {
  IconBell,
  IconCalendar,
  IconCheck,
  IconDoc,
  IconHeart,
  IconHourglass,
  IconUsers,
} from "@/ui/v2-components/icons";

interface KpiCardProps {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  bg: string;
}

function KpiCard({ icon, label, value, sub, accent, bg }: KpiCardProps) {
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
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "var(--text)",
          letterSpacing: "-0.025em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sub ? <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{sub}</span> : null}
    </Card>
  );
}

function VisitChart({ data }: { data: Array<{ dia: string; n: number }> }) {
  const max = Math.max(...data.map((item) => item.n), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, paddingTop: 8 }}>
      {data.map((item, index) => {
        const height = `${(item.n / max) * 100}%`;
        const isLast = index === data.length - 1;

        return (
          <div key={item.dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", position: "relative" }}>
              <div
                style={{
                  width: "100%",
                  height,
                  minHeight: item.n > 0 ? 8 : 2,
                  borderRadius: 6,
                  background: isLast
                    ? "linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%)"
                    : "linear-gradient(180deg, #BFDBFE 0%, #93C5FD 100%)",
                }}
              />
              <span
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
                {item.n}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isLast ? "var(--accent)" : "var(--text-3)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {item.dia}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatusDonut({
  data,
  total,
  size = 140,
}: {
  data: Array<{ key: string; label: string; count: number }>;
  total: number;
  size?: number;
}) {
  const stroke = 20;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const colors: Record<string, string> = {
    novo: "#EA580C",
    acompanhamento: "#2563EB",
    concluido: "#16A34A",
    inativo: "#64748B",
  };

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        {data.map((item) => {
          const segmentLength = total > 0 ? (item.count / total) * circumference : 0;
          const segment = (
            <circle
              key={item.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors[item.key] ?? "#94A3B8"}
              strokeWidth={stroke}
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += segmentLength;
          return segment;
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
          membros
        </div>
      </div>
    </div>
  );
}

interface CaregiverPerformance {
  id: string;
  name: string;
  casos: number;
  capacidade: "alta" | "normal" | "baixa";
}

function CapacityRow({ caregiver }: { caregiver: CaregiverPerformance }) {
  const totalCapacity = 5;
  const filled = Math.min(caregiver.casos, totalCapacity);
  const colorByCapacity = {
    alta: "#E11D48",
    normal: "#2563EB",
    baixa: "#16A34A",
  }[caregiver.capacidade];

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
      <Avatar name={caregiver.name} size={36} ring />
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
          {caregiver.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          {Array.from({ length: totalCapacity }).map((_, index) => (
            <div
              key={`${caregiver.id}-${index}`}
              style={{
                width: 14,
                height: 6,
                borderRadius: 2,
                background: index < filled ? colorByCapacity : "var(--border)",
              }}
            />
          ))}
          <span style={{ fontSize: 11.5, color: "var(--text-3)", marginLeft: 6 }}>
            {caregiver.casos} / {totalCapacity} casos
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function CoordDashboardPage() {
  const session = await requireServerAuthSession("coordinator");
  const scope = getDataScopeFromSession(session);

  const [members, caregivers, followups, seeds] = await Promise.all([
    listMembers(scope),
    listCaregivers(scope),
    listFollowups(scope),
    listSeeds(scope),
  ]);

  const operationalAlerts = countOperationalAlerts(members, seeds);
  const memberJourney = buildMemberJourneyDistribution(members);

  const total = members.length + operationalAlerts.totalOpenContacts;
  const activeMembers = members.filter((member) => member.status === "in_progress").length;
  const completedMembers = members.filter(
    (member) => member.status === "consolidated" || member.status === "inactive"
  ).length;

  const newContactsThisWeek = seeds.filter((seed) => {
    if (!seed.createdAt) return false;
    const createdAt = new Date(seed.createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return createdAt >= oneWeekAgo;
  }).length;

  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const visitsData = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const label = weekdayLabels[date.getDay()];
    const count = followups.filter((followup) => {
      const followupDate = new Date(followup.occurredAt);
      return followupDate.toDateString() === date.toDateString();
    }).length;
    return { dia: label, n: count };
  });

  const caregiversTotal = caregivers.length;
  const caregiversActive = caregivers.filter((caregiver) => caregiver.active).length;
  const caregiverPerformance: CaregiverPerformance[] = caregivers.slice(0, 4).map((caregiver) => {
    const casesCount = members.filter((member) => member.caregiverId === caregiver.id).length;
    const capacity = casesCount >= 4 ? "alta" : casesCount >= 2 ? "normal" : "baixa";
    return {
      id: caregiver.id,
      name: caregiver.name,
      casos: casesCount,
      capacidade: capacity,
    };
  });

  const mapItems = [
    ...members.map((member) => {
      const caregiver = member.caregiverId
        ? caregivers.find((item) => item.id === member.caregiverId)?.name ?? null
        : null;

      return {
        id: member.id,
        name: member.name,
        city: member.city || "",
        address: member.address || "",
        status: mapMemberStatusToVisualStatus(member.status),
        caregiver,
        lastContact: member.lastContact ?? null,
        latitude: member.latitude,
        longitude: member.longitude,
        age: member.age,
        birthDate: member.birthDate,
      };
    }),
    ...seeds.map((seed) => {
      const caregiver = seed.caregiverId
        ? caregivers.find((item) => item.id === seed.caregiverId)?.name ?? null
        : null;

      return {
        id: seed.id,
        name: seed.referenceName,
        city: seed.city || "",
        address: seed.address || "",
        status: "aguardando",
        caregiver,
        lastContact: "Novo contato",
        latitude: seed.latitude,
        longitude: seed.longitude,
        age: seed.age,
        birthDate: null,
      };
    }),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>
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
            Lideranca
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
            Painel da Coordenacao
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-3)" }}>
            Localidade: {session.membership.tenantName} ({session.membership.tenantCity} - {session.membership.tenantState})
          </p>
        </div>
        <Avatar name={`${session.user.firstName} ${session.user.lastName}`} size={46} ring />
      </header>

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
        {operationalAlerts.urgentMembers > 0 ? (
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
                  {operationalAlerts.urgentMembers} caso{operationalAlerts.urgentMembers > 1 ? "s" : ""} urgente{operationalAlerts.urgentMembers > 1 ? "s" : ""} pendente{operationalAlerts.urgentMembers > 1 ? "s" : ""} de resposta
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#7F1D1D" }}>
                  Verifique a timeline de acompanhamentos para delegar a um cuidador de plantao.
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
        ) : null}

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
            sub={`+${newContactsThisWeek} esta semana`}
            accent="#2D7FF9"
            bg="#E8F1FE"
          />
          <KpiCard
            icon={<IconHeart />}
            label="Sendo Cuidados"
            value={activeMembers}
            sub={`${total > 0 ? Math.round((activeMembers / total) * 100) : 0}% da base`}
            accent="#16A34A"
            bg="#DCFCE7"
          />
          <KpiCard
            icon={<IconHourglass />}
            label="Sem Cuidador"
            value={operationalAlerts.unassignedPeople}
            sub="Aguardando vinculacao"
            accent="#EA580C"
            bg="#FFEDD5"
          />
          <KpiCard
            icon={<IconCheck />}
            label="Concluidos"
            value={completedMembers}
            sub="Ciclos consolidados"
            accent="#7C3AED"
            bg="rgba(124,58,237,0.12)"
          />
        </section>

        <DashboardMap items={mapItems} />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
          }}
        >
          <Card padding={20}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                  Acoes nos ultimos 7 dias
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-3)" }}>
                  Total de {followups.length} acompanhamentos no periodo
                </p>
              </div>
            </div>
            <VisitChart data={visitsData} />
          </Card>

          <Card padding={20}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              Distribuicao por jornada do membro
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center" }}>
              <StatusDonut data={memberJourney} total={members.length} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {memberJourney.map((item) => {
                  const pct = members.length > 0 ? Math.round((item.count / members.length) * 100) : 0;
                  return (
                    <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <StatusDot status={item.key} size={8} />
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
                        {item.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{item.count}</span>
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

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <KpiCard
            icon={<IconDoc />}
            label="Contatos na Triagem"
            value={operationalAlerts.totalOpenContacts}
            sub="Seeds novos ou contatados"
            accent="#7C3AED"
            bg="rgba(124,58,237,0.12)"
          />
          <KpiCard
            icon={<IconHourglass />}
            label="Membros Sem Cuidador"
            value={operationalAlerts.membersWithoutCaregiver}
            sub="Precisam de designacao"
            accent="#EA580C"
            bg="#FFEDD5"
          />
          <KpiCard
            icon={<IconUsers />}
            label="Contatos Sem Cuidador"
            value={operationalAlerts.contactsWithoutCaregiver}
            sub="Fila operacional"
            accent="#2D7FF9"
            bg="#E8F1FE"
          />
          <KpiCard
            icon={<IconBell />}
            label="Casos Urgentes"
            value={operationalAlerts.urgentMembers}
            sub="Prioridade de resposta"
            accent="#E11D48"
            bg="#FFE4E6"
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
          }}
        >
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
                  Equipe em acao
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-3)" }}>
                  {caregiversActive} cuidadores ativos de {caregiversTotal}
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
              {caregiverPerformance.length > 0 ? (
                caregiverPerformance.map((caregiver) => (
                  <CapacityRow key={caregiver.id} caregiver={caregiver} />
                ))
              ) : (
                <p style={{ padding: 18, fontSize: 13, color: "var(--text-3)", margin: 0 }}>
                  Nenhum cuidador cadastrado neste tenant.
                </p>
              )}
            </div>
          </Card>

          <Card padding={20}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              Ultimas interacoes pastorais
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
                          ? "Ligacao"
                          : item.type === "message"
                            ? "Mensagem"
                            : item.type === "prayer"
                              ? "Oracao"
                              : "Outro"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.4 }}>
                    {item.notes}
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "var(--text-3)",
                    }}
                  >
                    <span>Registrado em: {new Date(item.occurredAt).toLocaleDateString("pt-BR")}</span>
                    {item.nextActionAt ? (
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                        Prox: {new Date(item.nextActionAt).toLocaleDateString("pt-BR")}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <Link href="/coord/acompanhamentos" style={{ flex: 1 }}>
                  <Button variant="secondary" size="md" full icon={<IconCalendar />}>
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
