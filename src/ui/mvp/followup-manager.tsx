"use client";

import { startTransition, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Followup, Member, Tenant } from "@/server/domain/mvp";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Drawer,
  EmptyState,
  Icon,
  Input,
  NeedsChip,
  PageHeader,
  Pill,
  SearchInput,
  Select,
  Tabs,
  Textarea,
  cx,
  useToast,
} from "@/ui/atalaia";
import {
  FOLLOWUP_TYPES,
  FOLLOWUP_TYPE_LABEL,
  FormError,
  FormGrid,
  fmtDate,
  fmtTime,
  plural,
  readApiError,
  shortName,
  toDateTimeLocal,
  useResetOnOpen,
} from "@/ui/gestao";

type FollowupFormState = {
  tenantId: string;
  memberId: string;
  caregiverId: string;
  type: Followup["type"];
  occurredAt: string;
  nextActionAt: string;
  notes: string;
};

function emptyForm(memberId: string, members: Member[]): FollowupFormState {
  const member = members.find((item) => item.id === memberId);
  return {
    tenantId: member?.tenantId ?? "",
    memberId,
    caregiverId: member?.caregiverId ?? "",
    type: "call",
    occurredAt: toDateTimeLocal(new Date().toISOString()),
    nextActionAt: "",
    notes: "",
  };
}

function formFromFollowup(followup: Followup): FollowupFormState {
  return {
    tenantId: followup.tenantId,
    memberId: followup.memberId,
    caregiverId: followup.caregiverId ?? "",
    type: followup.type,
    occurredAt: toDateTimeLocal(followup.occurredAt),
    nextActionAt: toDateTimeLocal(followup.nextActionAt),
    notes: followup.notes,
  };
}

/** Compromissos criados pela agenda guardam título, duração e local dentro das notas. */
function parseScheduledNotes(notesText: string, defaultType: string) {
  const isScheduled = notesText.startsWith("Agendado:");
  if (!isScheduled) {
    return { isScheduled: false, title: `Acompanhamento: ${defaultType}`, duration: "", location: "", notes: notesText };
  }

  const titleMatch = notesText.match(/📌 Título:\s*(.*)/);
  const durationMatch = notesText.match(/⏱️ Duração:\s*(.*)/);
  const locationMatch = notesText.match(/📍 Local:\s*(.*)/);
  const notesMatch = notesText.match(/📝 Notas:\s*([\s\S]*)/);

  return {
    isScheduled: true,
    title: titleMatch ? titleMatch[1].trim() : "Compromisso",
    duration: durationMatch ? durationMatch[1].trim() : "",
    location: locationMatch ? locationMatch[1].trim() : "",
    notes: notesMatch ? notesMatch[1].trim() : "",
  };
}

type FollowupFormDrawerProps = Readonly<{
  open: boolean;
  onClose: () => void;
  /** Acompanhamento em edição; `null` registra um novo. */
  followup: Followup | null;
  /** Pessoa pré-selecionada ao registrar um novo. */
  defaultMemberId?: string;
  /** Impede trocar a pessoa (registro feito a partir do perfil dela). */
  lockMember?: boolean;
  tenants?: Tenant[];
  members: Member[];
  caregivers: Caregiver[];
  /** Chamado depois de salvar e antes de fechar. */
  onSaved?: () => void;
}>;

/** Drawer de registro/edição de acompanhamento (mesmo contrato da API de antes). */
export function FollowupFormDrawer({
  open,
  onClose,
  followup,
  defaultMemberId,
  lockMember = false,
  tenants = [],
  members,
  caregivers,
  onSaved,
}: FollowupFormDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<FollowupFormState>(() => emptyForm(defaultMemberId ?? "", members));
  const [memberQuery, setMemberQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useResetOnOpen(open, () => {
    setForm(followup ? formFromFollowup(followup) : emptyForm(defaultMemberId ?? "", members));
    setMemberQuery("");
    setSubmitting(false);
    setError(null);
  });

  const tenantNameById = useMemo(() => new Map(tenants.map((tenant) => [tenant.id, tenant.name])), [tenants]);
  const memberOptions = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();
    return members
      .filter((member) => member.id === form.memberId || !query || member.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((member) => ({
        value: member.id,
        label: tenants.length > 1 ? `${member.name} · ${tenantNameById.get(member.tenantId) ?? ""}` : member.name,
      }));
  }, [members, memberQuery, form.memberId, tenants.length, tenantNameById]);
  const caregiverOptions = useMemo(
    () => caregivers.filter((caregiver) => !form.tenantId || caregiver.tenantId === form.tenantId),
    [caregivers, form.tenantId],
  );

  function selectMember(memberId: string) {
    const member = members.find((item) => item.id === memberId);
    setForm((current) => ({
      ...current,
      memberId,
      tenantId: member?.tenantId ?? current.tenantId,
      caregiverId: member?.caregiverId ?? "",
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.memberId) {
      setError("Escolha a pessoa acompanhada.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const response = await fetch(followup ? `/api/followups/${followup.id}` : "/api/followups", {
      method: followup ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: form.tenantId,
        memberId: form.memberId,
        caregiverId: form.caregiverId || null,
        type: form.type,
        occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : undefined,
        nextActionAt: form.nextActionAt ? new Date(form.nextActionAt).toISOString() : null,
        notes: form.notes,
      }),
    });

    setSubmitting(false);
    if (!response.ok) {
      setError(await readApiError(response, "Não foi possível salvar o acompanhamento."));
      return;
    }

    toast(followup ? "Acompanhamento atualizado." : "Acompanhamento registrado.");
    onSaved?.();
    onClose();
    startTransition(() => router.refresh());
  }

  const memberName = members.find((member) => member.id === form.memberId)?.name;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={followup ? "Editar acompanhamento" : "Registrar acompanhamento"}
      subtitle={lockMember ? memberName : "Registre cada ação de cuidado e a próxima movimentação."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="followup-form" loading={submitting}>
            {followup ? "Salvar alterações" : "Salvar acompanhamento"}
          </Button>
        </>
      }
    >
      <form id="followup-form" onSubmit={handleSubmit} className="grid gap-4" noValidate>
        {!lockMember ? (
          <div className="grid gap-2">
            <SearchInput
              label="Buscar pessoa"
              placeholder="Buscar pessoa pelo nome"
              value={memberQuery}
              onChange={(event) => setMemberQuery(event.target.value)}
            />
            <Select
              label="Pessoa acompanhada"
              value={form.memberId}
              onChange={(event) => selectMember(event.target.value)}
              options={memberOptions}
              placeholder="Escolha a pessoa"
              required
              data-autofocus
            />
          </div>
        ) : null}

        <fieldset className="m-0 grid gap-1.5 border-0 p-0">
          <legend className="mb-1.5 text-xs font-semibold text-muted">Tipo</legend>
          <div className="grid grid-cols-5 gap-1.5 max-[420px]:grid-cols-3">
            {FOLLOWUP_TYPES.map((type) => {
              const selected = form.type === type;
              return (
                <label
                  key={type}
                  className={cx(
                    "grid cursor-pointer justify-items-center gap-1 rounded-md border px-1 py-2 text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                    selected ? "border-primary bg-primary-soft text-primary" : "border-border text-fg hover:bg-sunken",
                  )}
                >
                  <Icon name={type} size={18} />
                  <input
                    type="radio"
                    name="followup-type"
                    value={type}
                    checked={selected}
                    onChange={() => setForm((current) => ({ ...current, type }))}
                    className="sr-only"
                  />
                  {FOLLOWUP_TYPE_LABEL[type]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <FormGrid>
          <Input
            label="Quando aconteceu"
            type="datetime-local"
            value={form.occurredAt}
            onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))}
          />
          <Input
            label="Próxima ação"
            type="datetime-local"
            value={form.nextActionAt}
            hint="Entra no painel como próxima ação."
            onChange={(event) => setForm((current) => ({ ...current, nextActionAt: event.target.value }))}
          />
        </FormGrid>

        <Select
          label="Cuidador"
          value={form.caregiverId}
          onChange={(event) => setForm((current) => ({ ...current, caregiverId: event.target.value }))}
          options={[{ value: "", label: "Sem cuidador" }, ...caregiverOptions.map((c) => ({ value: c.id, label: c.name }))]}
        />

        <Textarea
          label="O que foi conversado"
          value={form.notes}
          rows={4}
          placeholder="Como foi a conversa, como a pessoa está, próximos passos…"
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
        />

        <FormError>{error}</FormError>
      </form>
    </Drawer>
  );
}

type Tab = "history" | "schedule";

export function FollowupManager({
  followups,
  tenants,
  members,
  caregivers,
  initialMemberId,
  title,
  subtitle,
}: Readonly<{
  followups: Followup[];
  tenants: Tenant[];
  members: Member[];
  caregivers: Caregiver[];
  initialMemberId?: string;
  /** Com título, o gerenciador mostra o próprio cabeçalho de página (com a ação primária). */
  title?: string;
  subtitle?: string;
}>) {
  const [editing, setEditing] = useState<Followup | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initialMemberId && members.some((m) => m.id === initialMemberId)));
  const [tab, setTab] = useState<Tab>("history");
  const [typeFilter, setTypeFilter] = useState<Followup["type"] | "">("");
  const [needsOnly, setNeedsOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [now] = useState(() => new Date());

  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  const { history, scheduled, overdueIds } = useMemo(() => {
    const latestByMember = new Map<string, Followup>();
    for (const followup of followups) {
      const current = latestByMember.get(followup.memberId);
      if (!current || new Date(followup.occurredAt) > new Date(current.occurredAt)) {
        latestByMember.set(followup.memberId, followup);
      }
    }
    const overdue = new Set<string>();
    for (const followup of latestByMember.values()) {
      const member = membersById.get(followup.memberId);
      if (followup.nextActionAt && new Date(followup.nextActionAt) <= now && member?.status !== "inactive") {
        overdue.add(followup.id);
      }
    }
    return {
      history: [...followups]
        .filter((f) => !f.nextActionAt || new Date(f.nextActionAt) <= now)
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
      scheduled: [...followups]
        .filter((f) => f.nextActionAt && new Date(f.nextActionAt) > now)
        .sort((a, b) => new Date(a.nextActionAt!).getTime() - new Date(b.nextActionAt!).getTime()),
      overdueIds: overdue,
    };
  }, [followups, membersById, now]);

  const base = tab === "history" ? history : scheduled;
  const needle = query.trim().toLowerCase();
  const visible = base.filter(
    (f) =>
      (!typeFilter || f.type === typeFilter) &&
      (!needsOnly || overdueIds.has(f.id)) &&
      (!needle || `${f.member ?? ""} ${f.notes}`.toLowerCase().includes(needle)),
  );
  const typeCount = (type: Followup["type"]) => base.filter((f) => f.type === type).length;

  function openNew() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(followup: Followup) {
    setEditing(followup);
    setDrawerOpen(true);
  }

  const createButton = (
    <Button variant="primary" icon="plus" onClick={openNew}>
      Registrar acompanhamento
    </Button>
  );

  return (
    <div className="grid gap-4">
      {title ? (
        <PageHeader title={title} subtitle={subtitle} action={createButton} />
      ) : (
        <div className="flex justify-end">{createButton}</div>
      )}

      <Tabs<Tab>
        className="overflow-y-hidden"
        label="Acompanhamentos"
        idPrefix="followups"
        value={tab}
        onChange={(next) => {
          setTab(next);
          if (next === "schedule") setNeedsOnly(false);
        }}
        tabs={[
          { value: "history", label: "Histórico", count: history.length },
          { value: "schedule", label: "Programação", count: scheduled.length },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          label="Buscar acompanhamentos"
          placeholder="Buscar por pessoa ou nota"
          wrapperClassName="w-full min-[560px]:w-64"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {tab === "history" ? (
          <NeedsChip count={overdueIds.size} pressed={needsOnly} onClick={() => setNeedsOnly((current) => !current)} />
        ) : null}
        <Chip label="Todos" count={base.length} pressed={!typeFilter} onClick={() => setTypeFilter("")} />
        {FOLLOWUP_TYPES.map((type) => (
          <Chip
            key={type}
            label={FOLLOWUP_TYPE_LABEL[type]}
            count={typeCount(type)}
            pressed={typeFilter === type}
            onClick={() => setTypeFilter(typeFilter === type ? "" : type)}
          />
        ))}
      </div>

      <div role="tabpanel" id={`followups-panel-${tab}`} aria-labelledby={`followups-tab-${tab}`}>
        {followups.length === 0 ? (
          <EmptyState
            title="Nenhum acompanhamento registrado."
            reason="Cada ligação, visita ou oração com um assistido vira uma linha aqui, e a próxima ação aparece no painel."
            hint={<>Use &quot;Registrar acompanhamento&quot; para criar o primeiro.</>}
            action={createButton}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title={tab === "history" ? "Nada no histórico com esses filtros." : "Nenhuma programação pendente."}
            reason={
              tab === "history"
                ? "Limpe a busca ou escolha outro tipo para ver mais registros."
                : "Ao registrar um acompanhamento com data em Próxima ação, ele aparece aqui."
            }
            action={
              typeFilter || needsOnly || query ? (
                <Button
                  onClick={() => {
                    setTypeFilter("");
                    setNeedsOnly(false);
                    setQuery("");
                  }}
                >
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Card>
            <p className="px-4 pt-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted" role="status">
              {plural(visible.length, "registro", "registros")}
            </p>
            <ul className="m-0 list-none p-0">
              {visible.map((followup) => {
                const member = membersById.get(followup.memberId);
                const overdue = overdueIds.has(followup.id);
                const parsed = parseScheduledNotes(followup.notes, FOLLOWUP_TYPE_LABEL[followup.type]);
                return (
                  <li key={followup.id} className="border-t border-border first:border-t-0">
                    <button
                      type="button"
                      onClick={() => openEdit(followup)}
                      className="grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-0 bg-transparent px-4 py-3 text-left text-fg hover:bg-sunken min-[720px]:grid-cols-[auto_minmax(0,1fr)_auto]"
                    >
                      <Avatar name={followup.member ?? ""} />
                      <span className="grid min-w-0 gap-0.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <b className="font-semibold">{followup.member ?? "Sem pessoa"}</b>
                          {member?.isUrgent ? <Pill tone="danger">Urgente</Pill> : null}
                          <Pill tone="neutral" dot={false}>
                            <Icon name={followup.type} size={12} />
                            {FOLLOWUP_TYPE_LABEL[followup.type]}
                          </Pill>
                          {overdue ? <Pill tone="danger">Ação atrasada</Pill> : null}
                        </span>
                        {parsed.isScheduled ? (
                          <span className="text-[13px] font-medium">{parsed.title}</span>
                        ) : null}
                        {parsed.notes ? (
                          <span className="line-clamp-2 text-[13px] text-muted">{parsed.notes}</span>
                        ) : null}
                        {parsed.isScheduled && (parsed.location || parsed.duration) ? (
                          <span className="text-xs text-subtle">
                            {[parsed.location, parsed.duration].filter(Boolean).join(" · ")}
                          </span>
                        ) : null}
                      </span>
                      <span className="col-start-2 grid gap-0.5 text-xs text-muted min-[720px]:col-start-3 min-[720px]:justify-items-end">
                        <span>
                          {tab === "schedule" && followup.nextActionAt ? "Para " : "Aconteceu "}
                          <span className="font-mono text-fg">
                            {tab === "schedule" && followup.nextActionAt
                              ? `${fmtDate(followup.nextActionAt)} ${fmtTime(followup.nextActionAt)}`
                              : fmtDate(followup.occurredAt)}
                          </span>
                        </span>
                        {tab === "history" && followup.nextActionAt ? (
                          <span>
                            Próxima <span className="font-mono">{fmtDate(followup.nextActionAt)}</span>
                          </span>
                        ) : null}
                        {followup.caregiver ? <span>{shortName(followup.caregiver)}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      <FollowupFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        followup={editing}
        defaultMemberId={
          editing ? editing.memberId : initialMemberId && members.some((m) => m.id === initialMemberId) ? initialMemberId : ""
        }
        tenants={tenants}
        members={members}
        caregivers={caregivers}
      />
    </div>
  );
}
