"use client";

import { useMemo, useState } from "react";
import type { Followup, FollowupType } from "@/server/domain/mvp";
import { Button, Chip, cx, EmptyState, Icon, NeedsChip, PageContainer, PageHeader } from "@/ui/atalaia";
import {
  describeFollowupNotes,
  FOLLOWUP_ICONS,
  FOLLOWUP_LABELS,
  FOLLOWUP_TYPES,
  formatDate,
  formatDayMonth,
  formatTime,
  isOverdue,
  plural,
  relativeDay,
  shortName,
  type CarePerson,
} from "./care-utils";

type Filter = "todos" | "atrasadas" | FollowupType;

export type CareFollowupsProps = {
  people: CarePerson[];
  followups: Followup[];
  nowIso: string;
  onOpen: (person: CarePerson) => void;
  onRegister: (person?: CarePerson) => void;
};

/** Linha do tempo dos meus acompanhamentos + "Registrar acompanhamento" (abre o drawer). */
export function CareFollowups({ people, followups, nowIso, onOpen, onRegister }: CareFollowupsProps) {
  const [filter, setFilter] = useState<Filter>("todos");

  const byId = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);
  const overdue = useMemo(
    () =>
      people
        .filter((person) => person.kind === "member" && isOverdue(person, nowIso))
        .sort((a, b) => Date.parse(a.nextActionAt ?? "") - Date.parse(b.nextActionAt ?? "")),
    [people, nowIso],
  );

  const sorted = useMemo(
    () => followups.slice().sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)),
    [followups],
  );
  const typeCounts = useMemo(() => {
    const counts = {} as Record<FollowupType, number>;
    for (const type of FOLLOWUP_TYPES) counts[type] = sorted.filter((item) => item.type === type).length;
    return counts;
  }, [sorted]);

  const visible = filter === "todos" || filter === "atrasadas" ? sorted : sorted.filter((item) => item.type === filter);
  const hasMembers = people.some((person) => person.kind === "member");

  return (
    <PageContainer className="grid gap-4">
      <PageHeader
        className="mb-0"
        title="Acompanhamentos"
        subtitle="Visitas, ligações, mensagens e orações que você registrou."
        action={
          <Button variant="primary" icon="plus" onClick={() => onRegister()}>
            Registrar acompanhamento
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <NeedsChip
          label="Ação atrasada"
          count={overdue.length}
          pressed={filter === "atrasadas"}
          onClick={() => setFilter(filter === "atrasadas" ? "todos" : "atrasadas")}
        />
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrar por tipo">
        <Chip label="Todos" count={sorted.length} pressed={filter === "todos"} onClick={() => setFilter("todos")} />
        {FOLLOWUP_TYPES.map((type) => (
          <Chip
            key={type}
            label={FOLLOWUP_LABELS[type]}
            count={typeCounts[type]}
            pressed={filter === type}
            onClick={() => setFilter(filter === type ? "todos" : type)}
          />
        ))}
      </div>

      {filter === "atrasadas" ? (
        overdue.length === 0 ? (
          <EmptyState
            title="Nenhuma ação atrasada."
            reason="Todos os próximos contatos que você marcou ainda estão no prazo."
            hint='Ao registrar um acompanhamento, o campo "Próximo contato" cria o próximo lembrete.'
          />
        ) : (
          <ul className="grid gap-2.5">
            {overdue.map((person) => (
              <li key={person.id} className="flex items-center gap-3 rounded-card border border-border bg-surface px-3.5 py-3">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-danger" />
                <button
                  type="button"
                  onClick={() => onOpen(person)}
                  className="min-h-10 min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left text-fg"
                >
                  <b className="block truncate">{person.name}</b>
                  <small className="block text-xs text-danger">
                    Atrasada desde {formatDayMonth(person.nextActionAt)} ({relativeDay(person.nextActionAt, nowIso)})
                  </small>
                </button>
                <Button size="sm" className="max-[560px]:min-h-10" onClick={() => onRegister(person)}>
                  Registrar
                </Button>
              </li>
            ))}
          </ul>
        )
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Nenhum acompanhamento registrado."
          reason={
            hasMembers
              ? "Cada visita, ligação, mensagem ou oração que você registrar fica aqui, do mais recente ao mais antigo."
              : "Acompanhamentos são feitos com assistidos. Um contato novo vira assistido quando você inicia o acompanhamento dele."
          }
          hint={
            hasMembers
              ? 'Toque em "Registrar acompanhamento" para o primeiro.'
              : 'Abra um contato em Contatos e use "Iniciar acompanhamento".'
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={`Nenhuma ${FOLLOWUP_LABELS[filter as FollowupType].toLowerCase()} registrada.`}
          reason="Você ainda não registrou acompanhamentos desse tipo."
          hint='Escolha "Todos" ou use "Registrar acompanhamento" e selecione esse tipo.'
        />
      ) : (
        <>
          <p role="status" className="text-xs text-muted">
            {plural(visible.length, "registro", "registros")}
          </p>
          <ol className="grid">
            {visible.map((followup, index) => {
              const person = byId.get(followup.memberId);
              const name = person?.name ?? followup.member ?? "Pessoa removida";
              const { scheduled, text } = describeFollowupNotes(followup.notes);
              const last = index === visible.length - 1;
              return (
                <li key={followup.id} className="grid grid-cols-[28px_1fr] gap-3">
                  <span className="flex flex-col items-center">
                    <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-primary">
                      <Icon name={FOLLOWUP_ICONS[followup.type]} size={14} />
                    </span>
                    {!last ? <span aria-hidden="true" className="mt-1 w-px flex-1 bg-border-strong" /> : null}
                  </span>
                  <div className={cx("min-w-0", last ? "pb-0" : "pb-5")}>
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <b>{scheduled ? "Ação agendada" : FOLLOWUP_LABELS[followup.type]}</b>
                      <span className="text-muted">com</span>
                      {person ? (
                        <button
                          type="button"
                          onClick={() => onOpen(person)}
                          className="min-h-7 cursor-pointer border-0 bg-transparent p-0 font-medium text-primary underline-offset-2 hover:underline"
                        >
                          {shortName(person.name)}
                        </button>
                      ) : (
                        <span>{shortName(name)}</span>
                      )}
                    </div>
                    <time dateTime={followup.occurredAt} className="font-mono text-xs text-muted">
                      {formatDate(followup.occurredAt)} {formatTime(followup.occurredAt)} · {relativeDay(followup.occurredAt, nowIso)}
                    </time>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{text || "Sem anotação."}</p>
                    {followup.nextActionAt ? (
                      <p className="mt-0.5 text-xs text-subtle">Próximo contato: {formatDate(followup.nextActionAt)}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </PageContainer>
  );
}
