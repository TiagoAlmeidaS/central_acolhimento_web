"use client";

import { startTransition, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, TciChamber, TciSession, Tenant } from "@/server/domain/mvp";
import {
  Avatar,
  Button,
  Chip,
  Drawer,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  Pill,
  Select,
  Textarea,
  cx,
  useToast,
} from "@/ui/atalaia";
import { CheckRow, FormError, FormGrid, SectionLabel, fmtLong, plural, readApiError, useResetOnOpen } from "@/ui/gestao";

type Props = {
  tenants: Tenant[];
  caregivers: Caregiver[];
  chambers: TciChamber[];
  sessions: TciSession[];
  initialWeekStart: string;
};

type SessionStatus = TciSession["status"];

const statusLabels: Record<SessionStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Realizada",
  cancelled: "Cancelada",
};

const statusTones: Record<SessionStatus, "neutral" | "primary" | "warning" | "success" | "muted"> = {
  draft: "neutral",
  scheduled: "primary",
  confirmed: "warning",
  completed: "success",
  cancelled: "muted",
};

const STATUS_ORDER: SessionStatus[] = ["scheduled", "confirmed", "completed", "cancelled", "draft"];

/** Para onde a sessão pode ir a partir do status atual (rótulo = ação). */
const TRANSITIONS: Array<{ to: SessionStatus; label: string; variant: "neutral" | "danger" }> = [
  { to: "confirmed", label: "Confirmar", variant: "neutral" },
  { to: "completed", label: "Concluir", variant: "neutral" },
  { to: "scheduled", label: "Agendar", variant: "neutral" },
  { to: "cancelled", label: "Cancelar", variant: "danger" },
];

const emptyChamberForm = {
  tenantId: "",
  name: "",
  description: "",
  capacity: "",
  active: true,
};

const emptySessionForm = {
  tenantId: "",
  title: "",
  description: "",
  scheduledDate: "",
  startsAt: "",
  endsAt: "",
  chamberId: "",
  caregiverIds: [] as string[],
  notes: "",
  status: "scheduled" as SessionStatus,
};

type Filters = { tenantId: string; chamberId: string; caregiverId: string };

function shiftWeek(weekStart: string, days: number) {
  const date = new Date(`${weekStart}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekLabel(weekStart: string) {
  const format = (value: string) =>
    new Date(`${value}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
  return `${format(weekStart)} a ${format(shiftWeek(weekStart, 6))}`;
}

function isOpenSession(session: TciSession) {
  return session.status !== "cancelled" && session.status !== "completed";
}

export function TciManager({ tenants, caregivers, chambers, sessions, initialWeekStart }: Readonly<Props>) {
  const router = useRouter();
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [items, setItems] = useState(sessions);
  const [chamberItems, setChamberItems] = useState(chambers);
  const [filters, setFilters] = useState<Filters>({ tenantId: "", chamberId: "", caregiverId: "" });
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "">("");
  const [needsOnly, setNeedsOnly] = useState(false);
  const [drawer, setDrawer] = useState<"chamber" | "session" | null>(null);
  const [chamberForm, setChamberForm] = useState({ ...emptyChamberForm, tenantId: tenants[0]?.id ?? "" });
  const [sessionForm, setSessionForm] = useState({ ...emptySessionForm, tenantId: tenants[0]?.id ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useResetOnOpen(drawer === "chamber", () => {
    setChamberForm((current) => ({ ...emptyChamberForm, tenantId: current.tenantId || tenants[0]?.id || "" }));
    setError(null);
  });
  useResetOnOpen(drawer === "session", () => {
    setSessionForm((current) => ({
      ...emptySessionForm,
      tenantId: current.tenantId || tenants[0]?.id || "",
      scheduledDate: current.scheduledDate || weekStart,
    }));
    setError(null);
  });

  const filteredCaregivers = useMemo(
    () => caregivers.filter((caregiver) => !filters.tenantId || caregiver.tenantId === filters.tenantId),
    [caregivers, filters.tenantId],
  );

  const filteredChambers = useMemo(
    () => chamberItems.filter((chamber) => !filters.tenantId || chamber.tenantId === filters.tenantId),
    [chamberItems, filters.tenantId],
  );

  const sessionTenantChambers = useMemo(
    () => chamberItems.filter((chamber) => chamber.tenantId === sessionForm.tenantId && chamber.active),
    [chamberItems, sessionForm.tenantId],
  );

  const sessionTenantCaregivers = useMemo(
    () => caregivers.filter((caregiver) => caregiver.tenantId === sessionForm.tenantId && caregiver.active),
    [caregivers, sessionForm.tenantId],
  );

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => shiftWeek(weekStart, index)), [weekStart]);
  const inWeek = useMemo(() => items.filter((session) => weekDates.includes(session.scheduledDate)), [items, weekDates]);
  const withoutCaregiver = inWeek.filter((session) => isOpenSession(session) && session.caregivers.length === 0);

  const visible = inWeek.filter(
    (session) => (!statusFilter || session.status === statusFilter) && (!needsOnly || withoutCaregiver.includes(session)),
  );
  const days = weekDates
    .map((date) => ({
      date,
      sessions: visible.filter((session) => session.scheduledDate === date).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    }))
    .filter((day) => day.sessions.length > 0);

  async function reloadData(nextWeekStart = weekStart, nextFilters = filters) {
    const params = new URLSearchParams();
    params.set("weekStart", nextWeekStart);
    if (nextFilters.tenantId) params.set("tenantId", nextFilters.tenantId);
    if (nextFilters.chamberId) params.set("chamberId", nextFilters.chamberId);
    if (nextFilters.caregiverId) params.set("caregiverId", nextFilters.caregiverId);

    const [sessionsResponse, chambersResponse] = await Promise.all([
      fetch(`/api/tci/sessions?${params.toString()}`),
      fetch(`/api/tci/chambers${nextFilters.tenantId ? `?tenantId=${nextFilters.tenantId}` : ""}`),
    ]);

    const sessionsPayload = (await sessionsResponse.json().catch(() => [])) as TciSession[];
    const chambersPayload = (await chambersResponse.json().catch(() => [])) as TciChamber[];
    setItems(sessionsPayload);
    setChamberItems(chambersPayload);
  }

  async function changeFilters(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    setError(null);
    await reloadData(weekStart, next);
  }

  async function changeWeek(next: string) {
    setWeekStart(next);
    setError(null);
    await reloadData(next, filters);
  }

  async function handleCreateChamber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/tci/chambers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: chamberForm.tenantId,
        name: chamberForm.name,
        description: chamberForm.description,
        capacity: chamberForm.capacity ? Number(chamberForm.capacity) : null,
        active: chamberForm.active,
      }),
    });

    setSubmitting(false);
    if (!response.ok) {
      setError(await readApiError(response, "Não foi possível criar a câmara."));
      return;
    }

    toast("Câmara criada.");
    setDrawer(null);
    await reloadData();
    startTransition(() => router.refresh());
  }

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/tci/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: sessionForm.tenantId,
        title: sessionForm.title,
        description: sessionForm.description,
        scheduledDate: sessionForm.scheduledDate,
        startsAt: sessionForm.startsAt,
        endsAt: sessionForm.endsAt,
        chamberId: sessionForm.chamberId,
        caregiverIds: sessionForm.caregiverIds,
        notes: sessionForm.notes,
        status: sessionForm.status,
      }),
    });

    setSubmitting(false);
    if (!response.ok) {
      setError(await readApiError(response, "Não foi possível criar a sessão."));
      return;
    }

    toast("Sessão TCI agendada.");
    setDrawer(null);
    await reloadData();
    startTransition(() => router.refresh());
  }

  async function handleStatusChange(sessionId: string, status: SessionStatus) {
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/tci/sessions/${sessionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setSubmitting(false);
    if (!response.ok) {
      setError(await readApiError(response, "Não foi possível atualizar o status."));
      return;
    }

    toast(`Sessão ${statusLabels[status].toLowerCase()}.`);
    await reloadData();
  }

  function toggleCaregiver(caregiverId: string) {
    setSessionForm((current) => ({
      ...current,
      caregiverIds: current.caregiverIds.includes(caregiverId)
        ? current.caregiverIds.filter((item) => item !== caregiverId)
        : [...current.caregiverIds, caregiverId],
    }));
  }

  const scheduleButton = (
    <Button variant="primary" icon="plus" onClick={() => setDrawer("session")} disabled={chamberItems.length === 0}>
      Agendar sessão
    </Button>
  );
  const chamberButton = (
    <Button icon="plus" onClick={() => setDrawer("chamber")} disabled={tenants.length === 0}>
      Nova câmara
    </Button>
  );

  const statusCount = (status: SessionStatus) => inWeek.filter((session) => session.status === status).length;
  const chamberSessionCount = (chamberId: string) => inWeek.filter((session) => session.chamberId === chamberId).length;

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Sessões TCI"
        subtitle="Sessões de cuidado individual nas câmaras, semana a semana."
        secondary={chamberItems.length > 0 ? chamberButton : undefined}
        action={chamberItems.length > 0 ? scheduleButton : undefined}
      />

      {chamberItems.length === 0 ? (
        <EmptyState
          title="Nenhuma câmara cadastrada."
          reason="Câmaras são as salas onde acontecem as sessões de cuidado individual. Cadastre a primeira para poder agendar."
          hint={<>Use &quot;Nova câmara&quot; para começar.</>}
          action={
            <Button variant="primary" icon="plus" onClick={() => setDrawer("chamber")} disabled={tenants.length === 0}>
              Nova câmara
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1" role="group" aria-label="Semana">
              <IconButton label="Semana anterior" icon="arrow-left" variant="neutral" onClick={() => changeWeek(shiftWeek(weekStart, -7))} />
              <span className="min-w-[132px] text-center font-mono text-[13px]" role="status">
                {weekLabel(weekStart)}
              </span>
              <IconButton label="Próxima semana" icon="arrow" variant="neutral" onClick={() => changeWeek(shiftWeek(weekStart, 7))} />
            </div>
            <Input
              aria-label="Semana base"
              type="date"
              wrapperClassName="w-auto"
              value={weekStart}
              onChange={(event) => event.target.value && changeWeek(event.target.value)}
            />
            {tenants.length > 1 ? (
              <Select
                aria-label="Localidade"
                wrapperClassName="w-auto"
                value={filters.tenantId}
                onChange={(event) => changeFilters({ tenantId: event.target.value, chamberId: "", caregiverId: "" })}
                options={[{ value: "", label: "Todas as localidades" }, ...tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))]}
              />
            ) : null}
            <Select
              aria-label="Cuidador"
              wrapperClassName="w-auto"
              value={filters.caregiverId}
              onChange={(event) => changeFilters({ caregiverId: event.target.value })}
              options={[{ value: "", label: "Todos os cuidadores" }, ...filteredCaregivers.map((caregiver) => ({ value: caregiver.id, label: caregiver.name }))]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip
              label="Precisa de alguém"
              count={withoutCaregiver.length}
              tone="alert"
              pressed={needsOnly}
              onClick={() => setNeedsOnly((current) => !current)}
            />
            <span role="status" className="text-xs text-muted">
              {withoutCaregiver.length > 0
                ? `${plural(withoutCaregiver.length, "sessão", "sessões")} sem cuidador`
                : "Todas as sessões têm cuidador"}
            </span>
            <span className="mx-1 hidden h-4 w-px bg-border min-[560px]:inline-block" aria-hidden="true" />
            <Chip label="Todas" count={inWeek.length} pressed={!statusFilter} onClick={() => setStatusFilter("")} />
            {STATUS_ORDER.map((status) => (
              <Chip
                key={status}
                label={statusLabels[status]}
                count={statusCount(status)}
                pressed={statusFilter === status}
                onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel className="mr-1">Câmaras</SectionLabel>
            {filteredChambers.map((chamber) => (
              <Chip
                key={chamber.id}
                label={`${chamber.name}${chamber.active ? "" : " (inativa)"}`}
                count={chamberSessionCount(chamber.id)}
                title={chamber.capacity ? `${chamber.capacity} lugares` : undefined}
                pressed={filters.chamberId === chamber.id}
                onClick={() => changeFilters({ chamberId: filters.chamberId === chamber.id ? "" : chamber.id })}
              />
            ))}
          </div>

          <FormError>{drawer ? null : error}</FormError>

          {days.length === 0 ? (
            <EmptyState
              title={inWeek.length === 0 ? "Nenhuma sessão nesta semana." : "Nenhuma sessão com esses filtros."}
              reason={
                inWeek.length === 0
                  ? "Agende uma sessão escolhendo a câmara, o horário e quem cuida."
                  : "Limpe o filtro de status ou de cuidador para ver as outras sessões da semana."
              }
              hint={inWeek.length === 0 ? <>Use &quot;Agendar sessão&quot; no topo da página.</> : undefined}
              action={
                inWeek.length === 0 ? (
                  scheduleButton
                ) : (
                  <Button
                    onClick={() => {
                      setStatusFilter("");
                      setNeedsOnly(false);
                    }}
                  >
                    Limpar filtros
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-5">
              {days.map((day) => (
                <section key={day.date} className="grid gap-2" aria-label={fmtLong(day.date)}>
                  <h2 className="text-[13px] font-semibold capitalize text-muted">{fmtLong(day.date)}</h2>
                  {day.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="grid items-center gap-3 rounded-card border border-border bg-surface px-3.5 py-2.5 min-[900px]:grid-cols-[110px_minmax(0,1fr)_auto_auto]"
                    >
                      <time className="font-mono font-medium">
                        {session.startsAt}
                        {session.endsAt ? <span className="text-muted"> – {session.endsAt}</span> : null}
                      </time>
                      <div className="min-w-0">
                        <b className="font-semibold">
                          {session.title} · {session.chamberName ?? "Sem câmara"}
                        </b>
                        <small className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
                          {session.caregivers.length === 0 ? (
                            <Pill tone="danger">Sem cuidador</Pill>
                          ) : (
                            session.caregivers.map((caregiver) => (
                              <span key={caregiver.id} className="inline-flex items-center gap-1">
                                <Avatar name={caregiver.caregiverName ?? "Cuidador"} size="sm" />
                                {caregiver.caregiverName ?? "Cuidador"}
                              </span>
                            ))
                          )}
                        </small>
                      </div>
                      <Pill tone={statusTones[session.status]}>{statusLabels[session.status]}</Pill>
                      <div className="flex flex-wrap gap-1.5">
                        {TRANSITIONS.filter((transition) => transition.to !== session.status).map((transition) => (
                          <Button
                            key={transition.to}
                            size="sm"
                            variant={transition.variant}
                            disabled={submitting}
                            aria-label={`${transition.label} sessão ${session.title}`}
                            onClick={() => handleStatusChange(session.id, transition.to)}
                          >
                            {transition.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <Drawer
        open={drawer === "chamber"}
        onClose={() => setDrawer(null)}
        title="Nova câmara"
        subtitle="A sala onde acontecem as sessões."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="chamber-form" loading={submitting}>
              Criar câmara
            </Button>
          </>
        }
      >
        <form id="chamber-form" onSubmit={handleCreateChamber} className="grid gap-4">
          <Input
            label="Nome da câmara"
            value={chamberForm.name}
            onChange={(event) => setChamberForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ex.: Câmara 1"
            required
            data-autofocus
          />
          {tenants.length > 1 ? (
            <Select
              label="Localidade"
              value={chamberForm.tenantId}
              onChange={(event) => setChamberForm((current) => ({ ...current, tenantId: event.target.value }))}
              options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
              required
            />
          ) : null}
          <Input
            label="Capacidade (lugares)"
            value={chamberForm.capacity}
            onChange={(event) => setChamberForm((current) => ({ ...current, capacity: event.target.value.replace(/\D/g, "").slice(0, 3) }))}
            inputMode="numeric"
          />
          <Textarea
            label="Descrição"
            value={chamberForm.description}
            rows={3}
            onChange={(event) => setChamberForm((current) => ({ ...current, description: event.target.value }))}
          />
          <CheckRow
            checked={chamberForm.active}
            onChange={(event) => setChamberForm((current) => ({ ...current, active: event.target.checked }))}
            label="Câmara ativa"
            description="Só câmaras ativas aparecem ao agendar sessões."
          />
          <FormError>{error}</FormError>
        </form>
      </Drawer>

      <Drawer
        open={drawer === "session"}
        onClose={() => setDrawer(null)}
        title="Agendar sessão"
        subtitle="Escolha a câmara, o horário e quem cuida."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="tci-session-form" loading={submitting}>
              Agendar sessão
            </Button>
          </>
        }
      >
        <form id="tci-session-form" onSubmit={handleCreateSession} className="grid gap-4">
          <Input
            label="Título"
            value={sessionForm.title}
            onChange={(event) => setSessionForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ex.: TCI de quarta-feira"
            required
            data-autofocus
          />
          {tenants.length > 1 ? (
            <Select
              label="Localidade"
              value={sessionForm.tenantId}
              onChange={(event) =>
                setSessionForm((current) => ({ ...current, tenantId: event.target.value, chamberId: "", caregiverIds: [] }))
              }
              options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
              required
            />
          ) : null}
          <Input
            label="Data"
            type="date"
            value={sessionForm.scheduledDate}
            onChange={(event) => setSessionForm((current) => ({ ...current, scheduledDate: event.target.value }))}
            required
          />
          <FormGrid>
            <Input
              label="Início"
              type="time"
              value={sessionForm.startsAt}
              onChange={(event) => setSessionForm((current) => ({ ...current, startsAt: event.target.value }))}
              required
            />
            <Input
              label="Fim"
              type="time"
              value={sessionForm.endsAt}
              onChange={(event) => setSessionForm((current) => ({ ...current, endsAt: event.target.value }))}
              required
            />
          </FormGrid>
          <FormGrid>
            <Select
              label="Câmara"
              value={sessionForm.chamberId}
              onChange={(event) => setSessionForm((current) => ({ ...current, chamberId: event.target.value }))}
              options={sessionTenantChambers.map((chamber) => ({ value: chamber.id, label: chamber.name }))}
              placeholder="Selecione a câmara"
              required
            />
            <Select
              label="Status inicial"
              value={sessionForm.status}
              onChange={(event) => setSessionForm((current) => ({ ...current, status: event.target.value as SessionStatus }))}
              options={STATUS_ORDER.map((status) => ({ value: status, label: statusLabels[status] }))}
            />
          </FormGrid>
          <fieldset className="m-0 grid gap-1 border-0 p-0">
            <legend className="mb-1 text-xs font-semibold text-muted">Cuidadores envolvidos</legend>
            {sessionTenantCaregivers.length === 0 ? (
              <p className="text-muted">Nenhum cuidador ativo nesta localidade.</p>
            ) : (
              <div className="grid max-h-56 gap-0.5 overflow-y-auto">
                {sessionTenantCaregivers.map((caregiver) => (
                  <label
                    key={caregiver.id}
                    className={cx(
                      "flex cursor-pointer items-center gap-2.5 rounded-control border px-2.5 py-1.5",
                      sessionForm.caregiverIds.includes(caregiver.id) ? "border-primary bg-primary-soft" : "border-border",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={sessionForm.caregiverIds.includes(caregiver.id)}
                      onChange={() => toggleCaregiver(caregiver.id)}
                      className="size-4 accent-[var(--primary)]"
                    />
                    <Avatar name={caregiver.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{caregiver.name}</span>
                      <span className="block truncate text-xs text-muted">{caregiver.email ?? "Sem e-mail"}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <Textarea
            label="Descrição"
            value={sessionForm.description}
            rows={2}
            onChange={(event) => setSessionForm((current) => ({ ...current, description: event.target.value }))}
          />
          <Textarea
            label="Observações"
            value={sessionForm.notes}
            rows={3}
            onChange={(event) => setSessionForm((current) => ({ ...current, notes: event.target.value }))}
          />
          <FormError>{error}</FormError>
        </form>
      </Drawer>
    </div>
  );
}
