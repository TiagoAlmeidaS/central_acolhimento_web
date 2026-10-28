"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, OutingEvent, Seed, Tenant } from "@/server/domain/mvp";
import type { ContactListingFilters } from "@/lib/listing-filters";
import {
  Button,
  Chip,
  Drawer,
  EmptyState,
  Input,
  NeedsChip,
  PageContainer,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  useToast,
} from "@/ui/atalaia";
import { DashboardMap } from "@/ui/mvp/dashboard-map";
import type { DashboardMapItem } from "@/ui/mvp/dashboard-map-utils";
import { ContactList } from "@/ui/mvp/contact-list";
import { Check } from "@/ui/coord/check";
import { ContactBoard } from "@/ui/coord/contact-board";
import { ContactDrawer } from "@/ui/coord/contact-drawer";
import { ContactForm } from "@/ui/coord/contact-form";
import {
  BOARD_STATUSES,
  buildNeeds,
  type ChipId,
  convertSeedRequest,
  deleteSeedRequest,
  firstName,
  plural,
  SEED_STATUS_LABEL,
  SEED_STATUS_PLURAL,
  updateSeedRequest,
  type SeedStatus,
} from "@/ui/coord/seed-utils";

type View = "quadro" | "lista" | "mapa";
type DrawerState = { kind: "view"; id: string } | { kind: "form"; id: string | null } | null;

export type ContactsWorkspaceProps = {
  seeds: Seed[];
  tenants: Tenant[];
  caregivers: Caregiver[];
  outings: OutingEvent[];
  /** Assistidos ativos por cuidador (rotulo do seletor e carga). */
  loadByCaregiver: Record<string, number>;
  /** Filtros aplicados no servidor (formulario “Mais filtros”). */
  filters: ContactListingFilters;
  /** Estado inicial vindo da URL (?contato=, ?novo=1, ?editar=, ?filtro=). */
  initial?: { contactId?: string; editId?: string; openNew?: boolean; chip?: ChipId; view?: View };
};

function mapStatus(seed: Seed): string {
  if (seed.isUrgent && seed.status !== "consolidated" && seed.status !== "inactive") return "urgente";
  if (seed.status === "new") return "novo";
  if (seed.status === "contacted" || seed.status === "waiting_visit") return "aguardando";
  if (seed.status === "in_progress") return "acompanhamento";
  if (seed.status === "consolidated") return "concluido";
  return "inativo";
}

function clearOpenParams() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of ["contato", "novo", "editar"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

const FILTER_KEYS: Array<keyof ContactListingFilters> = [
  "name",
  "city",
  "tenantId",
  "caregiverId",
  "dateFrom",
  "dateTo",
  "description",
  "status",
];

export function ContactsWorkspace({
  seeds: seedsProp,
  tenants,
  caregivers,
  outings,
  loadByCaregiver,
  filters,
  initial = {},
}: ContactsWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [seeds, setSeeds] = useState(seedsProp);
  const [seenProp, setSeenProp] = useState(seedsProp);
  if (seenProp !== seedsProp) {
    setSeenProp(seedsProp);
    setSeeds(seedsProp);
  }

  const [view, setView] = useState<View>(initial.view ?? "quadro");
  const [q, setQ] = useState("");
  const [chip, setChip] = useState<ChipId>(initial.chip ?? "");
  const [source, setSource] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(() => {
    if (initial.openNew) return { kind: "form", id: null };
    if (initial.editId && seedsProp.some((seed) => seed.id === initial.editId)) return { kind: "form", id: initial.editId };
    if (initial.contactId && seedsProp.some((seed) => seed.id === initial.contactId)) return { kind: "view", id: initial.contactId };
    return null;
  });
  const [formBusy, setFormBusy] = useState(false);

  const missingId = initial.editId ?? initial.contactId;
  const missing = Boolean(missingId) && !seedsProp.some((seed) => seed.id === missingId) && !initial.openNew;
  useEffect(() => {
    if (missing) toast("Não encontramos esse contato. Ele pode ter sido excluído.", { tone: "error" });
  }, [missing, toast]);

  const caregiversById = useMemo(() => new Map(caregivers.map((caregiver) => [caregiver.id, caregiver])), [caregivers]);
  const loadMap = useMemo(() => new Map(Object.entries(loadByCaregiver)), [loadByCaregiver]);
  const sources = useMemo(
    () => Array.from(new Set(seeds.map((seed) => seed.source.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [seeds],
  );
  const needIds = useMemo(
    () => new Set(buildNeeds({ seeds, members: [], followups: [] }).map((item) => item.id)),
    [seeds],
  );

  const base = useMemo(() => seeds.filter((seed) => showInactive || seed.status !== "inactive"), [seeds, showInactive]);
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return base.filter((seed) => {
      if (query && !`${seed.referenceName} ${seed.neighborhood} ${seed.city} ${seed.phone}`.toLowerCase().includes(query)) return false;
      if (source && seed.source.trim() !== source) return false;
      if (chip === "needs" && !needIds.has(seed.id)) return false;
      if (chip === "urgent" && !seed.isUrgent) return false;
      if (chip === "open" && !seed.openHouse) return false;
      if (chip === "none" && seed.caregiverId) return false;
      return true;
    });
  }, [base, q, source, chip, needIds]);

  const activeServerFilters = FILTER_KEYS.filter((key) => Boolean(filters[key])).length;
  const hasLocalFilters = Boolean(q.trim() || source || chip);
  const selected = drawer?.id ? (seeds.find((seed) => seed.id === drawer.id) ?? null) : null;

  const columns: SeedStatus[] = showInactive ? [...BOARD_STATUSES, "inactive"] : BOARD_STATUSES;

  const mapItems: DashboardMapItem[] = useMemo(
    () =>
      list.map((seed) => ({
        id: seed.id,
        name: seed.referenceName,
        city: seed.city,
        address: seed.address,
        status: mapStatus(seed),
        caregiver: seed.caregiverId ? (caregiversById.get(seed.caregiverId)?.name ?? null) : null,
        lastContact: SEED_STATUS_LABEL[seed.status],
        latitude: seed.latitude,
        longitude: seed.longitude,
        age: seed.age,
        birthDate: null,
      })),
    [list, caregiversById],
  );
  const withoutCoords = list.filter((seed) => seed.latitude === null || seed.longitude === null).length;

  function refresh() {
    startTransition(() => router.refresh());
  }

  function replaceSeed(updated: Seed) {
    setSeeds((current) => current.map((seed) => (seed.id === updated.id ? updated : seed)));
  }

  function closeDrawer() {
    setDrawer(null);
    clearOpenParams();
  }

  function openView(id: string) {
    setDrawer({ kind: "view", id });
  }

  function clearLocal() {
    setQ("");
    setChip("");
    setSource("");
  }

  async function assign(seed: Seed, caregiverId: string | null) {
    const result = await updateSeedRequest(seed, { caregiverId });
    if (!result.ok) {
      toast(result.error, { tone: "error" });
      return;
    }
    replaceSeed(result.seed);
    const caregiver = caregiverId ? caregiversById.get(caregiverId) : undefined;
    toast(caregiver ? `${firstName(seed.referenceName)} agora é de ${firstName(caregiver.name)}.` : `${firstName(seed.referenceName)} ficou sem cuidador.`);
    refresh();
  }

  async function setUrgent(seed: Seed, value: boolean) {
    const result = await updateSeedRequest(seed, { isUrgent: value });
    if (!result.ok) {
      toast(result.error, { tone: "error" });
      return;
    }
    replaceSeed(result.seed);
    toast(value ? `${firstName(seed.referenceName)} marcado como urgente.` : `${firstName(seed.referenceName)} não é mais urgente.`);
    refresh();
  }

  async function move(seed: Seed, to: SeedStatus) {
    if (seed.status === to) return;
    const from = seed.status;

    if (to === "in_progress") {
      const converted = await convertSeedRequest(seed);
      if (!converted.ok) {
        toast(converted.error, { tone: "error" });
        return;
      }
      replaceSeed({ ...seed, status: "in_progress" });
      toast(`${firstName(seed.referenceName)} agora é membro.`);
      refresh();
      return;
    }

    const overrides: Partial<Seed> = { status: to };
    if (to === "consolidated" || to === "inactive") overrides.isUrgent = false;
    const result = await updateSeedRequest(seed, overrides);
    if (!result.ok) {
      toast(result.error, { tone: "error" });
      return;
    }
    replaceSeed(result.seed);
    toast(`${firstName(seed.referenceName)}: ${SEED_STATUS_LABEL[from]} → ${SEED_STATUS_LABEL[to]}.`);
    refresh();
  }

  async function remove(seed: Seed) {
    const confirmed = window.confirm(`Excluir o contato "${seed.referenceName}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    const result = await deleteSeedRequest(seed);
    if (!result.ok) {
      toast(result.error, { tone: "error" });
      return;
    }
    setSeeds((current) => current.filter((item) => item.id !== seed.id));
    closeDrawer();
    toast("Contato excluído.");
    refresh();
  }

  const moveById = (id: string, to: SeedStatus) => {
    const seed = seeds.find((item) => item.id === id);
    if (seed) void move(seed, to);
  };

  const editingSeed = drawer?.kind === "form" && drawer.id ? (seeds.find((seed) => seed.id === drawer.id) ?? null) : null;
  const countBase = (predicate: (seed: Seed) => boolean) => base.filter(predicate).length;

  const header = (
    <PageHeader
      title="Contatos"
      subtitle="Pessoas que chegaram e ainda estão na jornada de acolhimento."
      secondary={
        <Segmented<View>
          label="Visualização"
          value={view}
          onChange={setView}
          options={[
            { value: "quadro", label: "Quadro" },
            { value: "lista", label: "Lista" },
            { value: "mapa", label: "Mapa" },
          ]}
        />
      }
      action={
        <Button variant="primary" icon="plus" onClick={() => setDrawer({ kind: "form", id: null })}>
          Novo contato
        </Button>
      }
    />
  );

  const advanced = (
    <details className="rounded-card border border-border bg-surface" open={activeServerFilters > 0}>
      <summary className="flex min-h-9 cursor-pointer select-none items-center gap-2 px-3 text-[13px] text-muted">
        Mais filtros
        {activeServerFilters > 0 ? (
          <span className="rounded-control bg-primary-soft px-1.5 font-mono text-[11px] text-primary">{activeServerFilters}</span>
        ) : null}
      </summary>
      <form method="get" className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 border-t border-border p-3">
        <Input label="Nome" name="name" defaultValue={filters.name ?? ""} />
        <Input label="Cidade" name="city" defaultValue={filters.city ?? ""} />
        <Select label="Localidade" name="tenantId" defaultValue={filters.tenantId ?? ""}>
          <option value="">Todas as localidades</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </Select>
        <Select label="Cuidador" name="caregiverId" defaultValue={filters.caregiverId ?? ""}>
          <option value="">Todos os cuidadores</option>
          {caregivers.map((caregiver) => (
            <option key={caregiver.id} value={caregiver.id}>
              {caregiver.name}
            </option>
          ))}
        </Select>
        <Select label="Situação" name="status" defaultValue={filters.status ?? ""}>
          <option value="">Todas as situações</option>
          {(Object.keys(SEED_STATUS_PLURAL) as SeedStatus[]).map((value) => (
            <option key={value} value={value}>
              {SEED_STATUS_LABEL[value]}
            </option>
          ))}
        </Select>
        <Input label="Cadastrado desde" name="dateFrom" type="date" defaultValue={filters.dateFrom ?? ""} />
        <Input label="Cadastrado até" name="dateTo" type="date" defaultValue={filters.dateTo ?? ""} />
        <Input label="Descrição ou observação" name="description" defaultValue={filters.description ?? ""} />
        <div className="flex items-end gap-2">
          <Button type="submit" variant="neutral">
            Aplicar filtros
          </Button>
          <Button href="/coord/contatos" variant="ghost">
            Limpar
          </Button>
        </div>
      </form>
    </details>
  );

  const toolbar = (
    <div className="mb-4 grid gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por nome, bairro ou telefone"
          label="Buscar contatos"
          wrapperClassName="w-full min-[560px]:w-72"
        />
        <NeedsChip count={countBase((seed) => needIds.has(seed.id))} pressed={chip === "needs"} onClick={() => setChip(chip === "needs" ? "" : "needs")} />
        <Chip label="Urgentes" count={countBase((seed) => Boolean(seed.isUrgent))} pressed={chip === "urgent"} onClick={() => setChip(chip === "urgent" ? "" : "urgent")} />
        <Chip label="Casa aberta" count={countBase((seed) => seed.openHouse)} pressed={chip === "open"} onClick={() => setChip(chip === "open" ? "" : "open")} />
        <Chip label="Sem cuidador" count={countBase((seed) => !seed.caregiverId)} pressed={chip === "none"} onClick={() => setChip(chip === "none" ? "" : "none")} />
        {sources.length > 0 ? (
          <Select
            aria-label="Origem"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            wrapperClassName="w-44"
            className="!min-h-7 !py-0 text-[13px]"
          >
            <option value="">Todas as origens</option>
            {sources.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        ) : null}
        <Check
          label="Inativos"
          checked={showInactive}
          onChange={(event) => setShowInactive(event.target.checked)}
          wrapperClassName="!border-0 !bg-transparent !px-1 !py-0 has-[:checked]:!bg-transparent"
        />
        <span className="ml-auto text-xs text-muted">{plural(list.length, "contato", "contatos")}</span>
      </div>
      {advanced}
    </div>
  );

  let body: React.ReactNode;
  if (seeds.length === 0) {
    body =
      activeServerFilters > 0 ? (
        <EmptyState
          title="Nenhum contato com esses filtros."
          reason="Os filtros avançados deixaram a lista vazia."
          hint="Limpe os filtros para voltar a ver todos os contatos."
          action={
            <Button href="/coord/contatos">Limpar filtros</Button>
          }
        />
      ) : (
        <EmptyState
          title="Nenhum contato ainda."
          reason="Cadastre quem chegou no culto. Leva menos de um minuto: nome e telefone bastam, o resto pode vir depois."
          hint={'Use o botão “Novo contato”, no topo desta página.'}
          action={
            <Button icon="plus" onClick={() => setDrawer({ kind: "form", id: null })}>
              Cadastrar o primeiro contato
            </Button>
          }
        />
      );
  } else if (list.length === 0 && view !== "quadro") {
    body = (
      <EmptyState
        title="Nenhum contato com esses filtros."
        reason="Nada na busca ou nos chips combina com o que você escolheu."
        hint="Limpe a busca ou escolha outro filtro."
        action={hasLocalFilters ? <Button onClick={clearLocal}>Limpar filtros</Button> : undefined}
      />
    );
  } else if (view === "quadro") {
    body = (
      <ContactBoard
        columns={columns}
        seeds={list}
        caregiversById={caregiversById}
        needIds={needIds}
        onOpen={openView}
        onMove={moveById}
      />
    );
  } else if (view === "lista") {
    body = <ContactList contacts={list} tenants={tenants} caregivers={caregivers} onOpen={openView} />;
  } else {
    body = (
      <div className="grid gap-2.5">
        <DashboardMap
          bare
          title="Mapa de contatos"
          items={mapItems}
          height={460}
          onSelectItem={openView}
        />
        {withoutCoords > 0 ? (
          <p className="text-xs text-muted">
            {plural(withoutCoords, "contato não aparece", "contatos não aparecem")} no mapa por falta de coordenadas. Edite o contato e use “Escolher no mapa”.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <PageContainer width="full" className="max-w-[1320px]">
      {header}
      {toolbar}
      {body}

      {drawer?.kind === "view" && selected ? (
        <ContactDrawer
          seed={selected}
          tenants={tenants}
          caregivers={caregivers}
          loadByCaregiver={loadMap}
          onClose={closeDrawer}
          onEdit={(seed) => setDrawer({ kind: "form", id: seed.id })}
          onAssign={assign}
          onUrgent={setUrgent}
          onMove={move}
          onDelete={remove}
        />
      ) : null}

      {drawer?.kind === "form" ? (
        <Drawer
          open
          onClose={closeDrawer}
          title={editingSeed ? editingSeed.referenceName : "Novo contato"}
          subtitle={
            editingSeed
              ? "Edite os dados do contato. Para trocar o cuidador ou a situação, use o contato aberto."
              : "O essencial é o nome. O resto pode vir depois."
          }
          footer={
            <>
              <Button variant="ghost" onClick={closeDrawer}>
                Cancelar
              </Button>
              <Button type="submit" form="contact-drawer-form" variant="primary" loading={formBusy}>
                {editingSeed ? "Salvar" : "Cadastrar contato"}
              </Button>
            </>
          }
        >
          <ContactForm
            key={editingSeed?.id ?? "novo"}
            formId="contact-drawer-form"
            tenants={tenants}
            outings={outings}
            caregivers={caregivers}
            editing={editingSeed}
            onBusyChange={setFormBusy}
            onSaved={(saved) => {
              if (saved) {
                setSeeds((current) =>
                  current.some((seed) => seed.id === saved.id)
                    ? current.map((seed) => (seed.id === saved.id ? { ...seed, ...saved } : seed))
                    : [saved, ...current],
                );
              }
              toast(editingSeed ? "Contato salvo." : `${firstName(saved?.referenceName ?? "Contato")} entrou em Novos.`);
              closeDrawer();
              setChip("");
              refresh();
            }}
          />
        </Drawer>
      ) : null}

      {view === "quadro" && seeds.length > 0 ? (
        <p className="mt-4 text-xs text-subtle">
          Arrastar um card entre colunas é um atalho: o botão de avançar dentro do contato faz o mesmo.
        </p>
      ) : null}
    </PageContainer>
  );
}
