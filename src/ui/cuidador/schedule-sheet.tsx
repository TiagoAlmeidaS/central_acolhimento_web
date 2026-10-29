"use client";

import { useState, type FormEvent } from "react";
import type { AuthSession, FollowupType } from "@/server/domain/mvp";
import { Avatar, Button, cx, Icon, Input, Select, StatusPill, Textarea } from "@/ui/atalaia";
import { createFollowup } from "./care-api";
import {
  addDays,
  FOLLOWUP_ICONS,
  FOLLOWUP_LABELS,
  FOLLOWUP_TYPES,
  formatDate,
  localInputToIso,
  toDateInput,
  whatsappUrl,
  type CarePerson,
} from "./care-utils";
import { Sheet, useResetOnOpen } from "./sheet";

const FORM_ID = "cuidador-schedule-form";

const DURATIONS = [
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "45", label: "45 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1h 30min" },
  { value: "120", label: "2 horas" },
];

type FormState = {
  type: FollowupType;
  title: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  notes: string;
  notify: boolean;
};

function defaultTitle(type: FollowupType, person: CarePerson | null) {
  const names = person ? person.name.split(" ").slice(0, 2).join(" ") : "";
  return `${FOLLOWUP_LABELS[type]} · ${names}`.trim();
}

function locationLabel(type: FollowupType) {
  switch (type) {
    case "visit":
      return "Local da visita";
    case "call":
      return "Telefone de contato";
    case "message":
      return "Canal ou link da conversa";
    case "prayer":
      return "Local da oração";
    default:
      return "Local do compromisso";
  }
}

export type ScheduleSheetProps = {
  open: boolean;
  person: CarePerson | null;
  session: AuthSession;
  nowIso: string;
  onClose: () => void;
  onBack?: (() => void) | null;
  onSaved: (message: string) => void;
};

/** Agendar a próxima ação de um assistido (com aviso opcional por WhatsApp). */
export function ScheduleSheet({ open, person, session, nowIso, onClose, onBack, onSaved }: ScheduleSheetProps) {
  const initial = (): FormState => ({
    type: "visit",
    title: defaultTitle("visit", person),
    date: toDateInput(addDays(nowIso, 1)),
    time: "19:00",
    duration: "60",
    location: person?.address || person?.city || "",
    notes: "",
    notify: Boolean(person?.phone),
  });

  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useResetOnOpen(open, () => {
    setForm(initial());
    setSaving(false);
    setError(null);
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!person) return;
    if (!form.date || !form.time) {
      setError("Informe a data e a hora do compromisso.");
      return;
    }
    setSaving(true);
    setError(null);

    const title = form.title.trim() || FOLLOWUP_LABELS[form.type];
    const location = form.location.trim();
    let note = `Agendado: ${title}`;
    if (location) note += `\n📍 Local: ${location}`;
    note += `\n⏰ Duração: ${form.duration} minutos`;
    if (form.notes.trim()) note += `\n📝 Notas: ${form.notes.trim()}`;

    const result = await createFollowup({
      session,
      memberId: person.id,
      type: form.type,
      occurredAt: new Date().toISOString(),
      notes: note,
      nextActionAt: localInputToIso(form.date, form.time),
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (form.notify && person.phone) {
      const when = formatDate(localInputToIso(form.date, form.time));
      const message = `Olá, ${person.name}! Passando para confirmar nosso compromisso: *${title}* no dia *${when}* às *${form.time}*.${
        location ? `\n📍 Local: ${location}.` : ""
      }\nDeus abençoe!`;
      window.open(whatsappUrl(person.phone, message), "_blank", "noopener,noreferrer");
    }
    onSaved(`Compromisso agendado para ${formatDate(localInputToIso(form.date, form.time))}.`);
  }

  return (
    <Sheet
      open={open && person !== null}
      onClose={onClose}
      title="Agendar próxima ação"
      subtitle="Marca a data no seu painel e, se quiser, avisa pelo WhatsApp."
      footerStart={
        onBack ? (
          <Button variant="ghost" onClick={onBack} disabled={saving}>
            Voltar
          </Button>
        ) : undefined
      }
      footer={
        <>
          {onBack ? null : (
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
          )}
          <Button variant="primary" type="submit" form={FORM_ID} loading={saving}>
            {saving ? "Agendando..." : "Agendar ação"}
          </Button>
        </>
      }
    >
      {person ? (
        <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="grid gap-4">
          <div className="flex items-center gap-3 rounded-card border border-border bg-sunken px-3 py-2.5">
            <Avatar name={person.name} size="lg" />
            <div className="min-w-0 flex-1">
              <span className="block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Ação para</span>
              <b className="block truncate">{person.name}</b>
            </div>
            <StatusPill status={person.status} />
          </div>

          <fieldset className="grid gap-1.5 border-0 p-0">
            <legend className="mb-1.5 text-xs font-semibold text-muted">Tipo de compromisso</legend>
            <div className="grid grid-cols-5 gap-1.5">
              {FOLLOWUP_TYPES.map((type) => {
                const active = form.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setForm((current) => ({ ...current, type, title: defaultTitle(type, person) }))}
                    className={cx(
                      "grid min-h-14 cursor-pointer place-items-center content-center gap-1 rounded-control border px-1 py-2 text-[11px] font-medium transition-colors duration-150",
                      active
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border-strong bg-surface text-muted hover:bg-sunken hover:text-fg",
                    )}
                  >
                    <Icon name={FOLLOWUP_ICONS[type]} size={17} />
                    {FOLLOWUP_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Input
            label="Título"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="Ex.: Visita de acompanhamento"
            data-autofocus=""
          />

          <div className="grid grid-cols-[1.2fr_1fr] gap-3">
            <Input
              label="Data *"
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
              required
            />
            <Input
              label="Hora *"
              type="time"
              value={form.time}
              onChange={(event) => update("time", event.target.value)}
              required
            />
          </div>

          <Select
            label="Duração estimada"
            value={form.duration}
            onChange={(event) => update("duration", event.target.value)}
            options={DURATIONS}
          />

          <Input
            label={locationLabel(form.type)}
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder={form.type === "call" ? person.phone || "(00) 00000-0000" : "Endereço ou ponto de encontro"}
          />

          <Textarea
            label="Observações (opcional)"
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Metas da conversa ou pontos para orar."
            rows={3}
          />

          {person.phone ? (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-card border border-border bg-sunken px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.notify}
                onChange={(event) => update("notify", event.target.checked)}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span>
                <b>Avisar {person.name.split(" ")[0]} pelo WhatsApp</b>
                <span className="block text-xs text-muted">
                  Ao agendar, abre o WhatsApp com a mensagem de confirmação pronta.
                </span>
              </span>
            </label>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-card border border-danger/50 bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </form>
      ) : null}
    </Sheet>
  );
}
