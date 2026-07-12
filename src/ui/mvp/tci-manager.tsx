"use client";

import { startTransition, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, TciChamber, TciSession, Tenant } from "@/server/domain/mvp";
import { Avatar, Button, Card, Input, SectionTitle, Select, Textarea } from "@/ui/v2-components/ui";
import { IconCalendar, IconCheck, IconHeart, IconPlus, IconSparkle, IconUsers } from "@/ui/v2-components/icons";

type Props = {
  tenants: Tenant[];
  caregivers: Caregiver[];
  chambers: TciChamber[];
  sessions: TciSession[];
  initialWeekStart: string;
};

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "draft", label: "Rascunho" },
  { value: "scheduled", label: "Agendada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Realizada" },
  { value: "cancelled", label: "Cancelada" },
];

const statusLabels: Record<TciSession["status"], string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Realizada",
  cancelled: "Cancelada",
};

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
  status: "scheduled" as TciSession["status"],
};

export function TciManager({ tenants, caregivers, chambers, sessions, initialWeekStart }: Readonly<Props>) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [items, setItems] = useState(sessions);
  const [chamberItems, setChamberItems] = useState(chambers);
  const [filters, setFilters] = useState({
    tenantId: "",
    chamberId: "",
    caregiverId: "",
    status: "",
  });
  const [chamberForm, setChamberForm] = useState({
    ...emptyChamberForm,
    tenantId: tenants[0]?.id ?? "",
  });
  const [sessionForm, setSessionForm] = useState({
    ...emptySessionForm,
    tenantId: tenants[0]?.id ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSessionForm((current) => ({
      ...current,
      chamberId: current.tenantId === sessionForm.tenantId ? current.chamberId : "",
    }));
  }, [sessionForm.tenantId]);

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

  const groupedByDay = useMemo(() => {
    const map = new Map<string, TciSession[]>();
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(`${weekStart}T00:00:00`);
      date.setDate(date.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      map.set(key, []);
    }

    for (const session of items) {
      if (!map.has(session.scheduledDate)) continue;
      const current = map.get(session.scheduledDate) ?? [];
      current.push(session);
      current.sort((left, right) => left.startsAt.localeCompare(right.startsAt));
      map.set(session.scheduledDate, current);
    }

    return Array.from(map.entries()).map(([date, sessionsForDay]) => ({ date, sessions: sessionsForDay }));
  }, [items, weekStart]);

  async function reloadData(nextWeekStart = weekStart) {
    const params = new URLSearchParams();
    params.set("weekStart", nextWeekStart);
    if (filters.tenantId) params.set("tenantId", filters.tenantId);
    if (filters.chamberId) params.set("chamberId", filters.chamberId);
    if (filters.caregiverId) params.set("caregiverId", filters.caregiverId);
    if (filters.status) params.set("status", filters.status);

    const [sessionsResponse, chambersResponse] = await Promise.all([
      fetch(`/api/tci/sessions?${params.toString()}`),
      fetch(`/api/tci/chambers${filters.tenantId ? `?tenantId=${filters.tenantId}` : ""}`),
    ]);

    const sessionsPayload = (await sessionsResponse.json().catch(() => [])) as TciSession[];
    const chambersPayload = (await chambersResponse.json().catch(() => [])) as TciChamber[];
    setItems(sessionsPayload);
    setChamberItems(chambersPayload);
  }

  async function handleCreateChamber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

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
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel criar a camara.");
      return;
    }

    setChamberForm({ ...emptyChamberForm, tenantId: chamberForm.tenantId });
    setSuccess("Camara criada.");
    await reloadData();
    startTransition(() => router.refresh());
  }

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

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
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel criar a sessao.");
      return;
    }

    setSessionForm({ ...emptySessionForm, tenantId: sessionForm.tenantId, scheduledDate: sessionForm.scheduledDate, status: "scheduled" });
    setSuccess("Sessao TCI criada.");
    await reloadData();
    startTransition(() => router.refresh());
  }

  async function handleStatusChange(sessionId: string, status: TciSession["status"]) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/tci/sessions/${sessionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setSubmitting(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel atualizar o status.");
      return;
    }

    setSuccess("Status atualizado.");
    await reloadData();
  }

  async function applyFilters(nextWeekStart = weekStart) {
    setError(null);
    await reloadData(nextWeekStart);
  }

  function toggleCaregiver(caregiverId: string) {
    setSessionForm((current) => ({
      ...current,
      caregiverIds: current.caregiverIds.includes(caregiverId)
        ? current.caregiverIds.filter((item) => item !== caregiverId)
        : [...current.caregiverIds, caregiverId],
    }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "24px 16px 32px", maxWidth: 1200, margin: "0 auto" }}>
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>
          Coordenacao · TCI
        </p>
        <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
          Agenda semanal e camaras
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
          Gerencie as sessoes de TCI, vincule cuidadores e organize as camaras de energizacao em uma operacao semanal mobile first.
        </p>
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {success ? <Banner tone="success">{success}</Banner> : null}

      <Card padding={20}>
        <SectionTitle>Filtros da semana</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Input label="Semana base" type="date" value={weekStart} onChange={setWeekStart} icon={<IconCalendar />} />
          <Select label="Localidade" value={filters.tenantId} onChange={(value) => setFilters((current) => ({ ...current, tenantId: value, chamberId: "", caregiverId: "" }))} options={[{ value: "", label: "Todas as localidades" }, ...tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))]} />
          <Select label="Camara" value={filters.chamberId} onChange={(value) => setFilters((current) => ({ ...current, chamberId: value }))} options={[{ value: "", label: "Todas as camaras" }, ...filteredChambers.map((chamber) => ({ value: chamber.id, label: chamber.name }))]} />
          <Select label="Cuidador" value={filters.caregiverId} onChange={(value) => setFilters((current) => ({ ...current, caregiverId: value }))} options={[{ value: "", label: "Todos os cuidadores" }, ...filteredCaregivers.map((caregiver) => ({ value: caregiver.id, label: caregiver.name }))]} />
          <Select label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={statusOptions} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Button type="button" variant="secondary" size="md" onClick={() => applyFilters(weekStart)} full>
            Aplicar filtros
          </Button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <Card padding={20}>
          <SectionTitle>Cadastrar camara</SectionTitle>
          <form onSubmit={handleCreateChamber} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Select label="Localidade" value={chamberForm.tenantId} onChange={(value) => setChamberForm((current) => ({ ...current, tenantId: value }))} options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))} required />
            <Input label="Nome da camara" value={chamberForm.name} onChange={(value) => setChamberForm((current) => ({ ...current, name: value }))} placeholder="Ex: Camara 1" icon={<IconSparkle />} required />
            <Input label="Capacidade" value={chamberForm.capacity} onChange={(value) => setChamberForm((current) => ({ ...current, capacity: value.replace(/\D/g, "").slice(0, 3) }))} inputMode="numeric" />
            <Textarea label="Descricao" value={chamberForm.description} onChange={(value) => setChamberForm((current) => ({ ...current, description: value }))} rows={3} />
            <Button type="submit" variant="primary" size="md" disabled={submitting} icon={<IconPlus />} full>
              Criar camara
            </Button>
          </form>
        </Card>

        <Card padding={20}>
          <SectionTitle>Agendar sessao</SectionTitle>
          <form onSubmit={handleCreateSession} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Select label="Localidade" value={sessionForm.tenantId} onChange={(value) => setSessionForm((current) => ({ ...current, tenantId: value, chamberId: "", caregiverIds: [] }))} options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))} required />
            <Input label="Titulo" value={sessionForm.title} onChange={(value) => setSessionForm((current) => ({ ...current, title: value }))} placeholder="Ex: TCI de quarta-feira" required />
            <Textarea label="Descricao" value={sessionForm.description} onChange={(value) => setSessionForm((current) => ({ ...current, description: value }))} rows={2} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <Input label="Data" type="date" value={sessionForm.scheduledDate} onChange={(value) => setSessionForm((current) => ({ ...current, scheduledDate: value }))} />
              <Input label="Inicio" type="time" value={sessionForm.startsAt} onChange={(value) => setSessionForm((current) => ({ ...current, startsAt: value }))} />
              <Input label="Fim" type="time" value={sessionForm.endsAt} onChange={(value) => setSessionForm((current) => ({ ...current, endsAt: value }))} />
            </div>
            <Select label="Camara" value={sessionForm.chamberId} onChange={(value) => setSessionForm((current) => ({ ...current, chamberId: value }))} options={sessionTenantChambers.map((chamber) => ({ value: chamber.id, label: chamber.name }))} placeholder="Selecione a camara" required />
            <Select label="Status inicial" value={sessionForm.status} onChange={(value) => setSessionForm((current) => ({ ...current, status: value as TciSession["status"] }))} options={statusOptions.filter((item) => item.value).map((item) => ({ value: item.value, label: item.label }))} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Cuidadores envolvidos</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                {sessionTenantCaregivers.map((caregiver) => (
                  <label key={caregiver.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--border)", background: sessionForm.caregiverIds.includes(caregiver.id) ? "var(--accent-bg)" : "var(--surface-2)", cursor: "pointer" }}>
                    <input type="checkbox" checked={sessionForm.caregiverIds.includes(caregiver.id)} onChange={() => toggleCaregiver(caregiver.id)} />
                    <Avatar name={caregiver.name} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{caregiver.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-2)" }}>{caregiver.email ?? "Sem email"}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <Textarea label="Observacoes" value={sessionForm.notes} onChange={(value) => setSessionForm((current) => ({ ...current, notes: value }))} rows={3} />
            <Button type="submit" variant="primary" size="md" disabled={submitting} icon={<IconPlus />} full>
              Criar sessao
            </Button>
          </form>
        </Card>
      </div>

      <Card padding={20}>
        <SectionTitle action={<span style={{ fontSize: 12, color: "var(--text-3)" }}>{items.length} sessao(oes)</span>}>
          Agenda semanal
        </SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {groupedByDay.map((day) => (
            <div key={day.date} style={{ border: "1px solid var(--border)", borderRadius: 16, background: "var(--surface-2)", padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {new Date(`${day.date}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {day.sessions.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>Nenhuma sessao.</div>
                ) : null}
                {day.sessions.map((session) => (
                  <div key={session.id} style={{ padding: "12px 12px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{session.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                          {session.startsAt} - {session.endsAt} · {session.chamberName ?? "Sem camara"}
                        </div>
                      </div>
                      <StatusBadge status={session.status}>{statusLabels[session.status]}</StatusBadge>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                      {session.caregivers.map((caregiver) => (
                        <div key={caregiver.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-2)" }}>
                          <IconHeart size={14} />
                          <span>{caregiver.caregiverName ?? "Cuidador"}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
                      <Button type="button" variant="secondary" size="sm" disabled={submitting || session.status === "confirmed"} onClick={() => handleStatusChange(session.id, "confirmed")} full>
                        Confirmar
                      </Button>
                      <Button type="button" variant="secondary" size="sm" disabled={submitting || session.status === "completed"} onClick={() => handleStatusChange(session.id, "completed")} icon={<IconCheck />} full>
                        Concluir
                      </Button>
                      <Button type="button" variant="secondary" size="sm" disabled={submitting || session.status === "scheduled"} onClick={() => handleStatusChange(session.id, "scheduled")} full>
                        Agendar
                      </Button>
                      <Button type="button" variant="secondary" size="sm" disabled={submitting || session.status === "cancelled"} onClick={() => handleStatusChange(session.id, "cancelled")} full style={{ color: "#B91C1C", borderColor: "rgba(185,28,28,0.18)" }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Banner({ children, tone }: Readonly<{ children: string; tone: "error" | "success" }>) {
  const style = tone === "error"
    ? { background: "#FFF1F2", border: "1px solid #FECDD3", color: "#E11D48" }
    : { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D" };

  return <div style={{ ...style, padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{children}</div>;
}

function StatusBadge({ children, status }: Readonly<{ children: string; status: TciSession["status"] }>) {
  const palette: Record<TciSession["status"], { bg: string; fg: string }> = {
    draft: { bg: "#E2E8F0", fg: "#334155" },
    scheduled: { bg: "#DBEAFE", fg: "#1D4ED8" },
    confirmed: { bg: "#FEF3C7", fg: "#B45309" },
    completed: { bg: "#DCFCE7", fg: "#15803D" },
    cancelled: { bg: "#FEE2E2", fg: "#B91C1C" },
  };
  return (
    <span style={{ padding: "4px 8px", borderRadius: 999, background: palette[status].bg, color: palette[status].fg, fontSize: 11, fontWeight: 700 }}>
      {children}
    </span>
  );
}
