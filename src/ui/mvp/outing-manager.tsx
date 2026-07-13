"use client";

import { startTransition, useEffect, useMemo, useState, type FormEvent } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Member, OutingDetail, OutingEvent, Tenant } from "@/server/domain/mvp";
import { Avatar, Button, Card, Input, SectionTitle, Select, Textarea } from "@/ui/v2-components/ui";
import { IconCalendar, IconCar, IconCheck, IconPlus, IconRefresh, IconUsers, IconX } from "@/ui/v2-components/icons";

type OutingSummary = OutingEvent;

type ManagerProps = {
  outings: OutingSummary[];
  tenants: Tenant[];
  caregivers: Caregiver[];
  members: Member[];
};

type DetailResponse = OutingDetail;

const statusLabels: Record<OutingEvent["status"], string> = {
  draft: "Rascunho",
  generated: "Gerada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const emptyOutingForm = {
  tenantId: "",
  name: "",
  description: "",
  scheduledFor: "",
  targetGroupSize: "4",
  allowGroupsWithoutCar: false,
};

const emptyGuestForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  hasCar: false,
  carSeats: "0",
  isDriver: false,
  notes: "",
};

export function OutingManager({ outings, tenants, caregivers, members }: Readonly<ManagerProps>) {
  const router = useRouter();
  const [items, setItems] = useState(outings);
  const [selectedOutingId, setSelectedOutingId] = useState(outings[0]?.id ?? "");
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [outingForm, setOutingForm] = useState(() => ({
    ...emptyOutingForm,
    tenantId: tenants[0]?.id ?? "",
  }));
  const [selectedType, setSelectedType] = useState<"member" | "caregiver" | "guest">("member");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [guestForm, setGuestForm] = useState(emptyGuestForm);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [constraintLabel, setConstraintLabel] = useState("");

  async function loadOutingDetail(outingId: string) {
    setLoadingDetail(true);

    try {
      const response = await fetch(`/api/outings/${outingId}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Nao foi possivel carregar a saida.");
      }

      const payload = (await response.json()) as DetailResponse;
      setDetail(payload);
      return payload;
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (!selectedOutingId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    loadOutingDetail(selectedOutingId)
      .then((payload) => {
        if (!cancelled) {
          setDetail(payload);
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Nao foi possivel carregar a saida.");
          setDetail(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedOutingId]);

  const activeTenantId = detail?.outing.tenantId ?? outingForm.tenantId;
  const availableMembers = useMemo(() => members.filter((member) => member.tenantId === activeTenantId), [members, activeTenantId]);
  const availableCaregivers = useMemo(() => caregivers.filter((caregiver) => caregiver.tenantId === activeTenantId), [caregivers, activeTenantId]);
  const currentTenant = tenants.find((tenant) => tenant.id === activeTenantId) ?? null;

  async function refreshOutings(nextSelectedOutingId?: string) {
    const response = await fetch("/api/outings");
    const payload = (await response.json().catch(() => [])) as OutingSummary[];
    setItems(payload);
    const resolvedOutingId = nextSelectedOutingId ?? selectedOutingId;

    if (!resolvedOutingId) {
      setSelectedOutingId(payload[0]?.id ?? "");
      return;
    }

    if (!payload.some((item) => item.id === resolvedOutingId)) {
      const fallbackId = payload[0]?.id ?? "";
      setSelectedOutingId(fallbackId);
      if (fallbackId) {
        await loadOutingDetail(fallbackId);
      } else {
        setDetail(null);
      }
      return;
    }

    if (resolvedOutingId !== selectedOutingId) {
      setSelectedOutingId(resolvedOutingId);
      return;
    }

    await loadOutingDetail(resolvedOutingId);
  }

  async function handleCreateOuting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/outings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: outingForm.tenantId,
        name: outingForm.name,
        description: outingForm.description,
        scheduledFor: outingForm.scheduledFor ? new Date(`${outingForm.scheduledFor}T09:00:00`).toISOString() : null,
        targetGroupSize: Number(outingForm.targetGroupSize || "4"),
        allowGroupsWithoutCar: outingForm.allowGroupsWithoutCar,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel criar a saida.");
      return;
    }

    const created = (await response.json()) as OutingSummary;
    setOutingForm({ ...emptyOutingForm, tenantId: outingForm.tenantId });
    setSuccess("Saida criada com sucesso.");
    await refreshOutings(created.id);
    startTransition(() => router.refresh());
  }

  async function handleAddParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload =
      selectedType === "guest"
        ? {
            participantType: "guest",
            firstName: guestForm.firstName,
            lastName: guestForm.lastName,
            phone: guestForm.phone,
            email: guestForm.email,
            hasCar: guestForm.hasCar,
            carSeats: Number(guestForm.carSeats || "0"),
            isDriver: guestForm.isDriver,
            notes: guestForm.notes,
          }
        : {
            participantType: selectedType,
            participantId: selectedSourceId,
            hasCar: guestForm.hasCar,
            carSeats: Number(guestForm.carSeats || "0"),
            isDriver: guestForm.isDriver,
            notes: guestForm.notes,
          };

    const response = await fetch(`/api/outings/${detail.outing.id}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!response.ok) {
      const responsePayload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(responsePayload.error ?? "Nao foi possivel adicionar participante.");
      return;
    }

    setSelectedSourceId("");
    setGuestForm(emptyGuestForm);
    setSuccess("Participante adicionado.");
    await refreshOutings(detail.outing.id);
  }

  async function handleCreateConstraint() {
    if (!detail) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/outings/${detail.outing.id}/constraints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: constraintLabel || `Vinculo ${selectedParticipantIds.length} pessoas`,
        participantIds: selectedParticipantIds,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel criar vinculo.");
      return;
    }

    setConstraintLabel("");
    setSelectedParticipantIds([]);
    setSuccess("Vinculo criado.");
    await refreshOutings(detail.outing.id);
  }

  async function handleDeleteParticipant(participantId: string) {
    if (!detail) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/outings/${detail.outing.id}/participants/${participantId}`, { method: "DELETE" });
    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel remover participante.");
      return;
    }

    setSelectedParticipantIds((current) => current.filter((item) => item !== participantId));
    await refreshOutings(detail.outing.id);
  }

  async function handleDeleteConstraint(constraintId: string) {
    if (!detail) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/outings/${detail.outing.id}/constraints/${constraintId}`, { method: "DELETE" });
    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel remover vinculo.");
      return;
    }

    await refreshOutings(detail.outing.id);
  }

  async function handleGenerate() {
    if (!detail) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/outings/${detail.outing.id}/generate`, { method: "POST" });
    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel gerar os grupos.");
      return;
    }

    setSuccess("Grupos gerados com sucesso.");
    await refreshOutings(detail.outing.id);
  }

  async function handleConfirm() {
    if (!detail) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/outings/${detail.outing.id}/confirm`, { method: "POST" });
    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel confirmar a saida.");
      return;
    }

    setSuccess("Saida confirmada.");
    await refreshOutings(detail.outing.id);
  }

  function toggleParticipantSelection(participantId: string) {
    setSelectedParticipantIds((current) =>
      current.includes(participantId) ? current.filter((item) => item !== participantId) : [...current, participantId],
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "24px 16px 32px", maxWidth: 1200, margin: "0 auto" }}>
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>
          Coordenacao · Saidas
        </p>
        <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
          Montagem de grupos
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
          Crie a saida, adicione pessoas cadastradas ou avulsas, defina vinculos inseparaveis e gere os grupos considerando motoristas e capacidade.
        </p>
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {success ? <Banner tone="success">{success}</Banner> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <Card padding={20}>
          <SectionTitle>Criar saida</SectionTitle>
          <form onSubmit={handleCreateOuting} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Select
              label="Localidade"
              value={outingForm.tenantId}
              onChange={(value) => setOutingForm((current) => ({ ...current, tenantId: value }))}
              options={tenants.map((tenant) => ({ value: tenant.id, label: `${tenant.name} - ${tenant.city}/${tenant.state}` }))}
              placeholder="Selecione a localidade"
              required
            />
            <Input label="Nome da saida" value={outingForm.name} onChange={(value) => setOutingForm((current) => ({ ...current, name: value }))} placeholder="Ex: Acao social da tarde" required />
            <Textarea label="Descricao" value={outingForm.description} onChange={(value) => setOutingForm((current) => ({ ...current, description: value }))} placeholder="Contexto da saida, publico, observacoes..." rows={3} />
            <Input label="Data" type="date" value={outingForm.scheduledFor} onChange={(value) => setOutingForm((current) => ({ ...current, scheduledFor: value }))} icon={<IconCalendar />} />
            <Input label="Tamanho alvo do grupo" value={outingForm.targetGroupSize} onChange={(value) => setOutingForm((current) => ({ ...current, targetGroupSize: value.replace(/\D/g, "").slice(0, 2) || "4" }))} inputMode="numeric" />
            <label style={checkboxCardStyle(outingForm.allowGroupsWithoutCar)}>
              <input
                type="checkbox"
                checked={outingForm.allowGroupsWithoutCar}
                onChange={(event) => setOutingForm((current) => ({ ...current, allowGroupsWithoutCar: event.target.checked }))}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Permitir grupo sem carro</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>Se desmarcado, toda geracao exige motorista por grupo.</div>
              </div>
            </label>
            <Button type="submit" variant="primary" size="md" disabled={submitting} icon={<IconPlus />} full>
              {submitting ? "Criando..." : "Criar saida"}
            </Button>
          </form>
        </Card>

        <Card padding={20}>
          <SectionTitle action={<span style={{ fontSize: 12, color: "var(--text-3)" }}>{items.length} saida(s)</span>}>Saidas criadas</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>Nenhuma saida criada ainda.</p>
            ) : null}

            {items.map((outing) => (
              <button
                key={outing.id}
                type="button"
                onClick={() => setSelectedOutingId(outing.id)}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: selectedOutingId === outing.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: selectedOutingId === outing.id ? "var(--accent-bg)" : "var(--surface-2)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>{outing.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 3 }}>
                      {tenants.find((tenant) => tenant.id === outing.tenantId)?.name ?? "Tenant"} · {statusLabels[outing.status]}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
                    {outing.scheduledFor ? new Date(outing.scheduledFor).toLocaleDateString("pt-BR") : "Sem data"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card padding={20}>
        <SectionTitle>Operacao da saida</SectionTitle>
        {!selectedOutingId ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>Crie ou selecione uma saida para continuar.</p>
        ) : loadingDetail ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>Carregando detalhes da saida...</p>
        ) : detail ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Saida ativa</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{detail.outing.name}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
                {currentTenant?.name} · {statusLabels[detail.outing.status]} · alvo {detail.outing.targetGroupSize} por grupo
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <Card padding={16}>
                <SectionTitle>Adicionar participante</SectionTitle>
                <form onSubmit={handleAddParticipant} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Select
                    label="Origem"
                    value={selectedType}
                    onChange={(value) => {
                      setSelectedType(value as "member" | "caregiver" | "guest");
                      setSelectedSourceId("");
                    }}
                    options={[
                      { value: "member", label: "Membro cadastrado" },
                      { value: "caregiver", label: "Cuidador cadastrado" },
                      { value: "guest", label: "Participante avulso" },
                    ]}
                  />

                  {selectedType === "member" ? (
                    <Select
                      label="Membro"
                      value={selectedSourceId}
                      onChange={setSelectedSourceId}
                      options={availableMembers.map((member) => ({ value: member.id, label: member.name }))}
                      placeholder="Selecione o membro"
                      required
                    />
                  ) : null}

                  {selectedType === "caregiver" ? (
                    <Select
                      label="Cuidador"
                      value={selectedSourceId}
                      onChange={setSelectedSourceId}
                      options={availableCaregivers.map((caregiver) => ({ value: caregiver.id, label: caregiver.name }))}
                      placeholder="Selecione o cuidador"
                      required
                    />
                  ) : null}

                  {selectedType === "guest" ? (
                    <>
                      <Input label="Nome" value={guestForm.firstName} onChange={(value) => setGuestForm((current) => ({ ...current, firstName: value }))} placeholder="Ex: Joao" required />
                      <Input label="Sobrenome" value={guestForm.lastName} onChange={(value) => setGuestForm((current) => ({ ...current, lastName: value }))} placeholder="Ex: Silva" />
                      <Input label="Telefone" value={guestForm.phone} onChange={(value) => setGuestForm((current) => ({ ...current, phone: value }))} placeholder="(00) 90000-0000" />
                      <Input label="Email" value={guestForm.email} onChange={(value) => setGuestForm((current) => ({ ...current, email: value }))} placeholder="email@exemplo.com" />
                    </>
                  ) : null}

                  <label style={checkboxCardStyle(guestForm.hasCar)}>
                    <input
                      type="checkbox"
                      checked={guestForm.hasCar}
                      onChange={(event) =>
                        setGuestForm((current) => ({
                          ...current,
                          hasCar: event.target.checked,
                          isDriver: event.target.checked ? current.isDriver : false,
                          carSeats: event.target.checked ? current.carSeats : "0",
                        }))
                      }
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Tem carro</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>Use para distribuir grupos com logistica real.</div>
                    </div>
                  </label>

                  {guestForm.hasCar ? (
                    <>
                      <Input label="Vagas no carro" value={guestForm.carSeats} onChange={(value) => setGuestForm((current) => ({ ...current, carSeats: value.replace(/\D/g, "").slice(0, 2) || "0" }))} inputMode="numeric" icon={<IconUsers />} />
                      <label style={checkboxCardStyle(guestForm.isDriver)}>
                        <input
                          type="checkbox"
                          checked={guestForm.isDriver}
                          onChange={(event) => setGuestForm((current) => ({ ...current, isDriver: event.target.checked }))}
                        />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Vai dirigindo</div>
                          <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>Se marcado, abre um grupo base para esse motorista.</div>
                        </div>
                      </label>
                    </>
                  ) : null}

                  <Textarea label="Observacoes" value={guestForm.notes} onChange={(value) => setGuestForm((current) => ({ ...current, notes: value }))} rows={3} />
                  <Button type="submit" variant="primary" size="md" disabled={submitting} icon={<IconPlus />} full>
                    Adicionar participante
                  </Button>
                </form>
              </Card>

              <Card padding={16}>
                <SectionTitle>Vinculos inseparaveis</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Input label="Rotulo do vinculo" value={constraintLabel} onChange={setConstraintLabel} placeholder="Ex: Casal Joao e Maria" />
                  <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                    Selecione pelo menos duas pessoas na lista de participantes e crie o vinculo.
                  </div>
                  <Button type="button" variant="secondary" size="md" disabled={selectedParticipantIds.length < 2 || submitting} onClick={handleCreateConstraint} full>
                    Criar vinculo com {selectedParticipantIds.length} pessoa(s)
                  </Button>

                  {detail.constraints.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>Nenhum vinculo cadastrado.</p>
                  ) : (
                    detail.constraints.map((constraint) => (
                      <div key={constraint.id} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{constraint.label}</div>
                          <button type="button" onClick={() => handleDeleteConstraint(constraint.id)} style={linkDangerStyle}>
                            Remover
                          </button>
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 6 }}>
                          {constraint.participantIds
                            .map((participantId) => detail.participants.find((participant) => participant.id === participantId)?.displayName ?? "Pessoa")
                            .join(", ")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <Card padding={16}>
              <SectionTitle action={<span style={{ fontSize: 12, color: "var(--text-3)" }}>{detail.participants.length} participante(s)</span>}>Participantes</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {detail.participants.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>Adicione participantes para montar a saida.</p>
                ) : null}

                {detail.participants.map((participant) => {
                  const selected = selectedParticipantIds.includes(participant.id);
                  return (
                    <label key={participant.id} style={{ ...participantCardStyle, background: selected ? "var(--accent-bg)" : "var(--surface-2)" }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleParticipantSelection(participant.id)} />
                      <Avatar name={participant.displayName} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{participant.displayName}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                          {participant.participantType === "guest" ? "Avulso" : participant.participantType === "caregiver" ? "Cuidador" : "Membro"}
                          {participant.phone ? ` · ${participant.phone}` : ""}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                          {participant.hasCar ? <Badge icon={<IconCar />}>{participant.carSeats} vaga(s)</Badge> : null}
                          {participant.isDriver ? <Badge>Motorista</Badge> : null}
                        </div>
                      </div>
                      <button type="button" onClick={() => handleDeleteParticipant(participant.id)} style={linkDangerStyle}>
                        Remover
                      </button>
                    </label>
                  );
                })}
              </div>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Button type="button" variant="primary" size="md" onClick={handleGenerate} disabled={submitting || detail.participants.length === 0} icon={<IconRefresh />} full>
                Gerar grupos
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={handleConfirm} disabled={submitting || detail.groups.length === 0} icon={<IconCheck />} full>
                Confirmar saida
              </Button>
            </div>

            <Card padding={16}>
              <SectionTitle action={<span style={{ fontSize: 12, color: "var(--text-3)" }}>{detail.groups.length} grupo(s)</span>}>Resultado da geracao</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {detail.groups.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>Ainda nao existem grupos gerados.</p>
                ) : null}
                {detail.groups.map((group) => (
                  <div key={group.id} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{group.name}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                          {group.driverParticipantId
                            ? `Motorista: ${detail.participants.find((participant) => participant.id === group.driverParticipantId)?.displayName ?? "Pessoa"}`
                            : "Sem motorista"}
                        </div>
                      </div>
                      <Badge icon={<IconUsers />}>
                        {group.participants.length}/{group.carCapacityTotal ?? detail.outing.targetGroupSize}
                      </Badge>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                      {group.participants.map((participant) => (
                        <div key={participant.id} style={{ fontSize: 13, color: "var(--text)" }}>
                          {participant.displayName}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function Banner({ children, tone }: Readonly<{ children: string; tone: "error" | "success" }>) {
  const style =
    tone === "error"
      ? { background: "#FFF1F2", border: "1px solid #FECDD3", color: "#E11D48" }
      : { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D" };

  return (
    <div style={{ ...style, padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
      {children}
    </div>
  );
}

function Badge({ children, icon }: Readonly<{ children: ReactNode; icon?: ReactNode }>) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>
      {icon}
      {children}
    </span>
  );
}

function checkboxCardStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: active ? "var(--accent-bg)" : "var(--surface)",
    cursor: "pointer",
  };
}

const participantCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid var(--border)",
};

const linkDangerStyle: CSSProperties = {
  border: 0,
  background: "transparent",
  color: "#DC2626",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
};
