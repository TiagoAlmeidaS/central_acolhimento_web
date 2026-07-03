"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/server/domain/mvp";
import { PanelShell } from "@/ui/mvp/panel-shell";

const emptyForm = {
  name: "",
  city: "",
  state: "",
  coordinator: "",
  status: "active" as "active" | "inactive",
};

export function TenantManager({ tenants }: Readonly<{ tenants: Tenant[] }>) {
  const router = useRouter();
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
  }

  function openEdit(tenant: Tenant) {
    setEditing(tenant);
    setForm({
      name: tenant.name,
      city: tenant.city,
      state: tenant.state,
      coordinator: tenant.coordinator ?? "",
      status: tenant.status,
    });
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const url = editing ? `/api/tenants/${editing.id}` : "/api/tenants";
    const method = editing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        city: form.city,
        state: form.state,
        coordinator: form.coordinator || null,
        status: form.status,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel salvar a cidade.");
      setSubmitting(false);
      return;
    }

    openCreate();
    setSubmitting(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <PanelShell
        title={editing ? "Editar cidade" : "Nova cidade"}
        description="Cadastre o tenant que representa a unidade operacional da Central."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              <span className="mb-1 block font-medium text-slate-700">Coordenador</span>
              <input
                value={form.coordinator}
                onChange={(event) => setForm((current) => ({ ...current, coordinator: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Cidade</span>
              <input
                required
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Estado</span>
              <input
                required
                value={form.state}
                onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as "active" | "inactive" }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            >
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Salvando..." : editing ? "Salvar cidade" : "Criar cidade"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={openCreate}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </PanelShell>

      <PanelShell
        title="Cidades cadastradas"
        description="Edite rapidamente os tenants e prepare a base multi-tenant do MVP."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => openEdit(tenant)}
              className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">{tenant.name}</p>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Editar</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {tenant.city} - {tenant.state}
              </p>
            </button>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
