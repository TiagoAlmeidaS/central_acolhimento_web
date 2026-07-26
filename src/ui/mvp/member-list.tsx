"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Member, SpiritualTemperature, Tenant } from "@/server/domain/mvp";
import { mapMemberStatusToVisualStatus, mapSpiritualTemperatureToVisualStatus, TEMPERATURE_LABELS } from "@/ui/mvp/dashboard-status-utils";
import { groupSelectedMembersByCaregiver } from "@/ui/mvp/member-communication-utils";
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
  const [savingTemperatureId, setSavingTemperatureId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [showCommunicationPreview, setShowCommunicationPreview] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const visibleSelectedMemberIds = useMemo(() => {
    const visibleMemberIds = new Set(members.map((member) => member.id));
    return selectedMemberIds.filter((memberId) => visibleMemberIds.has(memberId));
  }, [members, selectedMemberIds]);
  const selectedCommunication = useMemo(
    () => groupSelectedMembersByCaregiver(members, caregivers, visibleSelectedMemberIds),
    [members, caregivers, visibleSelectedMemberIds],
  );
  const allCurrentPageSelected = members.length > 0 && visibleSelectedMemberIds.length === members.length;
  const hasPartialSelection = visibleSelectedMemberIds.length > 0 && !allCurrentPageSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = hasPartialSelection;
    }
  }, [hasPartialSelection]);

  function toggleMemberSelection(memberId: string) {
    setSelectedMemberIds((currentIds) =>
      currentIds.includes(memberId)
        ? currentIds.filter((selectedId) => selectedId !== memberId)
        : [...currentIds, memberId],
    );
    setCopyFeedback(null);
  }

  function toggleCurrentPageSelection() {
    setSelectedMemberIds(allCurrentPageSelected ? [] : members.map((member) => member.id));
    setCopyFeedback(null);
  }

  function clearSelection() {
    setSelectedMemberIds([]);
    setShowCommunicationPreview(false);
    setCopyFeedback(null);
  }

  async function copyText(text: string, feedback: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(feedback);
    } catch {
      setError("Nao foi possivel copiar automaticamente. Selecione o texto e copie manualmente.");
    }
  }

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

  async function updateMemberTemperature(memberId: string, spiritualTemperature: SpiritualTemperature | null) {
    setSavingTemperatureId(memberId);
    setError(null);

    const response = await fetch(`/api/members/${memberId}/spiritual-temperature`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spiritualTemperature }),
    });

    setSavingTemperatureId(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel atualizar a temperatura.");
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

      {members.length > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allCurrentPageSelected}
              onChange={toggleCurrentPageSelection}
              style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
            />
            Selecionar pagina atual
          </label>

          {visibleSelectedMemberIds.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 600 }}>
                {visibleSelectedMemberIds.length} {visibleSelectedMemberIds.length === 1 ? "membro selecionado" : "membros selecionados"}
              </span>
              <Button type="button" size="sm" onClick={() => setShowCommunicationPreview(true)}>
                Gerar comunicado
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={clearSelection}>
                Limpar selecao
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {showCommunicationPreview && visibleSelectedMemberIds.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 16,
            padding: 14,
            borderRadius: 14,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Comunicados para cuidadores</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
                Uma mensagem pronta para copiar por cuidador.
              </div>
            </div>
            {selectedCommunication.groups.length > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  copyText(
                    selectedCommunication.groups.map((group) => group.message).join("\n\n---\n\n"),
                    "Todas as mensagens copiadas.",
                  )
                }
              >
                Copiar todos
              </Button>
            ) : null}
          </div>

          {selectedCommunication.membersWithoutCaregiver.length > 0 ? (
            <div style={warningStyle}>
              {selectedCommunication.membersWithoutCaregiver.length} membro(s) selecionado(s) sem cuidador nao entraram no comunicado.
            </div>
          ) : null}

          {selectedCommunication.groups.length === 0 ? (
            <div style={warningStyle}>Nenhum comunicado gerado. Selecione membros com cuidador atribuido.</div>
          ) : null}

          {selectedCommunication.groups.map((group) => (
            <div
              key={group.caregiver.id}
              style={{
                padding: 12,
                borderRadius: 12,
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{group.caregiver.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
                    {group.caregiver.phone || "Cuidador sem telefone"} - {group.members.length} membro(s)
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => copyText(group.message, `Mensagem de ${group.caregiver.name} copiada.`)}>
                  Copiar mensagem
                </Button>
              </div>

              {group.warnings.length > 0 ? (
                <div style={{ ...warningStyle, marginTop: 10 }}>
                  {group.warnings.join(" ")}
                </div>
              ) : null}

              <textarea
                readOnly
                value={group.message}
                rows={Math.min(10, group.members.length + 6)}
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  lineHeight: 1.5,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}

          {copyFeedback ? (
            <div style={{ fontSize: 12.5, color: "#15803D", fontWeight: 600 }}>{copyFeedback}</div>
          ) : null}
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
          const isSelected = visibleSelectedMemberIds.includes(member.id);
          return (
            <div
              key={member.id}
              style={{
                padding: "16px",
                borderRadius: 16,
                background: isSelected ? "var(--accent-bg)" : "var(--surface-2)",
                border: `1px solid ${isSelected ? "rgba(45,127,249,0.35)" : "var(--border)"}`,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleMemberSelection(member.id)}
                  aria-label={`Selecionar ${member.name}`}
                  style={{ width: 17, height: 17, marginTop: 12, accentColor: "var(--accent)", flexShrink: 0 }}
                />
                <Avatar name={member.name} size={42} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{member.name}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                        {member.city || "Sem cidade"} · {tenant?.name ?? "Sem localidade"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <StatusPill status={mapMemberStatusToVisualStatus(member.status)} size="sm" />
                      {mapSpiritualTemperatureToVisualStatus(member.spiritualTemperature) ? (
                        <StatusPill status={mapSpiritualTemperatureToVisualStatus(member.spiritualTemperature)!} size="xs" />
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12.5, color: "var(--text-3)" }}>
                      {member.phone ? <span>{member.phone}</span> : null}
                      {member.lastContact ? <span>Ultimo contato: {member.lastContact}</span> : null}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
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
                        value={member.spiritualTemperature ?? ""}
                        onChange={(event) => updateMemberTemperature(member.id, (event.target.value || null) as SpiritualTemperature | null)}
                        disabled={savingTemperatureId === member.id}
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
                        <option value="">Temperatura</option>
                        {Object.entries(TEMPERATURE_LABELS).map(([value, label]) => (
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
                      href={`/coord/acompanhamentos?memberId=${member.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 36,
                        padding: "0 14px",
                        borderRadius: 10,
                        border: "1px solid var(--accent)",
                        background: "var(--accent-bg)",
                        color: "var(--accent)",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Ação
                    </Link>
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

const warningStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#FFF7ED",
  border: "1px solid #FED7AA",
  color: "#C2410C",
  fontSize: 12.5,
} satisfies CSSProperties;
