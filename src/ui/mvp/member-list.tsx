"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Followup, Member, SpiritualTemperature, Tenant } from "@/server/domain/mvp";
import type { MemberListingFilters } from "@/lib/listing-filters";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Drawer,
  EmptyState,
  Field,
  NeedsChip,
  PageHeader,
  Pill,
  Segmented,
  SearchInput,
  Select,
  StatusPill,
  Table,
  TempPill,
  Td,
  Textarea,
  Th,
  Tr,
  buttonClass,
  Input,
  useToast,
} from "@/ui/atalaia";
import {
  FollowupTimeline,
  FormError,
  Kv,
  Notice,
  SectionLabel,
  dayDiff,
  fmtDate,
  fmtDay,
  plural,
  readApiError,
  relDay,
  shortName,
  FOLLOWUP_TYPE_LABEL,
} from "@/ui/gestao";
import { groupSelectedMembersByCaregiver } from "@/ui/mvp/member-communication-utils";
import { MEMBER_STATUS_LABEL, MemberFormDrawer, TEMPERATURE_LABEL } from "@/ui/mvp/member-manager";
import { FollowupFormDrawer } from "@/ui/mvp/followup-manager";

export type MemberDrawerRequest = { kind: "new" } | { kind: "edit"; memberId: string } | { kind: "view"; memberId: string };

type Pagination = { page: number; totalPages: number; totalItems: number; pageSize: number };

type Drawer =
  | { kind: "new" }
  | { kind: "view"; memberId: string }
  | { kind: "edit"; memberId: string }
  | { kind: "followup"; memberId: string }
  | { kind: "communication" }
  | null;

type MemberPatch = Partial<Pick<Member, "status" | "spiritualTemperature" | "caregiverId" | "caregiver">>;

const BASE_PATH = "/coord/membros";
const NO_PATCHES: Record<string, MemberPatch> = {};
const STATUS_ORDER: Array<Member["status"]> = ["new", "in_progress", "consolidated", "inactive"];

export function MemberList({
  members,
  focusMember,
  tenants,
  caregivers,
  followups,
  filters,
  statusCounts,
  needsReasons,
  needsOnly,
  pagination,
  exportHref,
  initialDrawer,
}: Readonly<{
  /** Assistidos da página atual (já filtrados e paginados no servidor). */
  members: Member[];
  /** Assistido aberto por `?editar=`/`?ver=`, mesmo que esteja fora da página atual. */
  focusMember: Member | null;
  tenants: Tenant[];
  caregivers: Caregiver[];
  followups: Followup[];
  filters: MemberListingFilters;
  statusCounts: Record<Member["status"], number>;
  /** Motivos pelos quais cada assistido "precisa de alguém" (id -> frases curtas). */
  needsReasons: Record<string, string[]>;
  needsOnly: boolean;
  pagination: Pagination;
  exportHref: string;
  initialDrawer: MemberDrawerRequest | null;
}>) {
  const router = useRouter();
  const { toast } = useToast();
  const [drawer, setDrawer] = useState<Drawer>(initialDrawer);
  const urlCleaned = useRef(initialDrawer === null);
  const [query, setQuery] = useState(filters.name ?? "");
  const [moreOpen, setMoreOpen] = useState(
    Boolean(filters.city || filters.dateFrom || filters.dateTo || filters.description),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patchState, setPatchState] = useState<{ base: Member[]; map: Record<string, MemberPatch> }>({
    base: members,
    map: {},
  });
  const [now] = useState(() => new Date());

  const patches = patchState.base === members ? patchState.map : NO_PATCHES;
  const rows = useMemo(() => members.map((member) => ({ ...member, ...patches[member.id] })), [members, patches]);

  const membersById = useMemo(() => {
    const map = new Map<string, Member>();
    for (const member of rows) map.set(member.id, member);
    if (focusMember && !map.has(focusMember.id)) map.set(focusMember.id, { ...focusMember, ...patches[focusMember.id] });
    return map;
  }, [rows, focusMember, patches]);

  const followupsByMember = useMemo(() => {
    const map = new Map<string, Followup[]>();
    for (const followup of followups) {
      const list = map.get(followup.memberId) ?? [];
      list.push(followup);
      map.set(followup.memberId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    }
    return map;
  }, [followups]);

  const tenantsById = useMemo(() => new Map(tenants.map((tenant) => [tenant.id, tenant])), [tenants]);
  const needsCount = Object.keys(needsReasons).length;
  const totalByStatus = STATUS_ORDER.reduce((sum, status) => sum + statusCounts[status], 0);
  const hasActiveFilters = Boolean(
    filters.name || filters.city || filters.tenantId || filters.caregiverId || filters.dateFrom || filters.dateTo || filters.description || filters.status || filters.spiritualTemperature || needsOnly,
  );

  function buildHref(patch: Record<string, string | undefined | null>, options: { keepPage?: boolean; drawer?: Record<string, string> } = {}) {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      name: filters.name,
      city: filters.city,
      tenantId: filters.tenantId,
      caregiverId: filters.caregiverId,
      status: filters.status || undefined,
      spiritualTemperature: filters.spiritualTemperature || undefined,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      description: filters.description,
      needs: needsOnly ? "1" : undefined,
      pageSize: String(pagination.pageSize),
      page: options.keepPage && pagination.page > 1 ? String(pagination.page) : undefined,
    };
    for (const [key, value] of Object.entries({ ...current, ...patch })) {
      if (value) params.set(key, value);
    }
    for (const [key, value] of Object.entries(options.drawer ?? {})) params.set(key, value);
    const text = params.toString();
    return text ? `${BASE_PATH}?${text}` : BASE_PATH;
  }

  function go(patch: Record<string, string | undefined | null>) {
    setSelectedIds([]);
    router.push(buildHref(patch));
  }

  function clearFilters() {
    setQuery("");
    setSelectedIds([]);
    router.push(BASE_PATH);
  }

  function closeDrawer() {
    setDrawer(null);
    setError(null);
    if (!urlCleaned.current) {
      urlCleaned.current = true;
      router.replace(buildHref({}, { keepPage: true }));
    }
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  function patchMember(memberId: string, patch: MemberPatch) {
    setPatchState((current) => ({
      base: members,
      map: { ...(current.base === members ? current.map : {}), [memberId]: { ...(current.base === members ? current.map[memberId] : undefined), ...patch } },
    }));
  }

  async function updateMember(
    memberId: string,
    request: { url: string; method: string; body: unknown; failure: string; success: string },
    patch: MemberPatch,
  ) {
    setBusy(true);
    setError(null);
    const response = await fetch(request.url, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.body),
    });
    setBusy(false);
    if (!response.ok) {
      setError(await readApiError(response, request.failure));
      return;
    }
    patchMember(memberId, patch);
    toast(request.success);
    refresh();
  }

  function setStatus(member: Member, status: Member["status"]) {
    if (status === member.status) return;
    void updateMember(
      member.id,
      {
        url: `/api/members/${member.id}/status`,
        method: "PATCH",
        body: { status },
        failure: "Não foi possível atualizar a situação.",
        success: "Situação atualizada.",
      },
      { status },
    );
  }

  function setTemperature(member: Member, temperature: SpiritualTemperature) {
    if (temperature === member.spiritualTemperature) return;
    void updateMember(
      member.id,
      {
        url: `/api/members/${member.id}/spiritual-temperature`,
        method: "PATCH",
        body: { spiritualTemperature: temperature },
        failure: "Não foi possível atualizar a temperatura.",
        success: "Temperatura atualizada.",
      },
      { spiritualTemperature: temperature },
    );
  }

  function assignCaregiver(member: Member, caregiverId: string) {
    const caregiver = caregivers.find((item) => item.id === caregiverId);
    void updateMember(
      member.id,
      {
        url: `/api/members/${member.id}/assign-caregiver`,
        method: "POST",
        body: { caregiverId: caregiverId || null },
        failure: "Não foi possível atribuir o cuidador.",
        success: caregiverId ? "Cuidador atribuído." : "Cuidador removido.",
      },
      { caregiverId: caregiverId || null, caregiver: caregiver?.name ?? null },
    );
  }

  async function removeMember(member: Member) {
    const confirmed = window.confirm(
      `Excluir o assistido "${member.name}"? Os acompanhamentos vinculados também serão removidos.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    const response = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      setError(await readApiError(response, "Não foi possível excluir o assistido."));
      return;
    }
    toast("Assistido excluído.");
    closeDrawer();
    refresh();
  }

  const communication = useMemo(
    () => groupSelectedMembersByCaregiver(rows, caregivers, selectedIds),
    [rows, caregivers, selectedIds],
  );

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch {
      toast("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.", { tone: "error" });
    }
  }

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const activeMember = drawer && "memberId" in drawer ? (membersById.get(drawer.memberId) ?? null) : null;
  const newButton = (
    <Button variant="primary" icon="plus" onClick={() => setDrawer({ kind: "new" })}>
      Novo assistido
    </Button>
  );

  const hasAnyMember = totalByStatus > 0 || rows.length > 0;

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Assistidos"
        subtitle="Pessoas em acompanhamento pastoral contínuo."
        secondary={
          <a className={buttonClass("neutral")} href={exportHref} download>
            Exportar CSV
          </a>
        }
        action={newButton}
      />

      {!hasAnyMember && !hasActiveFilters ? (
        <EmptyState
          title="Nenhum assistido ainda."
          reason="Um contato em acompanhamento vira assistido pelo botão Converter, no próprio contato. Você também pode cadastrar direto."
          hint={<>Use &quot;Novo assistido&quot; para cadastrar a primeira pessoa.</>}
          action={
            <>
              {newButton}
              <Button href="/coord/contatos">Ir para contatos</Button>
            </>
          }
        />
      ) : (
        <>
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <form
                role="search"
                className="w-full min-[560px]:w-72"
                onSubmit={(event) => {
                  event.preventDefault();
                  go({ name: query.trim() || undefined });
                }}
              >
                <SearchInput
                  label="Buscar assistidos"
                  placeholder="Buscar por nome"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </form>
              <Segmented<SpiritualTemperature | "">
                label="Temperatura"
                value={filters.spiritualTemperature ?? ""}
                onChange={(value) => go({ spiritualTemperature: value || undefined })}
                options={[
                  { value: "", label: "Todas" },
                  { value: "cold", label: "Frio" },
                  { value: "warm", label: "Morno" },
                  { value: "hot", label: "Quente" },
                ]}
              />
              {tenants.length > 1 ? (
                <Select
                  aria-label="Localidade"
                  wrapperClassName="w-auto"
                  value={filters.tenantId ?? ""}
                  onChange={(event) => go({ tenantId: event.target.value || undefined, caregiverId: undefined })}
                  options={[{ value: "", label: "Todas as localidades" }, ...tenants.map((t) => ({ value: t.id, label: t.name }))]}
                />
              ) : null}
              <Select
                aria-label="Cuidador"
                wrapperClassName="w-auto"
                value={filters.caregiverId ?? ""}
                onChange={(event) => go({ caregiverId: event.target.value || undefined })}
                options={[
                  { value: "", label: "Todos os cuidadores" },
                  ...caregivers
                    .filter((c) => !filters.tenantId || c.tenantId === filters.tenantId)
                    .map((c) => ({ value: c.id, label: shortName(c.name) })),
                ]}
              />
              <Button variant="ghost" icon="filter" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
                Mais filtros
              </Button>
            </div>

            {moreOpen ? (
              <Card>
                <CardBody>
                  <form
                    className="grid gap-3 min-[720px]:grid-cols-[repeat(4,minmax(0,1fr))_auto] min-[720px]:items-end"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      go({
                        city: String(data.get("city") ?? "").trim() || undefined,
                        description: String(data.get("description") ?? "").trim() || undefined,
                        dateFrom: String(data.get("dateFrom") ?? "") || undefined,
                        dateTo: String(data.get("dateTo") ?? "") || undefined,
                      });
                    }}
                  >
                    <Input name="city" label="Cidade" defaultValue={filters.city ?? ""} />
                    <Input name="description" label="Observação contém" defaultValue={filters.description ?? ""} />
                    <Input name="dateFrom" label="Cadastrado de" type="date" defaultValue={filters.dateFrom ?? ""} />
                    <Input name="dateTo" label="até" type="date" defaultValue={filters.dateTo ?? ""} />
                    <Button type="submit">Aplicar</Button>
                  </form>
                </CardBody>
              </Card>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <NeedsChip
                count={needsCount}
                pressed={needsOnly}
                onClick={() => go({ needs: needsOnly ? undefined : "1" })}
              />
              <Chip label="Todos" count={totalByStatus} pressed={!filters.status} onClick={() => go({ status: undefined })} />
              {STATUS_ORDER.map((status) => (
                <Chip
                  key={status}
                  label={MEMBER_STATUS_LABEL[status]}
                  count={statusCounts[status]}
                  pressed={filters.status === status}
                  onClick={() => go({ status: filters.status === status ? undefined : status })}
                />
              ))}
              {hasActiveFilters ? (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              ) : null}
            </div>
          </div>

          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-sunken px-3.5 py-2.5">
              <span role="status" className="text-[13px] font-semibold">
                {plural(selectedIds.length, "assistido selecionado", "assistidos selecionados")}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => setDrawer({ kind: "communication" })}>
                  Gerar comunicado
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                  Limpar seleção
                </Button>
              </div>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <EmptyState
              title="Ninguém com esses filtros."
              reason="Nenhum assistido combina com a busca. Limpe os filtros ou escolha outra situação."
              action={<Button onClick={clearFilters}>Limpar filtros</Button>}
            />
          ) : (
            <Card>
              <CardHeader
                title="Todos os assistidos"
                meta={<span role="status">{plural(pagination.totalItems, "assistido", "assistidos")}</span>}
              />
              <Table caption="Assistidos" wrapperClassName="mt-2">
                <thead>
                  <tr>
                    <Th className="w-9">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todos desta página"
                        checked={allSelected}
                        onChange={() => setSelectedIds(allSelected ? [] : rows.map((member) => member.id))}
                        className="size-4 accent-[var(--primary)]"
                      />
                    </Th>
                    <Th>Nome</Th>
                    <Th>Idade</Th>
                    <Th>Bairro</Th>
                    <Th>Temperatura</Th>
                    <Th>Situação</Th>
                    <Th>Cuidador</Th>
                    <Th>Último acompanhamento</Th>
                    <Th>Próxima ação</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((member) => {
                    const list = followupsByMember.get(member.id) ?? [];
                    const last = list[0];
                    const nextAction = last?.nextActionAt ?? null;
                    const late = Boolean(nextAction && member.status !== "inactive" && dayDiff(nextAction, now) < 0);
                    const reasons = needsReasons[member.id] ?? [];
                    return (
                      <Tr key={member.id} onActivate={() => setDrawer({ kind: "view", memberId: member.id })}>
                        <Td onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Selecionar ${member.name}`}
                            checked={selectedIds.includes(member.id)}
                            onChange={() =>
                              setSelectedIds((current) =>
                                current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id],
                              )
                            }
                            className="size-4 accent-[var(--primary)]"
                          />
                        </Td>
                        <Td>
                          <span className="flex items-center gap-2.5 font-medium">
                            <Avatar name={member.name} size="sm" />
                            <span className="grid gap-1">
                              <span>{member.name}</span>
                              {reasons.length > 0 || member.isUrgent ? (
                                <span className="flex flex-wrap gap-1">
                                  {member.isUrgent ? <Pill tone="danger">Urgente</Pill> : null}
                                  {reasons.filter((reason) => reason !== "Urgente").map((reason) => (
                                    <Pill key={reason} tone="warning">
                                      {reason}
                                    </Pill>
                                  ))}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </Td>
                        <Td className="font-mono">{member.age ?? "—"}</Td>
                        <Td>{member.neighborhood || member.city || "—"}</Td>
                        <Td>
                          {member.spiritualTemperature ? (
                            <TempPill temperature={member.spiritualTemperature} />
                          ) : (
                            <span className="text-muted">Sem avaliação</span>
                          )}
                        </Td>
                        <Td>
                          <StatusPill status={member.status} label={MEMBER_STATUS_LABEL[member.status]} />
                        </Td>
                        <Td>{member.caregiver ? shortName(member.caregiver) : <span className="text-muted">Sem cuidador</span>}</Td>
                        <Td>
                          {last ? (
                            <>
                              {FOLLOWUP_TYPE_LABEL[last.type]} ·{" "}
                              <span className="font-mono">{relDay(last.occurredAt, now)}</span>
                            </>
                          ) : (
                            <span className="text-muted">Nenhum</span>
                          )}
                        </Td>
                        <Td className={late ? "font-mono text-danger" : "font-mono"}>
                          {nextAction && member.status !== "inactive" ? (
                            <>
                              {fmtDay(nextAction)}
                              {late ? ` · atrasada ${-dayDiff(nextAction, now)}d` : ""}
                            </>
                          ) : (
                            <span className="font-sans text-muted">—</span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                <span className="text-xs text-muted">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => router.push(buildHref({ page: String(pagination.page - 1) }))}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => router.push(buildHref({ page: String(pagination.page + 1) }))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Leitura do assistido */}
      <Drawer
        open={drawer?.kind === "view" && activeMember !== null}
        onClose={closeDrawer}
        title={activeMember?.name ?? ""}
        subtitle={
          activeMember ? (
            <span className="flex flex-wrap items-center gap-1.5">
              {activeMember.spiritualTemperature ? <TempPill temperature={activeMember.spiritualTemperature} /> : null}
              <StatusPill status={activeMember.status} label={MEMBER_STATUS_LABEL[activeMember.status]} />
              {activeMember.isUrgent ? <Pill tone="danger">Urgente</Pill> : null}
            </span>
          ) : null
        }
        footerStart={
          activeMember ? (
            <Button variant="danger" disabled={busy} onClick={() => removeMember(activeMember)}>
              Excluir
            </Button>
          ) : null
        }
        footer={
          activeMember ? (
            <>
              <Button onClick={() => setDrawer({ kind: "edit", memberId: activeMember.id })}>Editar</Button>
              <Button variant="primary" icon="plus" onClick={() => setDrawer({ kind: "followup", memberId: activeMember.id })} data-autofocus>
                Registrar acompanhamento
              </Button>
            </>
          ) : null
        }
      >
        {activeMember ? (
          <MemberDetail
            member={activeMember}
            tenantName={tenantsById.get(activeMember.tenantId)?.name}
            caregivers={caregivers}
            followups={followupsByMember.get(activeMember.id) ?? []}
            busy={busy}
            error={error}
            now={now}
            onStatus={(status) => setStatus(activeMember, status)}
            onTemperature={(temperature) => setTemperature(activeMember, temperature)}
            onCaregiver={(caregiverId) => assignCaregiver(activeMember, caregiverId)}
          />
        ) : null}
      </Drawer>

      <MemberFormDrawer
        open={drawer?.kind === "new" || drawer?.kind === "edit"}
        onClose={() => (drawer?.kind === "edit" ? setDrawer({ kind: "view", memberId: drawer.memberId }) : closeDrawer())}
        member={drawer?.kind === "edit" ? (membersById.get(drawer.memberId) ?? null) : null}
        tenants={tenants}
        caregivers={caregivers}
        onSaved={() => undefined}
      />

      <FollowupFormDrawer
        open={drawer?.kind === "followup" && activeMember !== null}
        onClose={() => (drawer?.kind === "followup" ? setDrawer({ kind: "view", memberId: drawer.memberId }) : closeDrawer())}
        followup={null}
        defaultMemberId={activeMember?.id}
        lockMember
        members={activeMember ? [activeMember] : []}
        caregivers={caregivers}
      />

      <Drawer
        open={drawer?.kind === "communication"}
        onClose={closeDrawer}
        title="Comunicados para cuidadores"
        subtitle="Uma mensagem pronta para copiar por cuidador."
        footer={
          communication.groups.length > 1 ? (
            <Button
              onClick={() =>
                copyText(communication.groups.map((group) => group.message).join("\n\n---\n\n"), "Todas as mensagens copiadas.")
              }
            >
              Copiar todos
            </Button>
          ) : null
        }
      >
        {communication.membersWithoutCaregiver.length > 0 ? (
          <Notice tone="warning">
            {communication.membersWithoutCaregiver.length} assistido(s) selecionado(s) sem cuidador não entraram no comunicado.
          </Notice>
        ) : null}
        {communication.groups.length === 0 ? (
          <Notice tone="warning">Nenhum comunicado gerado. Selecione assistidos que já tenham cuidador atribuído.</Notice>
        ) : null}
        {communication.groups.map((group) => (
          <Card key={group.caregiver.id}>
            <CardHeader
              level={3}
              title={group.caregiver.name}
              meta={`${group.caregiver.phone || "sem telefone"} · ${plural(group.members.length, "assistido", "assistidos")}`}
              action={
                <Button size="sm" icon="copy" onClick={() => copyText(group.message, `Mensagem de ${group.caregiver.name} copiada.`)}>
                  Copiar
                </Button>
              }
            />
            <CardBody className="grid gap-2.5">
              {group.warnings.length > 0 ? <Notice tone="warning">{group.warnings.join(" ")}</Notice> : null}
              <Textarea
                aria-label={`Mensagem para ${group.caregiver.name}`}
                readOnly
                value={group.message}
                rows={Math.min(10, group.members.length + 6)}
              />
            </CardBody>
          </Card>
        ))}
      </Drawer>
    </div>
  );
}

function MemberDetail({
  member,
  tenantName,
  caregivers,
  followups,
  busy,
  error,
  now,
  onStatus,
  onTemperature,
  onCaregiver,
}: Readonly<{
  member: Member;
  tenantName?: string;
  caregivers: Caregiver[];
  followups: Followup[];
  busy: boolean;
  error: string | null;
  now: Date;
  onStatus: (status: Member["status"]) => void;
  onTemperature: (temperature: SpiritualTemperature) => void;
  onCaregiver: (caregiverId: string) => void;
}>) {
  const nextAction = followups[0]?.nextActionAt ?? null;
  const late = Boolean(nextAction && member.status !== "inactive" && dayDiff(nextAction, now) < 0);
  const address = [
    [member.street, member.addressNumber].filter(Boolean).join(", "),
    member.neighborhood,
  ]
    .filter(Boolean)
    .join(" · ");
  const place = [member.city, member.state].filter(Boolean).join("/");

  return (
    <>
      <FormError>{error}</FormError>
      <Kv
        items={[
          {
            label: "Idade",
            value: member.age !== null ? `${member.age} anos${member.birthDate ? ` · nasceu em ${fmtDate(`${member.birthDate}T12:00:00`)}` : ""}` : "—",
          },
          { label: "Telefone", value: member.phone ? <span className="font-mono">{member.phone}</span> : "—" },
          {
            label: "Endereço",
            value: member.address || address ? (
              <>
                {address || member.address}
                {place ? <span className="block text-muted">{place}{member.postalCode ? ` · CEP ${member.postalCode}` : ""}</span> : null}
              </>
            ) : (
              "—"
            ),
          },
          { label: "Localidade", value: tenantName ?? "—" },
          {
            label: "Próxima ação",
            value:
              nextAction && member.status !== "inactive" ? (
                <span className={late ? "text-danger" : undefined}>
                  <span className="font-mono">{fmtDate(nextAction)}</span> · {relDay(nextAction, now)}
                  {late ? " (atrasada)" : ""}
                </span>
              ) : (
                <span className="text-muted">nenhuma</span>
              ),
          },
        ]}
      />

      <Select
        label="Cuidador"
        value={member.caregiverId ?? ""}
        disabled={busy}
        onChange={(event) => onCaregiver(event.target.value)}
        options={[
          { value: "", label: "Sem atribuição" },
          ...caregivers.filter((c) => c.tenantId === member.tenantId).map((c) => ({ value: c.id, label: c.name })),
        ]}
      />

      <Field label="Temperatura espiritual">
        <Segmented<SpiritualTemperature>
          label="Temperatura espiritual"
          value={(member.spiritualTemperature ?? "") as SpiritualTemperature}
          onChange={onTemperature}
          options={(Object.keys(TEMPERATURE_LABEL) as SpiritualTemperature[]).map((value) => ({
            value,
            label: TEMPERATURE_LABEL[value],
          }))}
        />
      </Field>

      <Field label="Situação">
        <Segmented<Member["status"]>
          label="Situação"
          value={member.status}
          onChange={onStatus}
          options={STATUS_ORDER.map((value) => ({ value, label: MEMBER_STATUS_LABEL[value] }))}
          className="flex-wrap"
        />
      </Field>

      {member.notes ? (
        <div className="grid gap-1.5">
          <SectionLabel>Observações</SectionLabel>
          <p className="whitespace-pre-line text-[13px]">{member.notes}</p>
        </div>
      ) : null}

      <div className="grid gap-2.5">
        <SectionLabel>Acompanhamentos · {followups.length}</SectionLabel>
        <FollowupTimeline followups={followups} />
      </div>
    </>
  );
}
