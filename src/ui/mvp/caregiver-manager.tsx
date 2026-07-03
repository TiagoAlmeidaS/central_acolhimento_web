"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Tenant } from "@/server/domain/mvp";
import { PanelShell } from "@/ui/mvp/panel-shell";

const emptyForm = {
  tenantId: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
  active: true,
};

export function CaregiverManager({
  caregivers,
  tenants,
}: Readonly<{
  caregivers: Caregiver[];
  tenants: Tenant[];
}>) {
  const router = useRouter();
  const [editing, setEditing] = useState<Caregiver | null>(null);
  const [form, setForm] = useState({
    ...emptyForm,
    tenantId: tenants[0]?.id ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditing(null);
    setForm({
      ...emptyForm,
      tenantId: tenants[0]?.id ?? "",
    });
    setError(null);
  }

  function openEdit(caregiver: Caregiver) {
    setEditing(caregiver);
    setForm({
      tenantId: caregiver.tenantId,
      name: caregiver.name,
      phone: caregiver.phone,
      email: caregiver.email ?? "",
      notes: caregiver.notes,
      active: caregiver.active,
    });
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(editing ? `/api/caregivers/${editing.id}` : "/api/caregivers", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: form.tenantId,
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        notes: form.notes,
        active: form.active,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel salvar o cuidador.");
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
        title={editing ? "Editar cuidador" : "Novo cuidador"}
        description="Cadastre quem vai acompanhar pessoas dentro de cada cidade."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Cidade</span>
            <select
              required
              value={form.tenantId}
              onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            >
              <option value="">Selecione</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nome</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Telefone</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Observacoes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            />
            Cuidador ativo
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Salvando..." : editing ? "Salvar cuidador" : "Criar cuidador"}
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

      <PanelShell title="Editar cuidadores" description="Selecione um cuidador para ajustar dados e disponibilidade.">
        <div className="space-y-3">
          {caregivers.map((caregiver) => (
            <button
              key={caregiver.id}
              type="button"
              onClick={() => openEdit(caregiver)}
              className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">{caregiver.name}</p>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Editar</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{caregiver.email ?? caregiver.phone}</p>
            </button>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
