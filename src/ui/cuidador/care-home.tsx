"use client";

import Link from "next/link";
import type { AuthSession } from "@/server/domain/mvp";
import { Button, Card, CardBody, CardHeader, cx, EmptyState, Icon, PageContainer, PageHeader, Stat } from "@/ui/atalaia";
import {
  FOLLOWUP_LABELS,
  formatDayNumber,
  formatLongDate,
  formatMonthShort,
  formatTime,
  isOpenPerson,
  isOverdue,
  plural,
  relativeDay,
  type CarePerson,
  type NeedItem,
  type UpcomingAction,
} from "./care-utils";
import { PersonCard } from "./person-card";

const SEVERITY_DOT: Record<NeedItem["severity"], string> = {
  3: "bg-danger",
  2: "bg-warning",
  1: "bg-subtle",
};

const SEVERITY_TEXT: Record<NeedItem["severity"], string> = {
  3: "Urgente",
  2: "Importante",
  1: "Lembrete",
};

export type CareHomeProps = {
  session: AuthSession;
  people: CarePerson[];
  needs: NeedItem[];
  upcoming: UpcomingAction[];
  nowIso: string;
  onOpen: (person: CarePerson) => void;
  /** Registra acompanhamento; sem pessoa, abre o formulário para escolher. */
  onRegister: (person?: CarePerson) => void;
  onNewContact: () => void;
};

/** Painel do cuidador: "Precisa de você" primeiro, depois ações, contatos e compromissos. */
export function CareHome({ session, people, needs, upcoming, nowIso, onOpen, onRegister, onNewContact }: CareHomeProps) {
  const open = people.filter(isOpenPerson);
  const overdue = people.filter((person) => isOverdue(person, nowIso)).length;
  const needsIds = new Set(needs.map((need) => need.person.id));
  const shownNeeds = needs.slice(0, 5);

  // Contatos em destaque: quem precisa de você vem antes, depois os mais recentes.
  const featured = open
    .slice()
    .sort((a, b) => {
      const need = Number(needsIds.has(b.id)) - Number(needsIds.has(a.id));
      if (need !== 0) return need;
      return Date.parse(b.lastContactAt ?? b.since ?? "") - Date.parse(a.lastContactAt ?? a.since ?? "") || 0;
    })
    .slice(0, 4);

  const nextMeetings = upcoming.slice(0, 4);
  const empty = people.length === 0;

  return (
    <PageContainer className="grid gap-5">
      <PageHeader
        className="mb-0"
        title={`Olá, ${session.user.firstName}`}
        subtitle={
          <>
            {session.membership.tenantName} · <span className="first-letter:uppercase">{formatLongDate(nowIso)}</span>
          </>
        }
      />

      <Card aria-labelledby="needs-h">
        <CardHeader
          id="needs-h"
          title="Precisa de você"
          meta={
            <span role="status">
              {needs.length > 0 ? `${plural(needs.length, "pessoa espera", "pessoas esperam")} uma ação` : "Ninguém esperando"}
            </span>
          }
        />
        <div className="pb-2 pt-2">
          {needs.length > 0 ? (
            <ul>
              {shownNeeds.map((need) => (
                <li
                  key={need.person.id}
                  className="flex items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0"
                >
                  <span aria-hidden="true" className={cx("size-2 shrink-0 rounded-full", SEVERITY_DOT[need.severity])} />
                  <button
                    type="button"
                    onClick={() => onOpen(need.person)}
                    className="min-h-10 min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left text-fg"
                  >
                    <b className="block truncate font-semibold">{need.person.name}</b>
                    <small className="block truncate text-xs text-muted">
                      <span className="sr-only">{SEVERITY_TEXT[need.severity]}: </span>
                      {need.reason} · {need.person.kind === "seed" ? "contato" : "assistido"}
                    </small>
                  </button>
                  <Button
                    size="sm"
                    className="max-[560px]:min-h-10"
                    onClick={() => (need.action === "Registrar" ? onRegister(need.person) : onOpen(need.person))}
                    aria-label={`${need.action}: ${need.person.name}`}
                  >
                    {need.action}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 pb-2">
              <p className="font-medium">Tudo em dia.</p>
              <p className="mt-0.5 text-sm text-muted">
                Ninguém urgente, esperando visita ou com ação atrasada. Bom momento para visitar quem está em
                acompanhamento.
              </p>
            </div>
          )}
          {needs.length > shownNeeds.length ? (
            <div className="border-t border-border px-4 pt-2.5">
              <Link href="/cuidador/contatos?filtro=precisa" className="text-sm">
                Ver as {needs.length} em Contatos
              </Link>
            </div>
          ) : null}
        </div>
      </Card>

      <section aria-label="Ações rápidas" className="grid gap-2 min-[480px]:grid-cols-2">
        <Button variant="primary" icon="plus" onClick={() => onRegister()} className="max-[560px]:min-h-11">
          Registrar acompanhamento
        </Button>
        <Button icon="contatos" onClick={onNewContact} className="max-[560px]:min-h-11">
          Novo contato
        </Button>
      </section>

      <section aria-label="Resumo" className="grid grid-cols-2 gap-2">
        <Stat label="Sob seu cuidado" value={open.length} note={open.length === 1 ? "pessoa" : "pessoas"} />
        <Stat label="Ações atrasadas" value={overdue} tone={overdue > 0 ? "alert" : "default"} note={overdue > 0 ? "para retomar" : "em dia"} />
      </section>

      {empty ? (
        <EmptyState
          title="Sua lista ainda está vazia."
          reason="Os contatos que você cadastrar ou assumir aparecem aqui, com o que fazer em cada um."
          hint='Toque em "Novo contato" para cadastrar quem acabou de chegar.'
        />
      ) : (
        <Card aria-labelledby="mine-h">
          <CardHeader
            id="mine-h"
            title="Meus contatos"
            meta={plural(open.length, "ativo", "ativos")}
            action={
              <Link href="/cuidador/contatos" className="text-sm">
                Ver todos
              </Link>
            }
          />
          <CardBody>
            {featured.length > 0 ? (
              <ul className="grid gap-2.5">
                {featured.map((person) => (
                  <PersonCard key={person.id} person={person} nowIso={nowIso} onOpen={onOpen} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                Nenhum contato ativo no momento. Os inativos e consolidados estão em Contatos.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      <Card aria-labelledby="next-h">
        <CardHeader id="next-h" title="Próximos compromissos" meta={nextMeetings.length ? undefined : "nenhum"} />
        <div className="pb-2 pt-2">
          {nextMeetings.length > 0 ? (
            <ul>
              {nextMeetings.map((item) => (
                <li key={item.person.id} className="border-t border-border first:border-t-0">
                  <button
                    type="button"
                    onClick={() => onOpen(item.person)}
                    className="flex min-h-12 w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-2 text-left text-fg hover:bg-sunken"
                  >
                    <span className="grid w-12 shrink-0 justify-items-center rounded-control bg-primary-soft px-1 py-1 text-primary">
                      <span className="font-mono text-[11px] uppercase">{formatMonthShort(item.at)}</span>
                      <b className="font-mono text-base leading-none">{formatDayNumber(item.at)}</b>
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate font-semibold">{item.person.name}</b>
                      <small className="block truncate text-xs text-muted">
                        {FOLLOWUP_LABELS[item.followup?.type ?? "visit"]} · {relativeDay(item.at, nowIso)}
                        {formatTime(item.at) !== "00:00" && formatTime(item.at) !== "09:00" ? ` às ${formatTime(item.at)}` : ""}
                      </small>
                    </span>
                    <Icon name="chevron-right" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 pb-2 text-sm text-muted">
              Nada marcado. Ao registrar um acompanhamento, defina o <b className="text-fg">Próximo contato</b> e ele
              aparece aqui.
            </p>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}
