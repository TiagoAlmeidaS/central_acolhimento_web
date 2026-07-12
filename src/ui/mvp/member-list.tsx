"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Member, Tenant } from "@/server/domain/mvp";
import { mapMemberStatusToVisualStatus } from "@/ui/mvp/dashboard-status-utils";
import { Avatar, Button, Card, SectionTitle, StatusPill } from "@/ui/v2-components/ui";

const statusLabels: Record<Member["status"], string> = {
  new: "Novo",
  in_progress: "Em acompanhamento",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

export function MemberList({
  members,
  tenants,
  caregivers,
}: Readonly<{
  members: Member[];
  tenants: Tenant[];
  caregivers: Caregiver[];
}>) {
  const router = useRouter();
  const [savingAssignId, setSavingAssignId] = useState<string | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function assignCaregiver(memberId: string, caregiverId: string) {
    setSavingAssignId(memberId);
    setError(null);

    const response = await fetch(`/api/members/${memberId}/assign-caregiver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caregiverId: caregiverId || null }),
    });

    setSavingAssignId(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel atribuir o cuidador.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function updateMemberStatus(memberId: string, status: Member["status"]) {
    setSavingStatusId(memberId);
    setError(null);

    const response = await fetch(`/api/members/${memberId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setSavingStatusId(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel atualizar o status.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function removeMember(member: Member) {
    const confirmed = window.confirm(`Excluir o membro "${member.name}"? Os acompanhamentos vinculados tambem serao removidos.`);
    if (!confirmed) {
      return;
    }

    setDeletingMemberId(member.id);
    setError(null);
    const response = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    setDeletingMemberId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel excluir o membro.");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <Card padding={20}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <SectionTitle>Todos os membros</SectionTitle>
        <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500 }}>
          {members.length} {members.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {error ? (
        <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#FFF1F2", border: "1px solid #FECDD3", color: "#E11D48", fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {members.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "20px 0", margin: 0 }}>
            Nenhum membro encontrado para os filtros aplicados.
          </p>
        ) : null}

        {members.map((member) => {
          const tenant = tenants.find((item) => item.id === member.tenantId);
          return (
            <div
              key={member.id}
              style={{
                padding: "16px",
                borderRadius: 16,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Avatar name={member.name} size={42} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{member.name}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                        {member.city || "Sem cidade"} · {tenant?.name ?? "Sem localidade"}
                      </div>
                    </div>
                    <StatusPill status={mapMemberStatusToVisualStatus(member.status)} size="sm" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12.5, color: "var(--text-3)" }}>
                      {member.phone ? <span>{member.phone}</span> : null}
                      {member.lastContact ? <span>Ultimo contato: {member.lastContact}</span> : null}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <select
                        value={member.status}
                        onChange={(event) => updateMemberStatus(member.id, event.target.value as Member["status"])}
                        disabled={savingStatusId === member.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1.5px solid var(--border)",
                          background: "var(--surface)",
                          color: "var(--text)",
                          fontFamily: "inherit",
                          fontSize: 13,
                        }}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={member.caregiverId ?? ""}
                        onChange={(event) => assignCaregiver(member.id, event.target.value)}
                        disabled={savingAssignId === member.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1.5px solid var(--border)",
                          background: "var(--surface)",
                          color: "var(--text)",
                          fontFamily: "inherit",
                          fontSize: 13,
                        }}
                      >
                        <option value="">Sem atribuicao</option>
                        {caregivers
                          .filter((caregiver) => caregiver.tenantId === member.tenantId)
                          .map((caregiver) => (
                            <option key={caregiver.id} value={caregiver.id}>
                              {caregiver.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Link
                      href={`/coord/membros/${member.id}/editar`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 36,
                        padding: "0 14px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--text)",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Editar
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => removeMember(member)}
                      disabled={deletingMemberId === member.id}
                    >
                      {deletingMemberId === member.id ? "Excluindo..." : "Excluir"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
