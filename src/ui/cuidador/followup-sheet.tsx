"use client";

import { useState, type FormEvent } from "react";
import type { AuthSession, FollowupType, Member, SpiritualTemperature } from "@/server/domain/mvp";
import { Button, cx, EmptyState, Icon, Input, Select, Textarea } from "@/ui/atalaia";
import { createFollowup, flagMemberUrgent, setTemperature } from "./care-api";
import {
  addDays,
  FOLLOWUP_ICONS,
  FOLLOWUP_LABELS,
  FOLLOWUP_TYPES,
  localInputToIso,
  TEMPERATURE_LABELS,
  toDateInput,
  toDateTimeInput,
  type CarePerson,
} from "./care-utils";
import { Sheet, useResetOnOpen } from "./sheet";

const FORM_ID = "cuidador-followup-form";

type FormState = {
  memberId: string;
  type: FollowupType;
  occurredAt: string;
  notes: string;
  next: string;
  temperature: "" | SpiritualTemperature;
  notifyCoordination: boolean;
};

export type FollowupSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Assistidos entre os quais escolher. */
  members: CarePerson[];
  /** Domínio original dos assistidos (precisa do `Member` para avisar a coordenação). */
  rawMembers: Member[];
  session: AuthSession;
  nowIso: string;
  /** Pessoa já escolhida (aberto a partir da ficha ou de "Precisa de você"). */
  initialMemberId?: string | null;
  /** Mostra "Voltar" quando o drawer foi aberto a partir da ficha. */
  onBack?: (() => void) | null;
  onSaved: (message: string, options?: { tone?: "success" | "error" }) => void;
};

/** Registrar acompanhamento (followupForm/saveFollowup do protótipo) usando as APIs atuais. */
export function FollowupSheet({
  open,
  onClose,
  members,
  rawMembers,
  session,
  nowIso,
  initialMemberId,
  onBack,
  onSaved,
}: FollowupSheetProps) {
  const initial = (): FormState => {
    const memberId = initialMemberId && members.some((m) => m.id === initialMemberId) ? initialMemberId : "";
    const member = members.find((m) => m.id === memberId);
    return {
      memberId: memberId || (members.length === 1 ? members[0].id : ""),
      type: "visit",
      occurredAt: toDateTimeInput(nowIso),
      notes: "",
      next: toDateInput(addDays(nowIso, 7)),
      temperature: member?.temperature ?? "",
      notifyCoordination: false,
    };
  };

  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useResetOnOpen(open, () => {
    setForm(initial());
    setError(null);
    setSaving(false);
  });

  const member = members.find((m) => m.id === form.memberId) ?? null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function pickMember(memberId: string) {
    const picked = members.find((m) => m.id === memberId);
    setForm((current) => ({ ...current, memberId, temperature: picked?.temperature ?? "" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) {
      setError("Escolha a pessoa que você acompanhou.");
      return;
    }
    if (!form.notes.trim()) {
      setError("Escreva pelo menos uma frase sobre o encontro.");
      return;
    }
    setSaving(true);
    setError(null);

    const occurredAt = form.occurredAt ? new Date(form.occurredAt).toISOString() : new Date().toISOString();
    const result = await createFollowup({
      session,
      memberId: member.id,
      type: form.type,
      occurredAt,
      notes: form.notes.trim(),
      nextActionAt: form.next ? localInputToIso(form.next) : null,
    });

    if (!result.ok) {
      setSaving(false);
      setError(result.error);
      return;
    }

    let warning: string | null = null;
    if (form.temperature && form.temperature !== member.temperature) {
      const temp = await setTemperature(member.id, form.temperature);
      if (!temp.ok) warning = "O acompanhamento foi salvo, mas a temperatura espiritual não pôde ser atualizada.";
    }
    if (form.notifyCoordination && !member.isUrgent) {
      const raw = rawMembers.find((m) => m.id === member.id);
      if (raw) {
        const flagged = await flagMemberUrgent(raw, session.membership.caregiverId);
        if (!flagged.ok) warning = "O acompanhamento foi salvo, mas a coordenação não pôde ser avisada.";
      }
    }

    setSaving(false);
    if (warning) {
      onSaved(warning, { tone: "error" });
      return;
    }
    const nextText = form.next ? "Próximo contato marcado." : "Sem próximo contato marcado.";
    onSaved(`${FOLLOWUP_LABELS[form.type]} registrada. ${nextText}`);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Registrar acompanhamento"
      subtitle={member ? member.name : "Quem você acompanhou, o que foi conversado e quando volta."}
      footerStart={
        onBack ? (
          <Button variant="ghost" onClick={onBack} disabled={saving}>
            Voltar
          </Button>
        ) : undefined
      }
      footer={
        members.length > 0 ? (
          <>
            {onBack ? null : (
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
            )}
            <Button variant="primary" type="submit" form={FORM_ID} loading={saving}>
              {saving ? "Salvando..." : "Salvar acompanhamento"}
            </Button>
          </>
        ) : undefined
      }
    >
      {members.length === 0 ? (
        <EmptyState
          title="Você ainda não acompanha ninguém."
          reason="Acompanhamentos são registrados para assistidos. Um contato novo vira assistido quando você inicia o acompanhamento dele."
          hint='Abra um contato em Contatos e use "Iniciar acompanhamento".'
        />
      ) : (
        <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="grid gap-4">
          <Select
            label="Pessoa acompanhada *"
            value={form.memberId}
            onChange={(event) => pickMember(event.target.value)}
            placeholder="Escolha o assistido"
            options={members.map((m) => ({ value: m.id, label: m.name }))}
            data-autofocus={!form.memberId ? "" : undefined}
            required
          />

          <fieldset className="grid gap-1.5 border-0 p-0">
            <legend className="mb-1.5 text-xs font-semibold text-muted">Tipo</legend>
            <div className="grid grid-cols-5 gap-1.5">
              {FOLLOWUP_TYPES.map((type) => {
                const active = form.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update("type", type)}
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
            label="Quando aconteceu"
            type="datetime-local"
            value={form.occurredAt}
            onChange={(event) => update("occurredAt", event.target.value)}
          />

          <Textarea
            label="O que foi conversado *"
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Ex.: Pessoa receptiva. Pediu oração pela saúde da esposa."
            rows={4}
            data-autofocus={form.memberId ? "" : undefined}
          />

          <div className="grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
            <Input
              label="Próximo contato"
              type="date"
              value={form.next}
              onChange={(event) => update("next", event.target.value)}
              hint={form.next ? "Entra no painel como próxima ação." : "Vazio: nada fica marcado."}
            />
            <Select
              label="Temperatura espiritual"
              value={form.temperature}
              onChange={(event) => update("temperature", event.target.value as FormState["temperature"])}
              options={[
                { value: "", label: member?.temperature ? "Manter como está" : "Não avaliada" },
                ...(Object.entries(TEMPERATURE_LABELS) as Array<[SpiritualTemperature, string]>).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </div>

          {member && !member.isUrgent ? (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-card border border-border bg-sunken px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.notifyCoordination}
                onChange={(event) => update("notifyCoordination", event.target.checked)}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span>
                <b>Avisar a coordenação</b>
                <span className="block text-xs text-muted">
                  Marca {member.name.split(" ")[0]} como urgente: aparece em &quot;Precisa de alguém&quot; para a
                  coordenação.
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
      )}
    </Sheet>
  );
}
