"use client";

import { startTransition, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Member, OutingDetail, OutingEvent, OutingType, Tenant } from "@/server/domain/mvp";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Drawer,
  EmptyState,
  Icon,
  IconButton,
  Input,
  PageHeader,
  Pill,
  Select,
  Textarea,
  cx,
  useToast,
} from "@/ui/atalaia";
import {
  CheckRow,
  FormError,
  FormGrid,
  Notice,
  SectionLabel,
  fmtDate,
  fmtDateTime,
  readApiError,
  shortName,
} from "@/ui/gestao";
import { formatParticipantAvailabilityMessage } from "@/ui/mvp/outing-manager-utils";

type OutingSummary = OutingEvent;

type ManagerProps = {
  outings: OutingSummary[];
  tenants: Tenant[];
  caregivers: Caregiver[];
  members: Member[];
  outingTypes: OutingType[];
};

type DetailResponse = OutingDetail;
type ParticipantKind = "member" | "caregiver" | "guest";

const statusLabels: Record<OutingEvent["status"], string> = {
  draft: "Rascunho",
  generated: "Gerada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const statusTones: Record<OutingEvent["status"], "neutral" | "primary" | "success" | "muted"> = {
  draft: "neutral",
  generated: "primary",
  confirmed: "success",
  cancelled: "muted",
};

const kindLabels: Record<ParticipantKind, string> = {
  member: "Assistido",
  caregiver: "Cuidador",
  guest: "Avulso",
};

const emptyOutingForm = {
  tenantId: "",
  name: "",
  description: "",
  scheduledFor: "",
  targetGroupSize: "4",
  allowGroupsWithoutCar: false,
  outingTypeId: "",
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

function StatusBadge({ outing }: { outing: Pick<OutingEvent, "status" | "completedAt"> }) {
  if (outing.status === "confirmed" && outing.completedAt) return <Pill tone="success">Realizada</Pill>;
  return <Pill tone={statusTones[outing.status]}>{statusLabels[outing.status]}</Pill>;
}

export function OutingManager({ outings, outingTypes, tenants, caregivers, members }: Readonly<ManagerProps>) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(outings);
  const [selectedOutingId, setSelectedOutingId] = useState(outings[0]?.id ?? "");
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"outing" | "participant" | null>(null);
  const [outingForm, setOutingForm] = useState(() => ({
    ...emptyOutingForm,
    tenantId: tenants[0]?.id ?? "",
  }));
  const [selectedType, setSelectedType] = useState<ParticipantKind>("member");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [guestForm, setGuestForm] = useState(emptyGuestForm);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [constraintLabel, setConstraintLabel] = useState("");
  const [typeItems, setTypeItems] = useState(outingTypes);
  const [newTypeName, setNewTypeName] = useState("");

  async function loadOutingDetail(outingId: string) {
    await Promise.resolve();
    setLoadingDetail(true);

    try {
      const response = await fetch(`/api/outings/${outingId}`);
      if (!response.ok) {
        throw new Error(await readApiError(response, "Não foi possível carregar a saída."));
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
      return;
    }

    let cancelled = false;
    fetch(`/api/outings/${selectedOutingId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response, "Não foi possível carregar a saída."));
        }
        return response.json() as Promise<DetailResponse>;
      })
      .then((payload) => {
        if (!cancelled) {
          setDetail(payload);
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Não foi possível carregar a saída.");
          setDetail(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedOutingId]);

  const activeTenantId = detail?.outing.tenantId ?? outingForm.tenantId;
  const availableMembers = useMemo(
    () => members.filter((member) => member.tenantId === activeTenantId),
    [members, activeTenantId],
  );
  const availableCaregivers = useMemo(
    () => caregivers.filter((caregiver) => caregiver.tenantId === activeTenantId),
    [caregivers, activeTenantId],
  );
  const currentTenant = tenants.find((tenant) => tenant.id === activeTenantId) ?? null;
  const availableOutingTypes = typeItems.filter((item) => item.tenantId === outingForm.tenantId && item.active);
  const availabilityMessage = formatParticipantAvailabilityMessage({
    tenant: currentTenant,
    selectedType,
    members: availableMembers,
    caregivers: availableCaregivers,
  });
  const hasRegisteredOptions =
    selectedType === "guest" || (selectedType === "member" ? availableMembers.length > 0 : availableCaregivers.length > 0);

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

  function openNewOuting() {
    setOutingForm({ ...emptyOutingForm, tenantId: outingForm.tenantId || tenants[0]?.id || "" });
    setNewTypeName("");
    setError(null);
    setDrawer("outing");
  }

  function openAddParticipant() {
    setSelectedType("member");
    setSelectedSourceId("");
    setGuestForm(emptyGuestForm);
    setError(null);
    setDrawer("participant");
  }

  function closeDrawer() {
    setDrawer(null);
    setError(null);
  }

  async function handleCreateOuting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

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
        outingTypeId: outingForm.outingTypeId,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(await readApiError(response, "Não foi possível criar a saída."));
      return;
    }

    const created = (await response.json()) as OutingSummary;
    setOutingForm({ ...emptyOutingForm, tenantId: outingForm.tenantId });
    toast("Saída criada. Adicione quem vai.");
    closeDrawer();
    await refreshOutings(created.id);
    startTransition(() => router.refresh());
  }

  async function handleCreateOutingType() {
    if (!newTypeName.trim() || !outingForm.tenantId) return;
    setSubmitting(true);
    setError(null);
    const response = await fetch("/api/outings/types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: outingForm.tenantId, name: newTypeName.trim() }),
    });
    const payload = (await response.json().catch(() => ({}))) as OutingType & { error?: string };
    setSubmitting(false);
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível criar o tipo de saída.");
      return;
    }
    setTypeItems((current) => [...current, payload].sort((a, b) => a.name.localeCompare(b.name)));
    setOutingForm((current) => ({ ...current, outingTypeId: payload.id }));
    setNewTypeName("");
    toast("Tipo de saída criado.");
  }

  async function handleAddParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setSubmitting(true);
    setError(null);

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
      setError(await readApiError(response, "Não foi possível adicionar o participante."));
      return;
    }

    setSelectedSourceId("");
    setGuestForm(emptyGuestForm);
    toast("Participante adicionado.");
    closeDrawer();
    await refreshOutings(detail.outing.id);
  }

  /** Executa uma chamada da operação da saída; em erro mostra a mensagem, em sucesso avisa e recarrega. */
  async function runAction(
    request: () => Promise<Response>,
    options: { failure: string; success?: string; after?: () => void },
  ) {
    if (!detail) return;
    setSubmitting(true);
    setError(null);
    const response = await request();
    setSubmitting(false);

    if (!response.ok) {
      setError(await readApiError(response, options.failure));
      return;
    }

    options.after?.();
    if (options.success) toast(options.success);
    await refreshOutings(detail.outing.id);
  }

  async function handleCreateConstraint() {
    if (!detail) return;
    await runAction(
      () =>
        fetch(`/api/outings/${detail.outing.id}/constraints`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: constraintLabel || `Vínculo ${selectedParticipantIds.length} pessoas`,
            participantIds: selectedParticipantIds,
          }),
        }),
      {
        failure: "Não foi possível criar o vínculo.",
        success: "Vínculo criado.",
        after: () => {
          setConstraintLabel("");
          setSelectedParticipantIds([]);
        },
      },
    );
  }

  async function handleDeleteParticipant(participantId: string) {
    if (!detail) return;
    await runAction(() => fetch(`/api/outings/${detail.outing.id}/participants/${participantId}`, { method: "DELETE" }), {
      failure: "Não foi possível remover o participante.",
      after: () => setSelectedParticipantIds((current) => current.filter((item) => item !== participantId)),
    });
  }

  async function handleDeleteConstraint(constraintId: string) {
    if (!detail) return;
    await runAction(() => fetch(`/api/outings/${detail.outing.id}/constraints/${constraintId}`, { method: "DELETE" }), {
      failure: "Não foi possível remover o vínculo.",
    });
  }

  async function handleGenerate() {
    if (!detail) return;
    await runAction(() => fetch(`/api/outings/${detail.outing.id}/generate`, { method: "POST" }), {
      failure: "Não foi possível gerar os grupos.",
      success: "Grupos gerados. Ajuste à mão se precisar e confirme.",
    });
  }

  async function saveManualGroups(
    groups: Array<{ name: string; driverParticipantId: string | null; participantIds: string[] }>,
    message: string,
  ) {
    if (!detail) return;
    await runAction(
      () =>
        fetch(`/api/outings/${detail.outing.id}/groups`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groups }),
        }),
      { failure: "Não foi possível salvar os grupos.", success: message },
    );
  }

  function currentManualGroups() {
    return (detail?.groups ?? []).map((group) => ({
      name: group.name,
      driverParticipantId: group.driverParticipantId,
      participantIds: group.participants.map((participant) => participant.id),
    }));
  }

  async function handleAddManualGroup() {
    const groups = currentManualGroups();
    await saveManualGroups(
      [...groups, { name: `Grupo ${groups.length + 1}`, driverParticipantId: null, participantIds: [] }],
      "Grupo adicionado.",
    );
  }

  async function handleDeleteGroup(groupIndex: number) {
    await saveManualGroups(
      currentManualGroups().filter((_, index) => index !== groupIndex),
      "Grupo removido; os participantes ficaram sem lugar.",
    );
  }

  async function handleMoveParticipant(participantId: string, targetGroupIndex: number | null) {
    const groups = currentManualGroups().map((group) => ({
      ...group,
      participantIds: group.participantIds.filter((id) => id !== participantId),
      driverParticipantId: group.driverParticipantId === participantId ? null : group.driverParticipantId,
    }));
    if (targetGroupIndex !== null) groups[targetGroupIndex]?.participantIds.push(participantId);
    await saveManualGroups(groups, targetGroupIndex === null ? "Participante movido para sem lugar." : "Participante movido.");
  }

  async function handleChangeDriver(groupIndex: number, driverParticipantId: string) {
    const groups = currentManualGroups();
    if (groups[groupIndex]) groups[groupIndex].driverParticipantId = driverParticipantId || null;
    await saveManualGroups(groups, "Motorista atualizado.");
  }

  async function handleConfirm() {
    if (!detail) return;
    await runAction(() => fetch(`/api/outings/${detail.outing.id}/confirm`, { method: "POST" }), {
      failure: "Não foi possível confirmar a saída.",
      success: "Saída confirmada.",
    });
  }

  async function handleExecutionToggle() {
    if (!detail) return;
    const action = detail.outing.completedAt ? "reopen" : "complete";
    await runAction(() => fetch(`/api/outings/${detail.outing.id}/${action}`, { method: "POST" }), {
      failure: "Não foi possível atualizar a execução da saída.",
      success: action === "complete" ? "Saída concluída e pronta para o relatório diário." : "Execução da saída reaberta.",
    });
  }

  function toggleParticipantSelection(participantId: string) {
    setSelectedParticipantIds((current) =>
      current.includes(participantId) ? current.filter((item) => item !== participantId) : [...current, participantId],
    );
  }

  const newOutingButton = (
    <Button variant="primary" icon="plus" onClick={openNewOuting} disabled={tenants.length === 0}>
      Nova saída
    </Button>
  );

  const locked = submitting || detail?.outing.status === "confirmed";
  const unplaced = detail
    ? detail.participants.filter((participant) => !detail.groups.some((group) => group.participants.some((item) => item.id === participant.id)))
    : [];
  const drivers = detail ? detail.participants.filter((participant) => participant.hasCar && participant.carSeats > 0) : [];
  const seats = drivers.reduce((total, participant) => total + participant.carSeats + 1, 0);

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Saídas"
        subtitle="Visitas em grupo: quem vai, em qual carro e para onde."
        action={newOutingButton}
      />

      {!drawer ? <FormError>{error}</FormError> : null}

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma saída planejada."
          reason="Monte uma saída de sábado: escolha a data e quem vai. O Atalaia distribui as pessoas pelos carros."
          hint={<>Use &quot;Nova saída&quot; para planejar a primeira.</>}
          action={newOutingButton}
        />
      ) : (
        <div className="grid items-start gap-4 min-[900px]:grid-cols-[300px_minmax(0,1fr)]">
          <div className="grid gap-2" role="list" aria-label="Saídas">
            {items.map((outing) => {
              const current = outing.id === selectedOutingId;
              return (
                <button
                  key={outing.id}
                  type="button"
                  role="listitem"
                  aria-current={current}
                  onClick={() => setSelectedOutingId(outing.id)}
                  className={cx(
                    "grid w-full cursor-pointer gap-1.5 rounded-card border bg-surface px-3.5 py-3 text-left text-fg",
                    current ? "border-primary shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border hover:bg-sunken",
                  )}
                >
                  <b className="font-semibold">{outing.name}</b>
                  <span className="flex justify-between gap-2 text-xs text-muted">
                    <span className="font-mono">{outing.scheduledFor ? fmtDate(outing.scheduledFor) : "Sem data"}</span>
                    <span>{outing.outingTypeName ?? "Sem tipo"}</span>
                  </span>
                  <span>
                    <StatusBadge outing={outing} />
                  </span>
                </button>
              );
            })}
          </div>

          <Card className="min-w-0">
            {!selectedOutingId ? (
              <CardBody>
                <p className="text-muted">Crie ou selecione uma saída para continuar.</p>
              </CardBody>
            ) : loadingDetail && !detail ? (
              <CardBody>
                <p className="text-muted" role="status">
                  Carregando detalhes da saída…
                </p>
              </CardBody>
            ) : detail ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-medium tracking-[-0.02em]">{detail.outing.name}</h2>
                    <p className="mt-1 text-muted">
                      {detail.outing.scheduledFor ? fmtDate(detail.outing.scheduledFor) : "Sem data"} ·{" "}
                      {tenants.find((tenant) => tenant.id === detail.outing.tenantId)?.name ?? "Localidade"} ·{" "}
                      {detail.outing.outingTypeName ?? "Sem tipo"}
                    </p>
                    {detail.outing.completedAt ? (
                      <p className="mt-0.5 text-xs text-muted">Realizada em {fmtDateTime(detail.outing.completedAt)}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge outing={detail.outing} />
                    {detail.outing.status !== "confirmed" ? (
                      <Button
                        variant={detail.groups.length === 0 ? "primary" : "neutral"}
                        icon="refresh"
                        onClick={handleGenerate}
                        disabled={submitting || detail.participants.length === 0}
                      >
                        {detail.groups.length === 0 ? "Montar grupos" : "Remontar"}
                      </Button>
                    ) : null}
                    {detail.outing.status !== "confirmed" && detail.groups.length > 0 ? (
                      <Button variant="primary" icon="check" onClick={handleConfirm} disabled={submitting}>
                        Confirmar saída
                      </Button>
                    ) : null}
                    {detail.outing.status === "confirmed" ? (
                      <Button
                        variant={detail.outing.completedAt ? "neutral" : "primary"}
                        icon={detail.outing.completedAt ? "refresh" : "check"}
                        onClick={handleExecutionToggle}
                        disabled={submitting}
                      >
                        {detail.outing.completedAt ? "Reabrir execução" : "Concluir execução"}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <CardBody className="grid gap-5">
                  <p className="flex flex-wrap items-center gap-x-2 text-muted">
                    <span>
                      <b className="font-mono text-fg">{detail.participants.length}</b> participantes
                    </span>
                    ·
                    <span>
                      <b className="font-mono text-fg">{drivers.length}</b> carros
                    </span>
                    ·
                    <span>
                      <b className="font-mono text-fg">{seats}</b> lugares
                    </span>
                    ·
                    <span>
                      grupos de até <b className="font-mono text-fg">{detail.outing.targetGroupSize}</b>
                    </span>
                    {detail.outing.allowGroupsWithoutCar ? <span>· aceita grupo sem carro</span> : null}
                  </p>

                  {detail.groups.length === 0 && seats < detail.participants.length && !detail.outing.allowGroupsWithoutCar ? (
                    <Notice tone="warning">
                      Faltam {detail.participants.length - seats} lugares nos carros. Quem não couber fica sem lugar até alguém
                      oferecer carro.
                    </Notice>
                  ) : null}

                  <section className="grid gap-2.5" aria-labelledby="participants-title">
                    <div className="flex items-center justify-between gap-3">
                      <SectionLabel id="participants-title">Quem vai · {detail.participants.length}</SectionLabel>
                      <Button size="sm" icon="plus" onClick={openAddParticipant}>
                        Adicionar participante
                      </Button>
                    </div>
                    {detail.participants.length === 0 ? (
                      <EmptyState
                        title="Ninguém na saída ainda."
                        reason="Adicione cuidadores, assistidos ou pessoas avulsas para o Atalaia distribuir pelos carros."
                        hint={<>Use &quot;Adicionar participante&quot; para começar.</>}
                      />
                    ) : (
                      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                        {detail.participants.map((participant) => {
                          const selected = selectedParticipantIds.includes(participant.id);
                          return (
                            <li
                              key={participant.id}
                              className={cx(
                                "inline-flex items-center gap-1.5 rounded-[14px] border py-[3px] pl-2 pr-1 text-xs",
                                selected ? "border-primary bg-primary-soft" : "border-border bg-surface",
                              )}
                            >
                              <input
                                type="checkbox"
                                aria-label={`Selecionar ${participant.displayName} para vínculo`}
                                checked={selected}
                                onChange={() => toggleParticipantSelection(participant.id)}
                                className="size-3.5 accent-[var(--primary)]"
                              />
                              <Avatar name={participant.displayName} size="sm" />
                              <span>
                                {shortName(participant.displayName)}
                                <span className="text-muted"> · {kindLabels[participant.participantType]}</span>
                              </span>
                              {participant.hasCar ? (
                                <span className="inline-flex items-center gap-1 text-muted">
                                  <Icon name="car" size={14} />
                                  <span className="font-mono">{participant.carSeats}</span>
                                </span>
                              ) : null}
                              {participant.isDriver ? <Pill tone="lume">Motorista</Pill> : null}
                              <IconButton
                                label={`Remover ${participant.displayName}`}
                                icon="x"
                                size="sm"
                                disabled={submitting}
                                onClick={() => handleDeleteParticipant(participant.id)}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>

                  {detail.participants.length >= 2 || detail.constraints.length > 0 ? (
                    <section className="grid gap-2.5" aria-labelledby="constraints-title">
                      <SectionLabel id="constraints-title">Vínculos inseparáveis</SectionLabel>
                      <p className="text-xs text-muted">
                        Marque duas ou mais pessoas na lista acima para que fiquem sempre no mesmo carro.
                      </p>
                      <div className="flex flex-wrap items-end gap-2">
                        <Input
                          label="Rótulo do vínculo"
                          wrapperClassName="min-w-[200px] flex-1"
                          value={constraintLabel}
                          onChange={(event) => setConstraintLabel(event.target.value)}
                          placeholder="Ex.: Casal João e Maria"
                        />
                        <Button disabled={selectedParticipantIds.length < 2 || submitting} onClick={handleCreateConstraint}>
                          Criar vínculo com {selectedParticipantIds.length} {selectedParticipantIds.length === 1 ? "pessoa" : "pessoas"}
                        </Button>
                      </div>
                      {detail.constraints.length > 0 ? (
                        <ul className="m-0 grid list-none gap-1.5 p-0">
                          {detail.constraints.map((constraint) => (
                            <li
                              key={constraint.id}
                              className="flex items-center justify-between gap-3 rounded-control border border-border px-3 py-2"
                            >
                              <span className="min-w-0">
                                <b className="font-semibold">{constraint.label}</b>
                                <span className="block text-xs text-muted">
                                  {constraint.participantIds
                                    .map(
                                      (participantId) =>
                                        detail.participants.find((participant) => participant.id === participantId)?.displayName ?? "Pessoa",
                                    )
                                    .join(", ")}
                                </span>
                              </span>
                              <Button size="sm" variant="danger" disabled={submitting} onClick={() => handleDeleteConstraint(constraint.id)}>
                                Remover
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ) : null}

                  <section className="grid gap-2.5" aria-labelledby="groups-title">
                    <div className="flex items-center justify-between gap-3">
                      <SectionLabel id="groups-title">Carros e grupos · {detail.groups.length}</SectionLabel>
                      <Button size="sm" icon="plus" onClick={handleAddManualGroup} disabled={locked}>
                        Adicionar grupo
                      </Button>
                    </div>

                    {detail.groups.length === 0 ? (
                      <p className="text-muted">
                        {detail.participants.length === 0
                          ? "Adicione participantes e depois use Montar grupos."
                          : "Ainda não há grupos. Use Montar grupos para distribuir pelos carros, ou Adicionar grupo para montar à mão."}
                      </p>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                        {detail.groups.map((group, groupIndex) => (
                          <div key={group.id} className="rounded-card border border-border bg-raised">
                            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 font-semibold">
                              <Icon name="car" size={18} className="text-muted" />
                              {group.name}
                              <span className="ml-auto font-mono text-xs font-medium text-muted">
                                {group.participants.length}/{group.carCapacityTotal ?? detail.outing.targetGroupSize}
                              </span>
                            </div>
                            <div className="grid gap-2 px-3 pb-3 pt-2">
                              <Select
                                label="Motorista"
                                value={group.driverParticipantId ?? ""}
                                onChange={(event) => handleChangeDriver(groupIndex, event.target.value)}
                                options={[
                                  { value: "", label: "Sem motorista" },
                                  ...group.participants
                                    .filter((participant) => participant.hasCar && participant.isDriver)
                                    .map((participant) => ({ value: participant.id, label: participant.displayName })),
                                ]}
                                disabled={locked}
                              />
                              <ul className="m-0 grid list-none gap-1.5 p-0">
                                {group.participants.map((participant) => (
                                  <li key={participant.id} className="flex items-center gap-2 text-[13px]">
                                    <Avatar name={participant.displayName} size="sm" />
                                    <span className="min-w-0 flex-1 truncate">
                                      {shortName(participant.displayName)}
                                    </span>
                                    {participant.id === group.driverParticipantId ? (
                                      <Pill tone="lume">Motorista</Pill>
                                    ) : participant.participantType === "caregiver" ? (
                                      <Pill tone="primary">Cuidador</Pill>
                                    ) : null}
                                    <Select
                                      aria-label={`Mover ${participant.displayName}`}
                                      wrapperClassName="w-[110px]"
                                      value={String(groupIndex)}
                                      onChange={(event) =>
                                        handleMoveParticipant(
                                          participant.id,
                                          event.target.value === "unassigned" ? null : Number(event.target.value),
                                        )
                                      }
                                      options={[
                                        { value: "unassigned", label: "Sem lugar" },
                                        ...detail.groups.map((target, index) => ({ value: String(index), label: target.name })),
                                      ]}
                                      disabled={locked}
                                    />
                                  </li>
                                ))}
                              </ul>
                              <Button size="sm" variant="danger" icon="x" onClick={() => handleDeleteGroup(groupIndex)} disabled={locked}>
                                Remover grupo
                              </Button>
                            </div>
                          </div>
                        ))}

                        {unplaced.length > 0 ? (
                          <div className="rounded-card border border-dashed border-border-strong">
                            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 font-semibold">
                              Sem lugar
                              <span className="ml-auto font-mono text-xs font-medium text-muted">{unplaced.length}</span>
                            </div>
                            <ul className="m-0 grid list-none gap-1.5 px-3 pb-3 pt-2">
                              {unplaced.map((participant) => (
                                <li key={participant.id} className="flex items-center gap-2 text-[13px]">
                                  <Avatar name={participant.displayName} size="sm" />
                                  <span className="min-w-0 flex-1 truncate">{shortName(participant.displayName)}</span>
                                  <Select
                                    aria-label={`Colocar ${participant.displayName} em um grupo`}
                                    wrapperClassName="w-[130px]"
                                    value=""
                                    onChange={(event) => handleMoveParticipant(participant.id, Number(event.target.value))}
                                    options={detail.groups.map((group, index) => ({ value: String(index), label: group.name }))}
                                    placeholder="Escolher grupo"
                                    disabled={locked}
                                  />
                                </li>
                              ))}
                            </ul>
                            <p className="px-3 pb-3 text-xs text-muted">
                              Peça mais um motorista, aumente o tamanho do grupo ou escolha um grupo à mão.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </section>
                </CardBody>
              </>
            ) : (
              <>
                <CardHeader title="Saída" />
                <CardBody>
                  <FormError>{error}</FormError>
                </CardBody>
              </>
            )}
          </Card>
        </div>
      )}

      <Drawer
        open={drawer === "outing"}
        onClose={closeDrawer}
        title="Nova saída"
        subtitle="Escolha a data e o tipo. Os participantes entram depois."
        footer={
          <>
            <Button variant="ghost" onClick={closeDrawer}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="outing-form" loading={submitting}>
              Criar saída
            </Button>
          </>
        }
      >
        <form id="outing-form" onSubmit={handleCreateOuting} className="grid gap-4">
          <Input
            label="Nome da saída"
            value={outingForm.name}
            onChange={(event) => setOutingForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ex.: Saída de sábado em Mangabeira"
            required
            data-autofocus
          />
          {tenants.length > 1 ? (
            <Select
              label="Localidade"
              value={outingForm.tenantId}
              onChange={(event) => setOutingForm((current) => ({ ...current, tenantId: event.target.value, outingTypeId: "" }))}
              options={tenants.map((tenant) => ({ value: tenant.id, label: `${tenant.name} - ${tenant.city}/${tenant.state}` }))}
              placeholder="Selecione a localidade"
              required
            />
          ) : null}
          <Select
            label="Tipo de saída"
            value={outingForm.outingTypeId}
            onChange={(event) => setOutingForm((current) => ({ ...current, outingTypeId: event.target.value }))}
            options={availableOutingTypes.map((item) => ({ value: item.id, label: item.name }))}
            placeholder="Selecione o tipo"
            required
          />
          {outingForm.tenantId && availableOutingTypes.length === 0 ? (
            <Notice tone="warning">Nenhum tipo ativo nesta localidade. Crie o primeiro tipo abaixo para liberar a saída.</Notice>
          ) : null}
          <div className="flex items-end gap-2">
            <Input
              label="Criar novo tipo"
              wrapperClassName="flex-1"
              value={newTypeName}
              onChange={(event) => setNewTypeName(event.target.value)}
              placeholder="Adolescentes, TCI, Casas abertas…"
            />
            <Button disabled={submitting || !newTypeName.trim()} onClick={handleCreateOutingType} icon="plus">
              Adicionar
            </Button>
          </div>
          <FormGrid>
            <Input
              label="Data"
              type="date"
              value={outingForm.scheduledFor}
              onChange={(event) => setOutingForm((current) => ({ ...current, scheduledFor: event.target.value }))}
            />
            <Input
              label="Pessoas por grupo"
              value={outingForm.targetGroupSize}
              onChange={(event) =>
                setOutingForm((current) => ({
                  ...current,
                  targetGroupSize: event.target.value.replace(/\D/g, "").slice(0, 2) || "4",
                }))
              }
              inputMode="numeric"
            />
          </FormGrid>
          <Textarea
            label="Descrição"
            value={outingForm.description}
            onChange={(event) => setOutingForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Contexto da saída, público, observações…"
            rows={3}
          />
          <CheckRow
            checked={outingForm.allowGroupsWithoutCar}
            onChange={(event) => setOutingForm((current) => ({ ...current, allowGroupsWithoutCar: event.target.checked }))}
            label="Permitir grupo sem carro"
            description="Desmarcado, toda montagem exige um motorista por grupo."
          />
          <FormError>{error}</FormError>
        </form>
      </Drawer>

      <Drawer
        open={drawer === "participant"}
        onClose={closeDrawer}
        title="Adicionar participante"
        subtitle={detail?.outing.name}
        footer={
          <>
            <Button variant="ghost" onClick={closeDrawer}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="participant-form" loading={submitting}>
              Adicionar
            </Button>
          </>
        }
      >
        <form id="participant-form" onSubmit={handleAddParticipant} className="grid gap-4">
          <Select
            label="Origem"
            value={selectedType}
            onChange={(event) => {
              setSelectedType(event.target.value as ParticipantKind);
              setSelectedSourceId("");
            }}
            options={[
              { value: "member", label: "Assistido cadastrado" },
              { value: "caregiver", label: "Cuidador cadastrado" },
              { value: "guest", label: "Participante avulso" },
            ]}
            data-autofocus
          />

          <Notice tone={hasRegisteredOptions ? "info" : "warning"}>{availabilityMessage}</Notice>

          {selectedType === "member" ? (
            <Select
              label="Assistido"
              value={selectedSourceId}
              onChange={(event) => setSelectedSourceId(event.target.value)}
              options={availableMembers.map((member) => ({ value: member.id, label: member.name }))}
              placeholder="Selecione o assistido"
              required
            />
          ) : null}

          {selectedType === "caregiver" ? (
            <Select
              label="Cuidador"
              value={selectedSourceId}
              onChange={(event) => setSelectedSourceId(event.target.value)}
              options={availableCaregivers.map((caregiver) => ({ value: caregiver.id, label: caregiver.name }))}
              placeholder="Selecione o cuidador"
              required
            />
          ) : null}

          {selectedType === "guest" ? (
            <FormGrid>
              <Input
                label="Nome"
                value={guestForm.firstName}
                onChange={(event) => setGuestForm((current) => ({ ...current, firstName: event.target.value }))}
                placeholder="Ex.: João"
                required
              />
              <Input
                label="Sobrenome"
                value={guestForm.lastName}
                onChange={(event) => setGuestForm((current) => ({ ...current, lastName: event.target.value }))}
                placeholder="Ex.: Silva"
              />
              <Input
                label="Telefone"
                value={guestForm.phone}
                onChange={(event) => setGuestForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="(00) 90000-0000"
                inputMode="tel"
              />
              <Input
                label="E-mail"
                type="email"
                value={guestForm.email}
                onChange={(event) => setGuestForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="email@exemplo.com"
              />
            </FormGrid>
          ) : null}

          <div className="grid gap-1">
            <CheckRow
              checked={guestForm.hasCar}
              onChange={(event) =>
                setGuestForm((current) => ({
                  ...current,
                  hasCar: event.target.checked,
                  isDriver: event.target.checked ? current.isDriver : false,
                  carSeats: event.target.checked ? current.carSeats : "0",
                }))
              }
              label="Tem carro"
              description="Usado para distribuir os grupos com a logística real."
            />
            {guestForm.hasCar ? (
              <div className="grid gap-2 pl-6">
                <Input
                  label="Vagas no carro"
                  value={guestForm.carSeats}
                  onChange={(event) =>
                    setGuestForm((current) => ({ ...current, carSeats: event.target.value.replace(/\D/g, "").slice(0, 2) || "0" }))
                  }
                  inputMode="numeric"
                />
                <CheckRow
                  checked={guestForm.isDriver}
                  onChange={(event) => setGuestForm((current) => ({ ...current, isDriver: event.target.checked }))}
                  label="Vai dirigindo"
                  description="Abre um grupo base para esse motorista."
                />
              </div>
            ) : null}
          </div>

          <Textarea
            label="Observações"
            value={guestForm.notes}
            rows={3}
            onChange={(event) => setGuestForm((current) => ({ ...current, notes: event.target.value }))}
          />
          <FormError>{error}</FormError>
        </form>
      </Drawer>

    </div>
  );
}
