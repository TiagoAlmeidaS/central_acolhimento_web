"use client";

import { useState, type ReactNode } from "react";
import type { FollowupType } from "@/server/domain/mvp";
import { buttonClass, Button, cx, Eyebrow, Icon, StatusPill, TempPill } from "@/ui/atalaia";
import {
  describeFollowupNotes,
  FOLLOWUP_ICONS,
  FOLLOWUP_LABELS,
  formatDate,
  formatTime,
  isOverdue,
  relativeDay,
  telUrl,
  whatsappUrl,
  type CarePerson,
} from "./care-utils";
import { Sheet } from "./sheet";

const QUICK_LOGS: Array<{ label: string; type: FollowupType; note: string; icon: "call" | "check" | "prayer" }> = [
  { label: "Liguei agora", type: "call", note: "Ligação registrada pelo cuidador", icon: "call" },
  { label: "Contato presencial", type: "other", note: "Contato presencial registrado pelo cuidador", icon: "check" },
  { label: "Oração", type: "prayer", note: "Momento de oração registrado pelo cuidador", icon: "prayer" },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[104px_1fr] gap-3 border-b border-border py-2 text-sm last:border-b-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export type PersonSheetProps = {
  person: CarePerson | null;
  open: boolean;
  nowIso: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onRegister: (person: CarePerson) => void;
  onSchedule: (person: CarePerson) => void;
  onQuickLog: (person: CarePerson, type: FollowupType, note: string) => void;
  onConvert: (person: CarePerson) => void;
  onInactivate: (person: CarePerson) => void;
};

/** Ficha do contato/assistido: ler aqui, agir no rodapé. Equivale a seedDrawer/memberDrawer do protótipo. */
export function PersonSheet(props: PersonSheetProps) {
  const { person, open, onClose } = props;
  return (
    <Sheet
      open={open && person !== null}
      onClose={onClose}
      title={person?.name ?? ""}
      subtitle={
        person ? (
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusPill status={person.status} />
            {person.temperature ? <TempPill temperature={person.temperature} /> : null}
            {person.isUrgent ? <StatusPill status="urgente" /> : null}
            <span className="text-xs text-muted">{person.kind === "seed" ? "Contato" : "Assistido"}</span>
          </span>
        ) : null
      }
      {...footerFor(props)}
    >
      {person ? <PersonBody key={person.id} {...props} person={person} /> : null}
    </Sheet>
  );
}

function footerFor({ person, busy, onRegister, onConvert }: PersonSheetProps) {
  if (!person) return {};
  if (person.kind === "member") {
    return {
      footer: (
        <Button variant="primary" icon="plus" onClick={() => onRegister(person)} disabled={busy}>
          Registrar acompanhamento
        </Button>
      ),
    };
  }
  return {
    footer: (
      <Button variant="primary" icon="arrow" onClick={() => onConvert(person)} loading={busy}>
        {busy ? "Iniciando..." : "Iniciar acompanhamento"}
      </Button>
    ),
  };
}

function PersonBody({ person, nowIso, busy, error, onSchedule, onQuickLog, onInactivate }: PersonSheetProps & { person: CarePerson }) {
  const [confirming, setConfirming] = useState(false);
  const overdue = isOverdue(person, nowIso);
  const canInactivate = person.status !== "inactive";

  return (
    <>
      {error ? (
        <p role="alert" className="rounded-card border border-danger/50 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {person.phone ? (
        <div className="grid grid-cols-2 gap-2">
          <a
            href={whatsappUrl(person.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("neutral", "md", "max-[560px]:min-h-10")}
          >
            <Icon name="whatsapp" size={16} />
            WhatsApp
          </a>
          <a href={telUrl(person.phone)} className={buttonClass("neutral", "md", "max-[560px]:min-h-10")}>
            <Icon name="phone" size={16} />
            Ligar
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted">Sem telefone cadastrado. Edite o contato com a coordenação para adicionar.</p>
      )}

      <dl>
        {person.phone ? <Row label="Telefone"><span className="font-mono text-[13px]">{person.phone}</span></Row> : null}
        {person.age ? <Row label="Idade">{person.age} anos</Row> : null}
        <Row label="Local">
          {[person.neighborhood, person.city].filter(Boolean).join(" · ") || <span className="text-muted">Não informado</span>}
        </Row>
        {person.address ? <Row label="Endereço">{person.address}</Row> : null}
        {person.kind === "seed" ? (
          <>
            <Row label="Casa aberta">{person.openHouse ? "Sim, recebe visitas" : "Não"}</Row>
            {person.source ? <Row label="Origem">{person.source}</Row> : null}
            <Row label="Chegada">
              {person.since ? `${formatDate(person.since)} · ${relativeDay(person.since, nowIso)}` : <span className="text-muted">Sem data</span>}
            </Row>
          </>
        ) : (
          <>
            <Row label="Último contato">
              {person.lastContactAt ? (
                `${formatDate(person.lastContactAt)} · ${relativeDay(person.lastContactAt, nowIso)}`
              ) : (
                <span className="text-muted">Nenhum ainda</span>
              )}
            </Row>
            <Row label="Próxima ação">
              {person.nextActionAt && person.status !== "inactive" ? (
                <span className={cx(overdue && "font-semibold text-danger")}>
                  {formatDate(person.nextActionAt)} · {relativeDay(person.nextActionAt, nowIso)}
                  {overdue ? " (atrasada)" : ""}
                </span>
              ) : (
                <span className="text-muted">Nenhuma marcada</span>
              )}
            </Row>
          </>
        )}
      </dl>

      {person.notes ? (
        <div className="grid gap-1">
          <Eyebrow>Observações</Eyebrow>
          <p className="whitespace-pre-wrap rounded-card border border-border bg-sunken px-3 py-2.5 text-sm">{person.notes}</p>
        </div>
      ) : null}

      {person.kind === "seed" ? (
        <p className="rounded-card border border-border bg-sunken px-3 py-2.5 text-sm text-muted">
          Este contato ainda está na triagem. Use <b className="text-fg">Iniciar acompanhamento</b> para torná-lo um
          assistido e registrar visitas, ligações e orações.
        </p>
      ) : (
        <>
          <div className="grid gap-2">
            <Eyebrow>Registro rápido</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {QUICK_LOGS.map((quick) => (
                <Button
                  key={quick.label}
                  size="sm"
                  icon={quick.icon}
                  disabled={busy}
                  onClick={() => onQuickLog(person, quick.type, quick.note)}
                >
                  {quick.label}
                </Button>
              ))}
            </div>
            <div>
              <Button size="sm" icon="clock" onClick={() => onSchedule(person)} disabled={busy}>
                Agendar próxima ação
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <Eyebrow>Linha do tempo</Eyebrow>
              <span className="text-xs text-muted">
                {person.followups.length} {person.followups.length === 1 ? "registro" : "registros"}
              </span>
            </div>
            {person.followups.length === 0 ? (
              <p className="rounded-card border border-dashed border-border-strong px-3 py-4 text-sm text-muted">
                Nenhum acompanhamento ainda. O primeiro costuma ser uma ligação: use <b className="text-fg">Liguei agora</b>{" "}
                ou <b className="text-fg">Registrar acompanhamento</b>.
              </p>
            ) : (
              <ol className="grid">
                {person.followups.map((followup, index) => {
                  const { scheduled, text } = describeFollowupNotes(followup.notes);
                  const last = index === person.followups.length - 1;
                  return (
                    <li key={followup.id} className="relative grid grid-cols-[28px_1fr] gap-3">
                      <span className="relative flex flex-col items-center">
                        <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-primary">
                          <Icon name={FOLLOWUP_ICONS[followup.type]} size={14} />
                        </span>
                        {!last ? <span aria-hidden="true" className="mt-1 w-px flex-1 bg-border-strong" /> : null}
                      </span>
                      <div className={cx("min-w-0", last ? "pb-0" : "pb-4")}>
                        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                          <b>{scheduled ? "Ação agendada" : FOLLOWUP_LABELS[followup.type]}</b>
                          <span className="font-mono text-xs text-muted">
                            {formatDate(followup.occurredAt)} {formatTime(followup.occurredAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">{text || "Sem anotação."}</p>
                        {followup.nextActionAt ? (
                          <p className="mt-0.5 text-xs text-subtle">Próximo contato: {formatDate(followup.nextActionAt)}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </>
      )}

      {canInactivate ? (
        confirming ? (
          <div role="alertdialog" aria-label="Confirmar inativação" className="grid gap-2.5 rounded-card border border-danger/50 bg-danger-soft px-3 py-3">
            <p className="text-sm">
              <b>Inativar {person.name}?</b> O contato fica marcado como <b>inativo</b> e sai da sua lista de acompanhamento
              ativo.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setConfirming(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button size="sm" variant="danger" loading={busy} onClick={() => onInactivate(person)}>
                {busy ? "Inativando..." : "Confirmar inativação"}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button variant="danger" size="sm" icon="x" onClick={() => setConfirming(true)} disabled={busy}>
              Inativar contato
            </Button>
          </div>
        )
      ) : null}
    </>
  );
}
