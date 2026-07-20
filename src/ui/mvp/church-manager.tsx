"use client";

import { startTransition, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  ChurchAttendanceRecord,
  ChurchAttendanceStatus,
  ChurchMeetingOccurrence,
  ChurchMeetingType,
  ChurchMembership,
  Member,
  Tenant,
} from "@/server/domain/mvp";
import { formatPhone, normalizePhone } from "@/ui/mvp/contact-form-utils";
import { Avatar, Button, Card, Input, SectionTitle, Select, Textarea } from "@/ui/v2-components/ui";
import { IconCalendar, IconCheck, IconChurch, IconClock, IconPlus, IconSearch, IconUsers, IconX } from "@/ui/v2-components/icons";

type Props = {
  tenants: Tenant[];
  members: Member[];
  churchMembers: ChurchMembership[];
  meetingTypes: ChurchMeetingType[];
  occurrences: ChurchMeetingOccurrence[];
};

const weekdays = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terca" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sabado" },
];

const attendanceLabels: Record<ChurchAttendanceStatus, string> = {
  unmarked: "Nao conferido",
  present: "Presente",
  absent: "Ausente",
  justified: "Justificado",
};

const attendancePalette: Record<ChurchAttendanceStatus, { bg: string; fg: string; border: string }> = {
  unmarked: { bg: "#F8FAFC", fg: "#64748B", border: "#CBD5E1" },
  present: { bg: "#DCFCE7", fg: "#15803D", border: "#BBF7D0" },
  absent: { bg: "#FEE2E2", fg: "#B91C1C", border: "#FECACA" },
  justified: { bg: "#FEF3C7", fg: "#B45309", border: "#FDE68A" },
};

export function ChurchManager({ tenants, members, churchMembers, meetingTypes, occurrences }: Readonly<Props>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "meetings" | "attendance">("overview");
  const [memberItems, setMemberItems] = useState(churchMembers);
  const [typeItems, setTypeItems] = useState(meetingTypes);
  const [occurrenceItems, setOccurrenceItems] = useState(occurrences);
  const [attendance, setAttendance] = useState<ChurchAttendanceRecord[]>([]);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState(occurrences[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [membershipForm, setMembershipForm] = useState({
    tenantId: tenants[0]?.id ?? "",
    memberId: "",
    startedAt: "",
    notes: "",
  });
  const [newMemberForm, setNewMemberForm] = useState({
    tenantId: tenants[0]?.id ?? "",
    name: "",
    phone: "",
    city: tenants[0]?.city ?? "",
    startedAt: "",
    notes: "",
  });
  const [typeForm, setTypeForm] = useState({
    tenantId: tenants[0]?.id ?? "",
    name: "",
    description: "",
    color: "#2D7FF9",
    recurrenceKind: "weekly" as "none" | "weekly",
    weekday: "4",
    startsAt: "19:30",
    endsAt: "",
    recurrenceStartsOn: new Date().toISOString().slice(0, 10),
    recurrenceEndsOn: "",
    notes: "",
  });
  const [occurrenceForm, setOccurrenceForm] = useState({
    tenantId: tenants[0]?.id ?? "",
    meetingTypeId: "",
    occursOn: new Date().toISOString().slice(0, 10),
    startsAt: "",
    endsAt: "",
    notes: "",
  });

  const activeChurchMembers = memberItems.filter((item) => item.status === "active");
  const pendingCalls = occurrenceItems.filter((item) => item.status === "scheduled" && ((item.attendanceTotals?.unmarked ?? 0) > 0 || !item.attendanceClosedAt));
  const nextOccurrence = occurrenceItems
    .filter((item) => item.status === "scheduled" && item.occursOn >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.occursOn.localeCompare(b.occursOn))[0];

  const tenantMembers = useMemo(() => {
    const linked = new Set(memberItems.map((item) => item.memberId));
    return members
      .filter((member) => member.tenantId === membershipForm.tenantId && !linked.has(member.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, memberItems, membershipForm.tenantId]);

  const currentOccurrence = occurrenceItems.find((item) => item.id === selectedOccurrenceId) ?? occurrenceItems[0] ?? null;
  const filteredAttendance = attendance.filter((item) => `${item.memberName ?? ""} ${item.memberPhone ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const attendanceProgress = attendance.length
    ? `${attendance.filter((item) => item.status !== "unmarked").length}/${attendance.length}`
    : "0/0";

  async function reloadAll() {
    const [membersResponse, typesResponse, occurrencesResponse] = await Promise.all([
      fetch("/api/church/members"),
      fetch("/api/church/meeting-types"),
      fetch("/api/church/occurrences"),
    ]);
    setMemberItems((await membersResponse.json().catch(() => [])) as ChurchMembership[]);
    setTypeItems((await typesResponse.json().catch(() => [])) as ChurchMeetingType[]);
    setOccurrenceItems((await occurrencesResponse.json().catch(() => [])) as ChurchMeetingOccurrence[]);
  }

  async function submitJson<T>(url: string, options: RequestInit): Promise<T | null> {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    setSubmitting(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel concluir a acao.");
      return null;
    }
    return (await response.json().catch(() => null)) as T;
  }

  async function handleLinkMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await submitJson<ChurchMembership>("/api/church/members", {
      method: "POST",
      body: JSON.stringify(membershipForm),
    });
    if (!created) return;
    setMembershipForm((current) => ({ ...current, memberId: "", notes: "" }));
    setSuccess("Membro vinculado a Igreja.");
    await reloadAll();
    startTransition(() => router.refresh());
  }

  async function handleRegisterMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPhone = normalizePhone(newMemberForm.phone);
    if (normalizedPhone && (normalizedPhone.length !== 11 || normalizedPhone[2] !== "9")) {
      setError("Informe um WhatsApp valido com DDD, digito 9 e os 8 numeros restantes.");
      return;
    }

    const created = await submitJson<ChurchMembership>("/api/church/members/register", {
      method: "POST",
      body: JSON.stringify({
        tenantId: newMemberForm.tenantId,
        name: newMemberForm.name,
        phone: normalizedPhone,
        city: newMemberForm.city,
        churchStartedAt: newMemberForm.startedAt || null,
        churchNotes: newMemberForm.notes,
      }),
    });
    if (!created) return;
    setNewMemberForm((current) => ({ ...current, name: "", phone: "", notes: "" }));
    setSuccess("Pessoa cadastrada e vinculada a Igreja.");
    await reloadAll();
    startTransition(() => router.refresh());
  }

  async function toggleMembership(membership: ChurchMembership) {
    const nextStatus = membership.status === "active" ? "inactive" : "active";
    const updated = await submitJson<ChurchMembership>(`/api/church/members/${membership.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus, endedAt: nextStatus === "inactive" ? new Date().toISOString().slice(0, 10) : null }),
    });
    if (!updated) return;
    setSuccess(nextStatus === "active" ? "Vinculo reativado." : "Vinculo inativado.");
    await reloadAll();
  }

  async function handleCreateType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await submitJson<ChurchMeetingType>("/api/church/meeting-types", {
      method: "POST",
      body: JSON.stringify({
        ...typeForm,
        weekday: typeForm.recurrenceKind === "weekly" ? Number(typeForm.weekday) : null,
        startsAt: typeForm.startsAt || null,
        endsAt: typeForm.endsAt || null,
        recurrenceStartsOn: typeForm.recurrenceStartsOn || null,
        recurrenceEndsOn: typeForm.recurrenceEndsOn || null,
      }),
    });
    if (!created) return;
    setTypeForm((current) => ({ ...current, name: "", description: "", notes: "" }));
    setOccurrenceForm((current) => ({ ...current, meetingTypeId: created.id, tenantId: created.tenantId }));
    setSuccess("Tipo de reuniao criado.");
    await reloadAll();
  }

  async function generateOccurrences(meetingTypeId: string) {
    const generated = await submitJson<ChurchMeetingOccurrence[]>(`/api/church/meeting-types/${meetingTypeId}/generate-occurrences`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!generated) return;
    setSuccess(`${generated.length} ocorrencia(s) preparada(s).`);
    await reloadAll();
  }

  async function handleCreateOccurrence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await submitJson<ChurchMeetingOccurrence>("/api/church/occurrences", {
      method: "POST",
      body: JSON.stringify({
        ...occurrenceForm,
        startsAt: occurrenceForm.startsAt || null,
        endsAt: occurrenceForm.endsAt || null,
      }),
    });
    if (!created) return;
    setSelectedOccurrenceId(created.id);
    setSuccess("Ocorrencia criada.");
    await reloadAll();
  }

  async function openAttendance(occurrenceId: string) {
    const records = await submitJson<ChurchAttendanceRecord[]>(`/api/church/occurrences/${occurrenceId}/attendance`, { method: "GET" });
    if (!records) return;
    setSelectedOccurrenceId(occurrenceId);
    setAttendance(records);
    setActiveTab("attendance");
  }

  async function markAttendance(record: ChurchAttendanceRecord, status: ChurchAttendanceStatus) {
    const updated = await submitJson<ChurchAttendanceRecord>(`/api/church/occurrences/${record.occurrenceId}/attendance/${record.memberId}`, {
      method: "PUT",
      body: JSON.stringify({ status, notes: record.notes }),
    });
    if (!updated) return;
    setAttendance((current) => current.map((item) => (item.id === record.id ? { ...item, ...updated, memberName: record.memberName, memberPhone: record.memberPhone } : item)));
  }

  async function closeAttendance() {
    if (!currentOccurrence) return;
    const closed = await submitJson<ChurchMeetingOccurrence>(`/api/church/occurrences/${currentOccurrence.id}/attendance/close`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!closed) return;
    setSuccess("Chamada fechada.");
    await reloadAll();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "24px 16px 32px" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <header>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>
            Coordenacao · Igreja
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
            Igreja
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-2)", maxWidth: 720, lineHeight: 1.5 }}>
            Membros que reunem com a localidade, tipos de reuniao e chamadas de presenca.
          </p>
        </header>

        {error ? <Banner tone="error">{error}</Banner> : null}
        {success ? <Banner tone="success">{success}</Banner> : null}

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {[
            ["overview", "Visao geral"],
            ["members", "Membros"],
            ["meetings", "Reunioes"],
            ["attendance", "Presencas"],
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setActiveTab(key as typeof activeTab)} style={tabStyle(activeTab === key)}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <Stat label="Membros ativos" value={activeChurchMembers.length} />
            <Stat label="Tipos de reuniao" value={typeItems.length} />
            <Stat label="Ocorrencias" value={occurrenceItems.length} />
            <Stat label="Chamadas pendentes" value={pendingCalls.length} />
            <Card padding={20} style={{ gridColumn: "1 / -1" }}>
              <SectionTitle>Proxima reuniao</SectionTitle>
              {nextOccurrence ? (
                <OccurrenceRow occurrence={nextOccurrence} onOpenAttendance={() => openAttendance(nextOccurrence.id)} />
              ) : (
                <EmptyText>Nenhuma reuniao futura agendada.</EmptyText>
              )}
            </Card>
          </div>
        ) : null}

        {activeTab === "members" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Card padding={20}>
              <SectionTitle>Adicionar membro existente</SectionTitle>
              <form onSubmit={handleLinkMember} style={stackStyle}>
                <Select label="Localidade" value={membershipForm.tenantId} onChange={(value) => setMembershipForm((current) => ({ ...current, tenantId: value, memberId: "" }))} options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))} required />
                <Select label="Membro" value={membershipForm.memberId} onChange={(value) => setMembershipForm((current) => ({ ...current, memberId: value }))} options={tenantMembers.map((member) => ({ value: member.id, label: `${member.name}${member.phone ? ` · ${formatPhone(member.phone)}` : ""}` }))} placeholder="Selecione um membro" required />
                <Input label="Reune desde" type="date" value={membershipForm.startedAt} onChange={(value) => setMembershipForm((current) => ({ ...current, startedAt: value }))} />
                <Textarea label="Observacoes" value={membershipForm.notes} onChange={(value) => setMembershipForm((current) => ({ ...current, notes: value }))} rows={2} />
                <Button type="submit" disabled={submitting} icon={<IconPlus />} full>Vincular a Igreja</Button>
              </form>
            </Card>

            <Card padding={20}>
              <SectionTitle>Cadastrar nova pessoa</SectionTitle>
              <form onSubmit={handleRegisterMember} style={stackStyle}>
                <Select label="Localidade" value={newMemberForm.tenantId} onChange={(value) => {
                  const tenant = tenants.find((item) => item.id === value);
                  setNewMemberForm((current) => ({ ...current, tenantId: value, city: tenant?.city ?? current.city }));
                }} options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))} required />
                <Input label="Nome" value={newMemberForm.name} onChange={(value) => setNewMemberForm((current) => ({ ...current, name: value }))} icon={<IconUsers />} required />
                <Input
                  label="WhatsApp"
                  value={formatPhone(newMemberForm.phone)}
                  onChange={(value) => setNewMemberForm((current) => ({ ...current, phone: normalizePhone(value) }))}
                  placeholder="(00) 90000-0000"
                  inputMode="numeric"
                  hint="Use DDD + 9 + oito numeros."
                />
                <Input label="Cidade" value={newMemberForm.city} onChange={(value) => setNewMemberForm((current) => ({ ...current, city: value }))} />
                <Input label="Reune desde" type="date" value={newMemberForm.startedAt} onChange={(value) => setNewMemberForm((current) => ({ ...current, startedAt: value }))} />
                <Textarea label="Observacoes" value={newMemberForm.notes} onChange={(value) => setNewMemberForm((current) => ({ ...current, notes: value }))} rows={2} />
                <Button type="submit" disabled={submitting} icon={<IconPlus />} full>Criar e vincular</Button>
              </form>
            </Card>

            <Card padding={20} style={{ gridColumn: "1 / -1" }}>
              <SectionTitle action={<span style={counterStyle}>{memberItems.length} vinculo(s)</span>}>Membros da Igreja</SectionTitle>
              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <tbody>
                    {memberItems.map((membership) => (
                      <tr key={membership.id} style={rowBorderStyle}>
                        <td style={cellStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <Avatar name={membership.memberName ?? "Membro"} size={38} />
                            <div>
                              <div style={strongTextStyle}>{membership.memberName}</div>
                              <div style={mutedTextStyle}>{[membership.memberPhone, membership.memberCity, membership.caregiverName].filter(Boolean).join(" · ")}</div>
                            </div>
                          </div>
                        </td>
                        <td style={cellStyle}><Badge tone={membership.status === "active" ? "success" : "neutral"}>{membership.status === "active" ? "Ativo" : "Inativo"}</Badge></td>
                        <td style={cellStyle}>
                          <Button type="button" variant="secondary" size="sm" onClick={() => toggleMembership(membership)}>
                            {membership.status === "active" ? "Inativar" : "Reativar"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === "meetings" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Card padding={20}>
              <SectionTitle>Novo tipo de reuniao</SectionTitle>
              <form onSubmit={handleCreateType} style={stackStyle}>
                <Select label="Localidade" value={typeForm.tenantId} onChange={(value) => setTypeForm((current) => ({ ...current, tenantId: value }))} options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))} required />
                <Input label="Nome" value={typeForm.name} onChange={(value) => setTypeForm((current) => ({ ...current, name: value }))} placeholder="TCI, Reuniao da Mesa..." icon={<IconChurch />} required />
                <Textarea label="Descricao" value={typeForm.description} onChange={(value) => setTypeForm((current) => ({ ...current, description: value }))} rows={2} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Select label="Recorrencia" value={typeForm.recurrenceKind} onChange={(value) => setTypeForm((current) => ({ ...current, recurrenceKind: value as "none" | "weekly" }))} options={[{ value: "weekly", label: "Semanal" }, { value: "none", label: "Avulsa" }]} />
                  <Select label="Dia" value={typeForm.weekday} onChange={(value) => setTypeForm((current) => ({ ...current, weekday: value }))} options={weekdays} />
                  <Input label="Inicio" type="time" value={typeForm.startsAt} onChange={(value) => setTypeForm((current) => ({ ...current, startsAt: value }))} icon={<IconClock />} />
                  <Input label="Fim" type="time" value={typeForm.endsAt} onChange={(value) => setTypeForm((current) => ({ ...current, endsAt: value }))} />
                  <Input label="Comeca em" type="date" value={typeForm.recurrenceStartsOn} onChange={(value) => setTypeForm((current) => ({ ...current, recurrenceStartsOn: value }))} />
                  <Input label="Termina em" type="date" value={typeForm.recurrenceEndsOn} onChange={(value) => setTypeForm((current) => ({ ...current, recurrenceEndsOn: value }))} />
                </div>
                <Button type="submit" disabled={submitting} icon={<IconPlus />} full>Criar tipo</Button>
              </form>
            </Card>

            <Card padding={20}>
              <SectionTitle>Ocorrencia avulsa</SectionTitle>
              <form onSubmit={handleCreateOccurrence} style={stackStyle}>
                <Select label="Localidade" value={occurrenceForm.tenantId} onChange={(value) => setOccurrenceForm((current) => ({ ...current, tenantId: value, meetingTypeId: "" }))} options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))} required />
                <Select label="Tipo" value={occurrenceForm.meetingTypeId} onChange={(value) => setOccurrenceForm((current) => ({ ...current, meetingTypeId: value }))} options={typeItems.filter((item) => item.tenantId === occurrenceForm.tenantId).map((item) => ({ value: item.id, label: item.name }))} placeholder="Selecione o tipo" required />
                <Input label="Data" type="date" value={occurrenceForm.occursOn} onChange={(value) => setOccurrenceForm((current) => ({ ...current, occursOn: value }))} icon={<IconCalendar />} required />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input label="Inicio" type="time" value={occurrenceForm.startsAt} onChange={(value) => setOccurrenceForm((current) => ({ ...current, startsAt: value }))} />
                  <Input label="Fim" type="time" value={occurrenceForm.endsAt} onChange={(value) => setOccurrenceForm((current) => ({ ...current, endsAt: value }))} />
                </div>
                <Textarea label="Observacoes" value={occurrenceForm.notes} onChange={(value) => setOccurrenceForm((current) => ({ ...current, notes: value }))} rows={2} />
                <Button type="submit" disabled={submitting} icon={<IconPlus />} full>Criar ocorrencia</Button>
              </form>
            </Card>

            <Card padding={20} style={{ gridColumn: "1 / -1" }}>
              <SectionTitle>Tipos e proximas ocorrencias</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {typeItems.map((type) => (
                  <div key={type.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 99, background: type.color }} />
                      <strong style={strongTextStyle}>{type.name}</strong>
                    </div>
                    <div style={{ ...mutedTextStyle, marginTop: 6 }}>
                      {type.recurrenceKind === "weekly" && type.weekday !== null ? `Semanal · ${weekdays[type.weekday]?.label ?? ""}` : "Avulsa"}
                      {type.startsAt ? ` · ${type.startsAt}` : ""}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      {type.recurrenceKind === "weekly" ? <Button type="button" variant="secondary" size="sm" onClick={() => generateOccurrences(type.id)}>Gerar 8 semanas</Button> : null}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {occurrenceItems.slice(0, 8).map((occurrence) => (
                  <OccurrenceRow key={occurrence.id} occurrence={occurrence} onOpenAttendance={() => openAttendance(occurrence.id)} />
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === "attendance" ? (
          <Card padding={20}>
            <SectionTitle action={<span style={counterStyle}>Progresso {attendanceProgress}</span>}>Chamada</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 340px) 1fr", gap: 16 }}>
              <div style={stackStyle}>
                <Select label="Ocorrencia" value={currentOccurrence?.id ?? selectedOccurrenceId} onChange={(value) => openAttendance(value)} options={occurrenceItems.map((item) => ({ value: item.id, label: `${item.meetingTypeName ?? "Reuniao"} · ${formatDate(item.occursOn)}` }))} />
                <Input placeholder="Buscar na chamada" value={search} onChange={setSearch} icon={<IconSearch />} />
                {currentOccurrence ? <Button type="button" variant="primary" disabled={submitting || attendance.some((item) => item.status === "unmarked")} onClick={closeAttendance} icon={<IconCheck />} full>Fechar chamada</Button> : null}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {attendance.length === 0 ? <EmptyText>Selecione uma ocorrencia para abrir a chamada.</EmptyText> : null}
                {filteredAttendance.map((record) => (
                  <div key={record.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", padding: 12, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Avatar name={record.memberName ?? "Membro"} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <div style={strongTextStyle}>{record.memberName}</div>
                        <div style={mutedTextStyle}>{record.memberPhone ?? "Sem telefone"} · {attendanceLabels[record.status]}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {(["present", "absent", "justified"] as ChurchAttendanceStatus[]).map((status) => (
                        <button key={status} type="button" disabled={submitting} onClick={() => markAttendance(record, status)} style={attendanceButtonStyle(status, record.status === status)}>
                          {attendanceLabels[status]}
                        </button>
                      ))}
                      <button type="button" disabled={submitting} onClick={() => markAttendance(record, "unmarked")} style={attendanceButtonStyle("unmarked", record.status === "unmarked")}>
                        Limpar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function OccurrenceRow({ occurrence, onOpenAttendance }: Readonly<{ occurrence: ChurchMeetingOccurrence; onOpenAttendance: () => void }>) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface-2)", flexWrap: "wrap" }}>
      <div>
        <div style={strongTextStyle}>{occurrence.meetingTypeName ?? "Reuniao"}</div>
        <div style={mutedTextStyle}>{formatDate(occurrence.occursOn)}{occurrence.startsAt ? ` · ${occurrence.startsAt}` : ""}</div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Badge tone={occurrence.status === "completed" ? "success" : occurrence.status === "cancelled" ? "danger" : "info"}>{occurrence.status}</Badge>
        <Button type="button" variant="secondary" size="sm" onClick={onOpenAttendance}>Fazer chamada</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Card padding={18}>
      <div style={mutedTextStyle}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{value}</div>
    </Card>
  );
}

function Banner({ children, tone }: Readonly<{ children: string; tone: "error" | "success" }>) {
  return (
    <div style={{ padding: "12px 16px", borderRadius: 12, fontSize: 13.5, fontWeight: 700, ...(tone === "error" ? { background: "#FFF1F2", border: "1px solid #FECDD3", color: "#E11D48" } : { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D" }) }}>
      {tone === "error" ? <IconX size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> : <IconCheck size={14} style={{ verticalAlign: -2, marginRight: 6 }} />}
      {children}
    </div>
  );
}

function Badge({ children, tone }: Readonly<{ children: string; tone: "success" | "neutral" | "info" | "danger" }>) {
  const palette = {
    success: { bg: "#DCFCE7", fg: "#15803D" },
    neutral: { bg: "#E2E8F0", fg: "#475569" },
    info: { bg: "#DBEAFE", fg: "#1D4ED8" },
    danger: { bg: "#FEE2E2", fg: "#B91C1C" },
  }[tone];
  return <span style={{ padding: "5px 9px", borderRadius: 999, background: palette.bg, color: palette.fg, fontSize: 11.5, fontWeight: 800 }}>{children}</span>;
}

function EmptyText({ children }: Readonly<{ children: string }>) {
  return <div style={{ padding: 18, borderRadius: 14, border: "1px dashed var(--border)", color: "var(--text-3)", fontSize: 13.5, textAlign: "center" }}>{children}</div>;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "11px 16px",
    borderRadius: 12,
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
    background: active ? "var(--accent)" : "var(--surface)",
    color: active ? "#fff" : "var(--text)",
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function attendanceButtonStyle(status: ChurchAttendanceStatus, active: boolean): React.CSSProperties {
  const palette = attendancePalette[status];
  return {
    minHeight: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: `1px solid ${active ? palette.fg : palette.border}`,
    background: active ? palette.bg : "var(--surface)",
    color: active ? palette.fg : "var(--text-2)",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  };
}

const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 12 };
const counterStyle: React.CSSProperties = { fontSize: 12, color: "var(--text-3)", fontWeight: 600 };
const strongTextStyle: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: "var(--text)", minWidth: 0 };
const mutedTextStyle: React.CSSProperties = { fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 };
const tableWrapStyle: React.CSSProperties = { overflowX: "auto" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const rowBorderStyle: React.CSSProperties = { borderBottom: "1px solid var(--border)" };
const cellStyle: React.CSSProperties = { padding: "12px 10px", verticalAlign: "middle" };
