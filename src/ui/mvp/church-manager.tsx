"use client";

import { startTransition, useMemo, useState, type FormEvent, type ReactNode } from "react";
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
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Drawer,
  EmptyState,
  Input,
  PageHeader,
  Pill,
  SearchInput,
  Segmented,
  Select,
  Stat,
  Table,
  Tabs,
  Td,
  Textarea,
  Th,
  Tr,
  useToast,
} from "@/ui/atalaia";
import { FormError, FormGrid, plural, readApiError, useResetOnOpen } from "@/ui/gestao";

type Props = {
  tenants: Tenant[];
  members: Member[];
  churchMembers: ChurchMembership[];
  meetingTypes: ChurchMeetingType[];
  occurrences: ChurchMeetingOccurrence[];
};

type Tab = "overview" | "members" | "meetings" | "attendance";
type DrawerKind = "link" | "meetingType" | "occurrence" | null;

const weekdays = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terça" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sábado" },
];

const attendanceLabels: Record<ChurchAttendanceStatus, string> = {
  unmarked: "Não conferido",
  present: "Presente",
  absent: "Ausente",
  justified: "Justificado",
};

const occurrenceStatusLabels: Record<ChurchMeetingOccurrence["status"], string> = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const pageSize = 8;

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ChurchManager({ tenants, members, churchMembers, meetingTypes, occurrences }: Readonly<Props>) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [linkMode, setLinkMode] = useState<"existing" | "new">("existing");
  const [memberItems, setMemberItems] = useState(churchMembers);
  const [typeItems, setTypeItems] = useState(meetingTypes);
  const [occurrenceItems, setOccurrenceItems] = useState(occurrences);
  const [attendance, setAttendance] = useState<ChurchAttendanceRecord[]>([]);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState(occurrences[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [memberFilters, setMemberFilters] = useState({ tenantId: "", status: "", query: "" });
  const [memberPage, setMemberPage] = useState(1);
  const [meetingFilters, setMeetingFilters] = useState({ recurrenceKind: "", query: "" });
  const [typePage, setTypePage] = useState(1);
  const [occurrenceFilters, setOccurrenceFilters] = useState({ meetingTypeId: "", status: "" });
  const [occurrencePage, setOccurrencePage] = useState(1);
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<ChurchAttendanceStatus | "">("");
  const [attendancePage, setAttendancePage] = useState(1);
  const [error, setError] = useState<string | null>(null);
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
    color: "#f2b24c",
    recurrenceKind: "weekly" as "none" | "weekly",
    weekday: "4",
    startsAt: "19:30",
    endsAt: "",
    recurrenceStartsOn: todayDate(),
    recurrenceEndsOn: "",
    notes: "",
  });
  const [occurrenceForm, setOccurrenceForm] = useState({
    tenantId: tenants[0]?.id ?? "",
    meetingTypeId: "",
    occursOn: todayDate(),
    startsAt: "",
    endsAt: "",
    notes: "",
  });

  useResetOnOpen(drawer !== null, () => setError(null));

  const activeChurchMembers = memberItems.filter((item) => item.status === "active");
  const pendingCalls = occurrenceItems.filter(
    (item) => item.status === "scheduled" && ((item.attendanceTotals?.unmarked ?? 0) > 0 || !item.attendanceClosedAt),
  );
  const nextOccurrence = occurrenceItems
    .filter((item) => item.status === "scheduled" && item.occursOn >= todayDate())
    .sort((a, b) => a.occursOn.localeCompare(b.occursOn))[0];

  const tenantMembers = useMemo(() => {
    const linked = new Set(memberItems.map((item) => item.memberId));
    return members
      .filter((member) => member.tenantId === membershipForm.tenantId && !linked.has(member.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, memberItems, membershipForm.tenantId]);

  const currentOccurrence = occurrenceItems.find((item) => item.id === selectedOccurrenceId) ?? occurrenceItems[0] ?? null;
  const attendanceSearchMatches = attendance.filter((item) =>
    `${item.memberName ?? ""} ${item.memberPhone ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredAttendance = attendanceSearchMatches.filter(
    (item) => !attendanceStatusFilter || item.status === attendanceStatusFilter,
  );
  const pagedAttendance = paginate(filteredAttendance, attendancePage, pageSize);
  const unmarkedCount = attendance.filter((item) => item.status === "unmarked").length;
  const markedCount = attendance.length - unmarkedCount;

  const membershipsForCounts = useMemo(() => {
    const query = memberFilters.query.toLowerCase();
    return memberItems.filter((membership) => {
      const matchesTenant = !memberFilters.tenantId || membership.tenantId === memberFilters.tenantId;
      const matchesQuery = `${membership.memberName ?? ""} ${membership.memberPhone ?? ""} ${membership.memberCity ?? ""} ${membership.caregiverName ?? ""}`
        .toLowerCase()
        .includes(query);
      return matchesTenant && matchesQuery;
    });
  }, [memberItems, memberFilters.tenantId, memberFilters.query]);
  const filteredMemberships = membershipsForCounts.filter(
    (membership) => !memberFilters.status || membership.status === memberFilters.status,
  );
  const pagedMemberships = paginate(filteredMemberships, memberPage, pageSize);

  const filteredMeetingTypes = useMemo(() => {
    return typeItems.filter((type) => {
      const matchesKind = !meetingFilters.recurrenceKind || type.recurrenceKind === meetingFilters.recurrenceKind;
      const matchesQuery = `${type.name} ${type.description} ${type.notes}`.toLowerCase().includes(meetingFilters.query.toLowerCase());
      return matchesKind && matchesQuery;
    });
  }, [meetingFilters, typeItems]);
  const pagedMeetingTypes = paginate(filteredMeetingTypes, typePage, pageSize);
  const filteredOccurrences = useMemo(() => {
    return occurrenceItems.filter((occurrence) => {
      const matchesType = !occurrenceFilters.meetingTypeId || occurrence.meetingTypeId === occurrenceFilters.meetingTypeId;
      const matchesStatus = !occurrenceFilters.status || occurrence.status === occurrenceFilters.status;
      return matchesType && matchesStatus;
    });
  }, [occurrenceFilters, occurrenceItems]);
  const pagedOccurrences = paginate(filteredOccurrences, occurrencePage, pageSize);

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
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    setSubmitting(false);
    if (!response.ok) {
      setError(await readApiError(response, "Não foi possível concluir a ação."));
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
    toast("Membro vinculado à Igreja.");
    setDrawer(null);
    await reloadAll();
    startTransition(() => router.refresh());
  }

  async function handleRegisterMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPhone = normalizePhone(newMemberForm.phone);
    if (normalizedPhone && (normalizedPhone.length !== 11 || normalizedPhone[2] !== "9")) {
      setError("Informe um WhatsApp válido com DDD, dígito 9 e os 8 números restantes.");
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
    toast("Pessoa cadastrada e vinculada à Igreja.");
    setDrawer(null);
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
    toast(nextStatus === "active" ? "Vínculo reativado." : "Vínculo inativado.");
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
    toast("Tipo de reunião criado. Use Gerar 8 semanas para preparar as chamadas.");
    setDrawer(null);
    await reloadAll();
  }

  async function generateOccurrences(meetingTypeId: string) {
    const generated = await submitJson<ChurchMeetingOccurrence[]>(`/api/church/meeting-types/${meetingTypeId}/generate-occurrences`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!generated) return;
    toast(`${plural(generated.length, "ocorrência preparada", "ocorrências preparadas")}.`);
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
    toast("Ocorrência criada.");
    setDrawer(null);
    await reloadAll();
  }

  async function openAttendance(occurrenceId: string) {
    const records = await submitJson<ChurchAttendanceRecord[]>(`/api/church/occurrences/${occurrenceId}/attendance`, { method: "GET" });
    if (!records) return;
    setSelectedOccurrenceId(occurrenceId);
    setAttendance(records);
    setAttendancePage(1);
    setSearch("");
    setAttendanceStatusFilter("");
    setActiveTab("attendance");
  }

  async function markAttendance(record: ChurchAttendanceRecord, status: ChurchAttendanceStatus) {
    const updated = await submitJson<ChurchAttendanceRecord>(`/api/church/occurrences/${record.occurrenceId}/attendance/${record.memberId}`, {
      method: "PUT",
      body: JSON.stringify({ status, notes: record.notes }),
    });
    if (!updated) return;
    setAttendance((current) =>
      current.map((item) =>
        item.id === record.id ? { ...item, ...updated, memberName: record.memberName, memberPhone: record.memberPhone } : item,
      ),
    );
  }

  async function closeAttendance() {
    if (!currentOccurrence) return;
    const closed = await submitJson<ChurchMeetingOccurrence>(`/api/church/occurrences/${currentOccurrence.id}/attendance/close`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!closed) return;
    toast("Chamada fechada.");
    await reloadAll();
  }

  function goToTab(tab: Tab) {
    setActiveTab(tab);
    setError(null);
  }

  let headerAction: ReactNode = null;
  let headerSecondary: ReactNode = null;
  if (activeTab === "overview") {
    headerAction = (
      <Button variant="primary" icon="check" disabled={!nextOccurrence || submitting} onClick={() => nextOccurrence && openAttendance(nextOccurrence.id)}>
        Fazer chamada
      </Button>
    );
  } else if (activeTab === "members") {
    headerAction = (
      <Button variant="primary" icon="plus" onClick={() => setDrawer("link")} disabled={tenants.length === 0}>
        Vincular membro
      </Button>
    );
  } else if (activeTab === "meetings") {
    headerAction = (
      <Button variant="primary" icon="plus" onClick={() => setDrawer("meetingType")} disabled={tenants.length === 0}>
        Novo tipo de reunião
      </Button>
    );
    headerSecondary = (
      <Button icon="plus" onClick={() => setDrawer("occurrence")} disabled={typeItems.length === 0}>
        Ocorrência avulsa
      </Button>
    );
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Igreja"
        subtitle="Quem reúne com a localidade, as reuniões e a chamada de presença."
        action={headerAction}
        secondary={headerSecondary}
      />

      <Tabs<Tab>
        label="Igreja"
        idPrefix="church"
        value={activeTab}
        onChange={goToTab}
        tabs={[
          { value: "overview", label: "Visão geral" },
          { value: "members", label: "Membros", count: activeChurchMembers.length },
          { value: "meetings", label: "Reuniões", count: typeItems.length },
          { value: "attendance", label: "Chamada" },
        ]}
      />

      {drawer === null ? <FormError>{error}</FormError> : null}

      <div role="tabpanel" id={`church-panel-${activeTab}`} aria-labelledby={`church-tab-${activeTab}`} className="grid gap-4">
        {activeTab === "overview" ? (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
              <Stat label="Membros ativos" value={activeChurchMembers.length} />
              <Stat label="Tipos de reunião" value={typeItems.length} />
              <Stat label="Ocorrências" value={occurrenceItems.length} />
              <Stat
                label="Chamadas pendentes"
                value={pendingCalls.length}
                tone={pendingCalls.length > 0 ? "alert" : "default"}
                note={pendingCalls.length > 0 ? "a conferir" : undefined}
              />
            </div>
            {typeItems.length === 0 ? (
              <EmptyState
                title="Nenhuma reunião cadastrada."
                reason="Cadastre o culto, a célula ou a EBD para começar a marcar presença."
                hint={<>Abra a aba Reuniões e use &quot;Novo tipo de reunião&quot;.</>}
                action={
                  <Button variant="primary" icon="plus" onClick={() => setDrawer("meetingType")} disabled={tenants.length === 0}>
                    Novo tipo de reunião
                  </Button>
                }
              />
            ) : (
              <Card>
                <CardHeader title="Próxima reunião" />
                <CardBody>
                  {nextOccurrence ? (
                    <OccurrenceRow occurrence={nextOccurrence} onOpenAttendance={() => openAttendance(nextOccurrence.id)} />
                  ) : (
                    <p className="text-muted">
                      Nenhuma reunião futura agendada. Use Gerar 8 semanas num tipo semanal, na aba Reuniões.
                    </p>
                  )}
                </CardBody>
              </Card>
            )}
          </>
        ) : null}

        {activeTab === "members" ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                label="Buscar membros da Igreja"
                placeholder="Buscar por nome, telefone, cidade ou cuidador"
                wrapperClassName="w-full min-[560px]:w-80"
                value={memberFilters.query}
                onChange={(event) => {
                  setMemberFilters((current) => ({ ...current, query: event.target.value }));
                  setMemberPage(1);
                }}
              />
              {tenants.length > 1 ? (
                <Select
                  aria-label="Localidade"
                  wrapperClassName="w-auto"
                  value={memberFilters.tenantId}
                  onChange={(event) => {
                    setMemberFilters((current) => ({ ...current, tenantId: event.target.value }));
                    setMemberPage(1);
                  }}
                  options={[{ value: "", label: "Todas as localidades" }, ...tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))]}
                />
              ) : null}
              {[
                { value: "", label: "Todos", count: membershipsForCounts.length },
                { value: "active", label: "Ativos", count: membershipsForCounts.filter((m) => m.status === "active").length },
                { value: "inactive", label: "Inativos", count: membershipsForCounts.filter((m) => m.status === "inactive").length },
              ].map((chip) => (
                <Chip
                  key={chip.value}
                  label={chip.label}
                  count={chip.count}
                  pressed={memberFilters.status === chip.value}
                  onClick={() => {
                    setMemberFilters((current) => ({ ...current, status: chip.value }));
                    setMemberPage(1);
                  }}
                />
              ))}
            </div>

            {memberItems.length === 0 ? (
              <EmptyState
                title="Ninguém vinculado à Igreja ainda."
                reason="Vincule assistidos que já reúnem com a localidade para acompanhar a presença deles."
                hint={<>Use &quot;Vincular membro&quot; no topo da página.</>}
              />
            ) : filteredMemberships.length === 0 ? (
              <EmptyState title="Ninguém com esses filtros." reason="Limpe a busca ou escolha outra situação." />
            ) : (
              <Card>
                <CardHeader title="Membros da Igreja" meta={<span role="status">{plural(filteredMemberships.length, "vínculo", "vínculos")}</span>} />
                <Table caption="Membros da Igreja" wrapperClassName="mt-2">
                  <thead>
                    <tr>
                      <Th>Pessoa</Th>
                      <Th>Situação</Th>
                      <Th>
                        <span className="sr-only">Ações</span>
                      </Th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedMemberships.items.map((membership) => (
                      <Tr key={membership.id}>
                        <Td>
                          <span className="flex items-center gap-2.5">
                            <Avatar name={membership.memberName ?? "Membro"} size="sm" />
                            <span>
                              <span className="block font-medium">{membership.memberName}</span>
                              <span className="block text-xs text-muted">
                                {[membership.memberPhone, membership.memberCity, membership.caregiverName].filter(Boolean).join(" · ")}
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td>
                          <Pill tone={membership.status === "active" ? "success" : "muted"}>
                            {membership.status === "active" ? "Ativo" : "Inativo"}
                          </Pill>
                        </Td>
                        <Td className="text-right">
                          <Button size="sm" disabled={submitting} onClick={() => toggleMembership(membership)}>
                            {membership.status === "active" ? "Inativar" : "Reativar"}
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
                <PaginationControls
                  page={memberPage}
                  totalPages={pagedMemberships.totalPages}
                  totalItems={filteredMemberships.length}
                  onPageChange={setMemberPage}
                />
              </Card>
            )}
          </>
        ) : null}

        {activeTab === "meetings" ? (
          <>
            {typeItems.length === 0 ? (
              <EmptyState
                title="Nenhum tipo de reunião ainda."
                reason="Um tipo descreve uma reunião que se repete, como o culto de quinta. Com ele você prepara as chamadas das próximas semanas."
                hint={<>Use &quot;Novo tipo de reunião&quot; no topo da página.</>}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <SearchInput
                    label="Buscar tipo de reunião"
                    placeholder="Buscar tipo de reunião"
                    wrapperClassName="w-full min-[560px]:w-64"
                    value={meetingFilters.query}
                    onChange={(event) => {
                      setMeetingFilters((current) => ({ ...current, query: event.target.value }));
                      setTypePage(1);
                    }}
                  />
                  {[
                    { value: "", label: "Todas", count: typeItems.length },
                    { value: "weekly", label: "Semanais", count: typeItems.filter((t) => t.recurrenceKind === "weekly").length },
                    { value: "none", label: "Avulsas", count: typeItems.filter((t) => t.recurrenceKind === "none").length },
                  ].map((chip) => (
                    <Chip
                      key={chip.value}
                      label={chip.label}
                      count={chip.count}
                      pressed={meetingFilters.recurrenceKind === chip.value}
                      onClick={() => {
                        setMeetingFilters((current) => ({ ...current, recurrenceKind: chip.value }));
                        setTypePage(1);
                      }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                  {pagedMeetingTypes.items.map((type) => (
                    <Card key={type.id}>
                      <CardBody className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <span aria-hidden="true" className="size-3 rounded-full" style={{ background: type.color }} />
                          <b className="font-semibold">{type.name}</b>
                        </div>
                        <p className="text-xs text-muted">
                          {type.recurrenceKind === "weekly" && type.weekday !== null
                            ? `Semanal · ${weekdays[type.weekday]?.label ?? ""}`
                            : "Avulsa"}
                          {type.startsAt ? ` · ${type.startsAt}` : ""}
                        </p>
                        {type.recurrenceKind === "weekly" ? (
                          <div>
                            <Button size="sm" disabled={submitting} onClick={() => generateOccurrences(type.id)}>
                              Gerar 8 semanas
                            </Button>
                          </div>
                        ) : null}
                      </CardBody>
                    </Card>
                  ))}
                </div>
                {filteredMeetingTypes.length === 0 ? (
                  <EmptyState title="Nenhum tipo com esses filtros." reason="Limpe a busca ou escolha outra recorrência." />
                ) : null}
                <PaginationControls
                  page={typePage}
                  totalPages={pagedMeetingTypes.totalPages}
                  totalItems={filteredMeetingTypes.length}
                  onPageChange={setTypePage}
                />

                <Card>
                  <CardHeader title="Próximas ocorrências" meta={plural(filteredOccurrences.length, "ocorrência", "ocorrências")} />
                  <CardBody className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        aria-label="Tipo de reunião"
                        wrapperClassName="w-auto"
                        value={occurrenceFilters.meetingTypeId}
                        onChange={(event) => {
                          setOccurrenceFilters((current) => ({ ...current, meetingTypeId: event.target.value }));
                          setOccurrencePage(1);
                        }}
                        options={[{ value: "", label: "Todos os tipos" }, ...typeItems.map((type) => ({ value: type.id, label: type.name }))]}
                      />
                      {[
                        { value: "", label: "Todas" },
                        { value: "scheduled", label: "Agendadas" },
                        { value: "completed", label: "Concluídas" },
                        { value: "cancelled", label: "Canceladas" },
                      ].map((chip) => (
                        <Chip
                          key={chip.value}
                          label={chip.label}
                          pressed={occurrenceFilters.status === chip.value}
                          onClick={() => {
                            setOccurrenceFilters((current) => ({ ...current, status: chip.value }));
                            setOccurrencePage(1);
                          }}
                        />
                      ))}
                    </div>
                    {pagedOccurrences.items.length === 0 ? (
                      <p className="text-muted">
                        Nenhuma ocorrência ainda. Use Gerar 8 semanas num tipo semanal ou &quot;Ocorrência avulsa&quot;.
                      </p>
                    ) : (
                      <div className="grid gap-2">
                        {pagedOccurrences.items.map((occurrence) => (
                          <OccurrenceRow key={occurrence.id} occurrence={occurrence} onOpenAttendance={() => openAttendance(occurrence.id)} />
                        ))}
                      </div>
                    )}
                    <PaginationControls
                      page={occurrencePage}
                      totalPages={pagedOccurrences.totalPages}
                      totalItems={filteredOccurrences.length}
                      onPageChange={setOccurrencePage}
                    />
                  </CardBody>
                </Card>
              </>
            )}
          </>
        ) : null}

        {activeTab === "attendance" ? (
          <Card>
            <CardHeader
              title="Chamada"
              meta={attendance.length > 0 ? <span className="font-mono">Progresso {markedCount}/{attendance.length}</span> : undefined}
              action={
                currentOccurrence && attendance.length > 0 ? (
                  <Button variant="primary" icon="check" disabled={submitting || unmarkedCount > 0} onClick={closeAttendance}>
                    Fechar chamada
                  </Button>
                ) : undefined
              }
            />
            <CardBody className="grid gap-3">
              {occurrenceItems.length === 0 ? (
                <EmptyState
                  title="Nenhuma ocorrência para a chamada."
                  reason="A chamada é feita numa ocorrência de reunião. Prepare as próximas semanas num tipo semanal."
                  hint={<>Na aba Reuniões, use &quot;Gerar 8 semanas&quot;.</>}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      aria-label="Ocorrência"
                      wrapperClassName="min-w-[240px]"
                      value={currentOccurrence?.id ?? selectedOccurrenceId}
                      onChange={(event) => openAttendance(event.target.value)}
                      options={occurrenceItems.map((item) => ({
                        value: item.id,
                        label: `${item.meetingTypeName ?? "Reunião"} · ${formatDate(item.occursOn)}`,
                      }))}
                    />
                    <SearchInput
                      label="Buscar na chamada"
                      placeholder="Buscar na chamada"
                      wrapperClassName="w-full min-[560px]:w-56"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setAttendancePage(1);
                      }}
                    />
                  </div>
                  {attendance.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip
                        label="Não conferidos"
                        count={unmarkedCount}
                        tone="alert"
                        pressed={attendanceStatusFilter === "unmarked"}
                        onClick={() => {
                          setAttendanceStatusFilter(attendanceStatusFilter === "unmarked" ? "" : "unmarked");
                          setAttendancePage(1);
                        }}
                      />
                      <span role="status" className="text-xs text-muted">
                        {unmarkedCount > 0 ? `${plural(unmarkedCount, "pessoa falta", "pessoas faltam")} conferir para fechar a chamada` : "Todos conferidos"}
                      </span>
                      {(["", "present", "absent", "justified"] as const).map((status) => (
                        <Chip
                          key={status || "all"}
                          label={status ? attendanceLabels[status] + "s" : "Todos"}
                          count={status ? attendanceSearchMatches.filter((item) => item.status === status).length : attendanceSearchMatches.length}
                          pressed={attendanceStatusFilter === status}
                          onClick={() => {
                            setAttendanceStatusFilter(status);
                            setAttendancePage(1);
                          }}
                        />
                      ))}
                    </div>
                  ) : null}

                  {attendance.length === 0 ? (
                    <EmptyState
                      title="Nenhuma chamada aberta."
                      reason="Escolha uma ocorrência acima, ou use Fazer chamada na visão geral, para listar quem deveria estar presente."
                    />
                  ) : filteredAttendance.length === 0 ? (
                    <p className="text-muted">Ninguém na chamada com os filtros atuais.</p>
                  ) : (
                    <ul className="m-0 grid list-none gap-2 p-0">
                      {pagedAttendance.items.map((record) => (
                        <li
                          key={record.id}
                          className="grid items-center gap-2 rounded-card border border-border bg-raised px-3 py-2.5 min-[720px]:grid-cols-[minmax(0,1fr)_auto]"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Avatar name={record.memberName ?? "Membro"} size="sm" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{record.memberName}</span>
                              <span className="block text-xs text-muted">
                                {record.memberPhone ?? "Sem telefone"} · {attendanceLabels[record.status]}
                              </span>
                            </span>
                          </span>
                          <Segmented<ChurchAttendanceStatus>
                            label={`Presença de ${record.memberName ?? "membro"}`}
                            value={record.status}
                            onChange={(status) => markAttendance(record, status === record.status ? "unmarked" : status)}
                            options={[
                              { value: "present", label: "Presente" },
                              { value: "absent", label: "Ausente" },
                              { value: "justified", label: "Justificado" },
                            ]}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                  <PaginationControls
                    page={attendancePage}
                    totalPages={pagedAttendance.totalPages}
                    totalItems={filteredAttendance.length}
                    onPageChange={setAttendancePage}
                  />
                </>
              )}
            </CardBody>
          </Card>
        ) : null}
      </div>

      <Drawer
        open={drawer === "link"}
        onClose={() => setDrawer(null)}
        title="Vincular membro"
        subtitle="Quem reúne com a localidade entra na chamada."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form={linkMode === "existing" ? "link-existing-form" : "link-new-form"} loading={submitting}>
              {linkMode === "existing" ? "Vincular à Igreja" : "Criar e vincular"}
            </Button>
          </>
        }
      >
        <Segmented<"existing" | "new">
          label="Origem da pessoa"
          value={linkMode}
          onChange={setLinkMode}
          options={[
            { value: "existing", label: "Já cadastrado" },
            { value: "new", label: "Nova pessoa" },
          ]}
        />
        {linkMode === "existing" ? (
          <form id="link-existing-form" onSubmit={handleLinkMember} className="grid gap-4">
            {tenants.length > 1 ? (
              <Select
                label="Localidade"
                value={membershipForm.tenantId}
                onChange={(event) => setMembershipForm((current) => ({ ...current, tenantId: event.target.value, memberId: "" }))}
                options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
                required
              />
            ) : null}
            <Select
              label="Assistido"
              value={membershipForm.memberId}
              onChange={(event) => setMembershipForm((current) => ({ ...current, memberId: event.target.value }))}
              options={tenantMembers.map((member) => ({
                value: member.id,
                label: `${member.name}${member.phone ? ` · ${formatPhone(member.phone)}` : ""}`,
              }))}
              placeholder="Selecione um assistido"
              required
              data-autofocus
            />
            <Input
              label="Reúne desde"
              type="date"
              value={membershipForm.startedAt}
              onChange={(event) => setMembershipForm((current) => ({ ...current, startedAt: event.target.value }))}
            />
            <Textarea
              label="Observações"
              value={membershipForm.notes}
              rows={2}
              onChange={(event) => setMembershipForm((current) => ({ ...current, notes: event.target.value }))}
            />
            <FormError>{error}</FormError>
          </form>
        ) : (
          <form id="link-new-form" onSubmit={handleRegisterMember} className="grid gap-4">
            {tenants.length > 1 ? (
              <Select
                label="Localidade"
                value={newMemberForm.tenantId}
                onChange={(event) => {
                  const tenant = tenants.find((item) => item.id === event.target.value);
                  setNewMemberForm((current) => ({ ...current, tenantId: event.target.value, city: tenant?.city ?? current.city }));
                }}
                options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
                required
              />
            ) : null}
            <Input
              label="Nome"
              value={newMemberForm.name}
              onChange={(event) => setNewMemberForm((current) => ({ ...current, name: event.target.value }))}
              required
              data-autofocus
            />
            <FormGrid>
              <Input
                label="WhatsApp"
                value={formatPhone(newMemberForm.phone)}
                onChange={(event) => setNewMemberForm((current) => ({ ...current, phone: normalizePhone(event.target.value) }))}
                placeholder="(00) 90000-0000"
                inputMode="tel"
                hint="DDD + 9 + oito números."
              />
              <Input
                label="Cidade"
                value={newMemberForm.city}
                onChange={(event) => setNewMemberForm((current) => ({ ...current, city: event.target.value }))}
              />
            </FormGrid>
            <Input
              label="Reúne desde"
              type="date"
              value={newMemberForm.startedAt}
              onChange={(event) => setNewMemberForm((current) => ({ ...current, startedAt: event.target.value }))}
            />
            <Textarea
              label="Observações"
              value={newMemberForm.notes}
              rows={2}
              onChange={(event) => setNewMemberForm((current) => ({ ...current, notes: event.target.value }))}
            />
            <FormError>{error}</FormError>
          </form>
        )}
      </Drawer>

      <Drawer
        open={drawer === "meetingType"}
        onClose={() => setDrawer(null)}
        title="Novo tipo de reunião"
        subtitle="Uma reunião que se repete, como o culto de quinta."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="meeting-type-form" loading={submitting}>
              Criar tipo
            </Button>
          </>
        }
      >
        <form id="meeting-type-form" onSubmit={handleCreateType} className="grid gap-4">
          <Input
            label="Nome"
            value={typeForm.name}
            onChange={(event) => setTypeForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Culto de quinta, Célula, EBD…"
            required
            data-autofocus
          />
          {tenants.length > 1 ? (
            <Select
              label="Localidade"
              value={typeForm.tenantId}
              onChange={(event) => setTypeForm((current) => ({ ...current, tenantId: event.target.value }))}
              options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
              required
            />
          ) : null}
          <Textarea
            label="Descrição"
            value={typeForm.description}
            rows={2}
            onChange={(event) => setTypeForm((current) => ({ ...current, description: event.target.value }))}
          />
          <FormGrid>
            <Select
              label="Recorrência"
              value={typeForm.recurrenceKind}
              onChange={(event) => setTypeForm((current) => ({ ...current, recurrenceKind: event.target.value as "none" | "weekly" }))}
              options={[
                { value: "weekly", label: "Semanal" },
                { value: "none", label: "Avulsa" },
              ]}
            />
            <Select
              label="Dia"
              value={typeForm.weekday}
              disabled={typeForm.recurrenceKind !== "weekly"}
              onChange={(event) => setTypeForm((current) => ({ ...current, weekday: event.target.value }))}
              options={weekdays}
            />
            <Input
              label="Início"
              type="time"
              value={typeForm.startsAt}
              onChange={(event) => setTypeForm((current) => ({ ...current, startsAt: event.target.value }))}
            />
            <Input
              label="Fim"
              type="time"
              value={typeForm.endsAt}
              onChange={(event) => setTypeForm((current) => ({ ...current, endsAt: event.target.value }))}
            />
            <Input
              label="Começa em"
              type="date"
              value={typeForm.recurrenceStartsOn}
              onChange={(event) => setTypeForm((current) => ({ ...current, recurrenceStartsOn: event.target.value }))}
            />
            <Input
              label="Termina em"
              type="date"
              value={typeForm.recurrenceEndsOn}
              onChange={(event) => setTypeForm((current) => ({ ...current, recurrenceEndsOn: event.target.value }))}
            />
          </FormGrid>
          <FormError>{error}</FormError>
        </form>
      </Drawer>

      <Drawer
        open={drawer === "occurrence"}
        onClose={() => setDrawer(null)}
        title="Ocorrência avulsa"
        subtitle="Uma data específica de um tipo de reunião."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="occurrence-form" loading={submitting}>
              Criar ocorrência
            </Button>
          </>
        }
      >
        <form id="occurrence-form" onSubmit={handleCreateOccurrence} className="grid gap-4">
          {tenants.length > 1 ? (
            <Select
              label="Localidade"
              value={occurrenceForm.tenantId}
              onChange={(event) => setOccurrenceForm((current) => ({ ...current, tenantId: event.target.value, meetingTypeId: "" }))}
              options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
              required
            />
          ) : null}
          <Select
            label="Tipo"
            value={occurrenceForm.meetingTypeId}
            onChange={(event) => setOccurrenceForm((current) => ({ ...current, meetingTypeId: event.target.value }))}
            options={typeItems.filter((item) => item.tenantId === occurrenceForm.tenantId).map((item) => ({ value: item.id, label: item.name }))}
            placeholder="Selecione o tipo"
            required
            data-autofocus
          />
          <Input
            label="Data"
            type="date"
            value={occurrenceForm.occursOn}
            onChange={(event) => setOccurrenceForm((current) => ({ ...current, occursOn: event.target.value }))}
            required
          />
          <FormGrid>
            <Input
              label="Início"
              type="time"
              value={occurrenceForm.startsAt}
              onChange={(event) => setOccurrenceForm((current) => ({ ...current, startsAt: event.target.value }))}
            />
            <Input
              label="Fim"
              type="time"
              value={occurrenceForm.endsAt}
              onChange={(event) => setOccurrenceForm((current) => ({ ...current, endsAt: event.target.value }))}
            />
          </FormGrid>
          <Textarea
            label="Observações"
            value={occurrenceForm.notes}
            rows={2}
            onChange={(event) => setOccurrenceForm((current) => ({ ...current, notes: event.target.value }))}
          />
          <FormError>{error}</FormError>
        </form>
      </Drawer>
    </div>
  );
}

function OccurrenceRow({ occurrence, onOpenAttendance }: Readonly<{ occurrence: ChurchMeetingOccurrence; onOpenAttendance: () => void }>) {
  const tone = occurrence.status === "completed" ? "success" : occurrence.status === "cancelled" ? "muted" : "primary";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-raised px-3.5 py-3">
      <div>
        <b className="font-semibold">{occurrence.meetingTypeName ?? "Reunião"}</b>
        <p className="text-xs text-muted">
          {formatDate(occurrence.occursOn)}
          {occurrence.startsAt ? ` · ${occurrence.startsAt}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={tone}>{occurrenceStatusLabels[occurrence.status]}</Pill>
        {occurrence.attendanceClosedAt ? <Pill tone="success">Chamada fechada</Pill> : null}
        <Button size="sm" onClick={onOpenAttendance}>
          Fazer chamada
        </Button>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function paginate<T>(items: T[], page: number, size: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * size;
  return {
    items: items.slice(start, start + size),
    totalPages,
  };
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: Readonly<{
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}>) {
  if (totalItems <= pageSize) return null;

  const safePage = Math.min(Math.max(page, 1), totalPages);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <span className="text-xs text-muted">
        Página {safePage} de {totalPages} · {plural(totalItems, "resultado", "resultados")}
      </span>
      <div className="flex gap-2">
        <Button size="sm" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>
          Anterior
        </Button>
        <Button size="sm" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}
