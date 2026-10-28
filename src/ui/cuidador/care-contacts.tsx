"use client";

import { useMemo, useState } from "react";
import type { Seed } from "@/server/domain/mvp";
import {
  Avatar,
  Button,
  Chip,
  EmptyState,
  Icon,
  NeedsChip,
  PageContainer,
  PageHeader,
  SearchInput,
  StatusPill,
} from "@/ui/atalaia";
import { formatDate, isOpenPerson, plural, type CarePerson, type NeedItem } from "./care-utils";
import { PersonCard } from "./person-card";

export type ContactFilter = "ativos" | "precisa" | "novos" | "visita" | "acompanhando" | "concluidos" | "inativos" | "sem-cuidador";

const FILTER_LABELS: Record<Exclude<ContactFilter, "precisa" | "sem-cuidador">, string> = {
  ativos: "Ativos",
  novos: "Novos",
  visita: "Esperando visita",
  acompanhando: "Em acompanhamento",
  concluidos: "Consolidados",
  inativos: "Inativos",
};

function matches(person: CarePerson, filter: ContactFilter, needIds: Set<string>) {
  switch (filter) {
    case "ativos":
      return isOpenPerson(person);
    case "precisa":
      return needIds.has(person.id);
    case "novos":
      return person.status === "new" || person.status === "contacted";
    case "visita":
      return person.status === "waiting_visit";
    case "acompanhando":
      return person.status === "in_progress";
    case "concluidos":
      return person.status === "consolidated";
    case "inativos":
      return person.status === "inactive";
    default:
      return true;
  }
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export type CareContactsProps = {
  people: CarePerson[];
  needs: NeedItem[];
  /** Contatos sem cuidador que podem ser assumidos. */
  unassigned: Seed[];
  nowIso: string;
  initialFilter?: ContactFilter;
  busy: boolean;
  claimError: string | null;
  onOpen: (person: CarePerson) => void;
  onNewContact: () => void;
  onClaim: (seed: Seed) => void;
};

/** Contatos do cuidador: busca, filtros ("Precisa de alguém" primeiro) e cartões que abrem a ficha. */
export function CareContacts({
  people,
  needs,
  unassigned,
  nowIso,
  initialFilter = "ativos",
  busy,
  claimError,
  onOpen,
  onNewContact,
  onClaim,
}: CareContactsProps) {
  const [filter, setFilter] = useState<ContactFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const needIds = useMemo(() => new Set(needs.map((need) => need.person.id)), [needs]);

  const counts = useMemo(() => {
    const result = {} as Record<ContactFilter, number>;
    for (const key of Object.keys(FILTER_LABELS) as Array<keyof typeof FILTER_LABELS>) {
      result[key] = people.filter((person) => matches(person, key, needIds)).length;
    }
    return result;
  }, [people, needIds]);

  const visible = useMemo(() => {
    const term = normalize(query.trim());
    return people.filter((person) => {
      if (!matches(person, filter, needIds)) return false;
      if (!term) return true;
      return normalize(`${person.name} ${person.city} ${person.neighborhood}`).includes(term);
    });
  }, [people, filter, query, needIds]);

  const claiming = filter === "sem-cuidador";
  const filterLabel = filter === "precisa" ? "Precisa de alguém" : claiming ? "Sem cuidador" : FILTER_LABELS[filter];

  return (
    <PageContainer className="grid gap-4">
      <PageHeader
        className="mb-0"
        title="Contatos"
        subtitle="Quem está sob o seu cuidado."
        action={
          <Button variant="primary" icon="plus" onClick={onNewContact}>
            Novo contato
          </Button>
        }
      />

      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nome, bairro ou cidade"
        label="Buscar contatos"
      />

      <div className="flex flex-wrap items-center gap-2">
        <NeedsChip count={needs.length} pressed={filter === "precisa"} onClick={() => setFilter(filter === "precisa" ? "ativos" : "precisa")} />
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrar por situação">
        {(Object.keys(FILTER_LABELS) as Array<keyof typeof FILTER_LABELS>).map((key) => (
          <Chip
            key={key}
            label={FILTER_LABELS[key]}
            count={counts[key]}
            pressed={filter === key}
            onClick={() => setFilter(key)}
          />
        ))}
        {unassigned.length > 0 ? (
          <Chip
            label="Sem cuidador"
            count={unassigned.length}
            tone="alert"
            pressed={claiming}
            onClick={() => setFilter(claiming ? "ativos" : "sem-cuidador")}
          />
        ) : null}
      </div>

      {claiming ? (
        <section aria-label="Contatos sem cuidador" className="grid gap-2.5">
          <p role="status" className="text-sm text-muted">
            {plural(unassigned.length, "contato espera", "contatos esperam")} um cuidador. Ao assumir, a pessoa passa a
            ser sua.
          </p>
          {claimError ? (
            <p role="alert" className="rounded-card border border-danger/50 bg-danger-soft px-3 py-2 text-sm text-danger">
              {claimError}
            </p>
          ) : null}
          <ul className="grid gap-2.5">
            {unassigned.map((seed) => (
              <li key={seed.id} className="grid gap-3 rounded-card border border-border bg-surface px-3.5 py-3">
                <div className="flex items-start gap-3">
                  <Avatar name={seed.referenceName} size="lg" />
                  <div className="grid min-w-0 flex-1 gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <b className="truncate">{seed.referenceName}</b>
                      <StatusPill status={seed.status} />
                    </div>
                    <small className="text-xs text-muted">
                      {[seed.city, seed.phone].filter(Boolean).join(" · ") || "Sem cidade ou telefone"}
                    </small>
                    <small className="text-xs text-subtle">
                      Cadastrado em {seed.createdAt ? formatDate(seed.createdAt) : "data indisponível"}
                    </small>
                  </div>
                </div>
                {seed.notes ? (
                  <p className="rounded-control border border-border bg-sunken px-2.5 py-2 text-sm text-muted">{seed.notes}</p>
                ) : null}
                <Button icon="users" onClick={() => onClaim(seed)} loading={busy} className="max-[560px]:min-h-10">
                  {busy ? "Assumindo..." : "Assumir responsabilidade"}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : people.length === 0 ? (
        <EmptyState
          title="Você ainda não tem contatos."
          reason="Quem você cadastrar ou assumir aparece aqui, com situação, última conversa e atalhos de WhatsApp e ligação."
          hint='Use "Novo contato" no topo para cadastrar quem acabou de chegar.'
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={query.trim() ? "Ninguém com esse nome." : `Ninguém em "${filterLabel}".`}
          reason={
            query.trim()
              ? "Nenhum contato combina com a busca neste filtro."
              : filter === "precisa"
                ? "Ninguém está esperando uma ação sua agora."
                : "Nenhum contato está nessa situação no momento."
          }
          hint={
            query.trim()
              ? "Apague a busca ou escolha outro filtro."
              : 'Escolha outro filtro ou use "Novo contato" para cadastrar alguém.'
          }
        />
      ) : (
        <>
          <p role="status" className="flex items-center gap-1.5 text-xs text-muted">
            <Icon name="filter" size={13} />
            {plural(visible.length, "pessoa", "pessoas")} em {filterLabel.toLowerCase()}
          </p>
          <ul className="grid gap-2.5">
            {visible.map((person) => (
              <PersonCard key={person.id} person={person} nowIso={nowIso} onOpen={onOpen} />
            ))}
          </ul>
        </>
      )}
    </PageContainer>
  );
}
