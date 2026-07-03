"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Followup, Member, Tenant } from "@/server/domain/mvp";
import { PanelShell } from "@/ui/mvp/panel-shell";

const typeLabels: Record<Followup["type"], string> = {
  visit: "Visita",
  call: "Ligacao",
  message: "Mensagem",
  prayer: "Oracao",
  other: "Outro",
};

const emptyForm = {
  tenantId: "",
  memberId: "",
  caregiverId: "",
  type: "visit" as Followup["type"],
  occurredAt: "",
  nextActionAt: "",
  notes: "",
};

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function FollowupManager({
  followups,
  tenants,
  members,
  caregivers,
}: Readonly<{
  followups: Followup[];
  tenants: Tenant[];
  members: Member[];
  caregivers: Caregiver[];
}>) {
  const router = useRouter();
  const [editing, setEditing] = useState<Followup | null>(null);
  const [form, setForm] = useState({
    ...emptyForm,
    tenantId: tenants[0]?.id ?? "",
    memberId: members[0]?.id ?? "",
    occurredAt: toDateTimeLocal(new Date().toISOString()),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditing(null);
    setForm({
      ...emptyForm,
      tenantId: tenants[0]?.id ?? "",
      memberId: members[0]?.id ?? "",
      occurredAt: toDateTimeLocal(new Date().toISOString()),
    });
    setError(null);
  }

  function openEdit(followup: Followup) {
    setEditing(followup);
    setForm({
      tenantId: followup.tenantId,
      memberId: followup.memberId,
      caregiverId: followup.caregiverId ?? "",
      type: followup.type,
      occurredAt: toDateTimeLocal(followup.occurredAt),
      nextActionAt: toDateTimeLocal(followup.nextActionAt),
      notes: followup.notes,
    });
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(editing ? `/api/followups/${editing.id}` : "/api/followups", {
      method: editing ? "PUT" : "POST",
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

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel salvar o acompanhamento.");
      setSubmitting(false);
      return;
    }

    resetForm();
    setSubmitting(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <PanelShell
        title={editing ? "Editar acompanhamento" : "Novo acompanhamento"}
        description="Registre a acao de cuidado e a proxima movimentacao da jornada."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Cidade</span>
              <select
                required
                value={form.tenantId}
                onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Pessoa</span>
              <select
                required
                value={form.memberId}
                onChange={(event) => setForm((current) => ({ ...current, memberId: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Cuidador</span>
              <select
                value={form.caregiverId}
                onChange={(event) => setForm((current) => ({ ...current, caregiverId: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Sem cuidador</option>
                {caregivers.map((caregiver) => (
                  <option key={caregiver.id} value={caregiver.id}>
                    {caregiver.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Tipo</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value as Followup["type"] }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Quando aconteceu</span>
              <input
                type="datetime-local"
                value={form.occurredAt}
                onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Proxima acao</span>
              <input
                type="datetime-local"
                value={form.nextActionAt}
                onChange={(event) => setForm((current) => ({ ...current, nextActionAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Observacoes</span>
            <textarea
              rows={5}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Salvando..." : editing ? "Salvar acompanhamento" : "Criar acompanhamento"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              {editing ? "Cancelar" : "Limpar"}
            </button>
          </div>
        </form>
      </PanelShell>

      <PanelShell title="Timeline editavel" description="Abra um registro existente para ajustar observacoes e proxima acao.">
        <div className="space-y-3">
          {followups.map((followup) => (
            <button
              key={followup.id}
              type="button"
              onClick={() => openEdit(followup)}
              className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">{followup.member ?? "Sem membro"}</p>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {typeLabels[followup.type]}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{followup.notes}</p>
            </button>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
