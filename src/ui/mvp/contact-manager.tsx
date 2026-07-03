"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Seed, Tenant } from "@/server/domain/mvp";
import { PanelShell } from "@/ui/mvp/panel-shell";

const statusLabels: Record<Seed["status"], string> = {
  new: "Novo",
  contacted: "Contatado",
  in_progress: "Virou membro",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

const emptyForm = {
  tenantId: "",
  caregiverId: "",
  referenceName: "",
  phone: "",
  city: "",
  source: "",
  status: "new" as Seed["status"],
  notes: "",
  firstContactAt: "",
};

export function ContactManager({
  contacts,
  tenants,
  caregivers,
}: Readonly<{
  contacts: Seed[];
  tenants: Tenant[];
  caregivers: Caregiver[];
}>) {
  const router = useRouter();
  const [editing, setEditing] = useState<Seed | null>(null);
  const [form, setForm] = useState({
    ...emptyForm,
    tenantId: tenants[0]?.id ?? "",
    city: tenants[0]?.city ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditing(null);
    setForm({
      ...emptyForm,
      tenantId: tenants[0]?.id ?? "",
      city: tenants[0]?.city ?? "",
    });
    setError(null);
  }

  function openEdit(contact: Seed) {
    setEditing(contact);
    setForm({
      tenantId: contact.tenantId,
      caregiverId: contact.caregiverId ?? "",
      referenceName: contact.referenceName,
      phone: contact.phone,
      city: contact.city,
      source: contact.source,
      status: contact.status,
      notes: contact.notes,
      firstContactAt: contact.firstContactAt ? contact.firstContactAt.slice(0, 10) : "",
    });
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(editing ? `/api/seeds/${editing.id}` : "/api/seeds", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: form.tenantId,
        caregiverId: form.caregiverId || null,
        referenceName: form.referenceName,
        phone: form.phone,
        city: form.city,
        source: form.source,
        status: form.status,
        notes: form.notes,
        firstContactAt: form.firstContactAt || null,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel salvar o novo contato.");
      setSubmitting(false);
      return;
    }

    resetForm();
    setSubmitting(false);
    startTransition(() => router.refresh());
  }

  async function convertContact(contact: Seed) {
    setConvertingId(contact.id);

    const response = await fetch(`/api/seeds/${contact.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caregiverId: contact.caregiverId ?? null,
        notes: contact.notes,
      }),
    });

    setConvertingId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel converter o contato.");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <PanelShell
        title={editing ? "Editar novo contato" : "Novo contato"}
        description="Esse e o ponto de entrada do cuidado. O cuidador registra o contato e depois ele pode virar membro."
      >
        <form className="grid gap-4 xl:grid-cols-2" onSubmit={handleSubmit}>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Cidade</span>
            <select
              required
              value={form.tenantId}
              onChange={(event) => {
                const tenant = tenants.find((item) => item.id === event.target.value);
                setForm((current) => ({
                  ...current,
                  tenantId: event.target.value,
                  city: tenant?.city ?? current.city,
                }));
              }}
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

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Cuidador responsavel</span>
            <select
              value={form.caregiverId}
              onChange={(event) => setForm((current) => ({ ...current, caregiverId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            >
              <option value="">Sem atribuicao</option>
              {caregivers.map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Nome</span>
            <input
              required
              value={form.referenceName}
              onChange={(event) => setForm((current) => ({ ...current, referenceName: event.target.value }))}
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

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Cidade da pessoa</span>
            <input
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Origem</span>
            <input
              value={form.source}
              onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
              placeholder="Culto, visita, indicacao, mensagem..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as Seed["status"] }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Primeiro contato</span>
            <input
              type="date"
              value={form.firstContactAt}
              onChange={(event) => setForm((current) => ({ ...current, firstContactAt: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          <label className="text-sm xl:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Observacoes</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          {error && <p className="xl:col-span-2 text-sm text-rose-600">{error}</p>}

          <div className="xl:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Salvando..." : editing ? "Salvar contato" : "Registrar contato"}
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

      <PanelShell
        title="Fila de novos contatos"
        description="Acompanhe o que ja entrou no funil e converta para membro quando o acompanhamento comecar."
      >
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{contact.referenceName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {contact.phone || "Sem telefone"} • {contact.city || "Sem cidade"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{contact.notes}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {statusLabels[contact.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>Origem: {contact.source || "Nao informada"}</span>
                <span>Cuidador: {contact.caregiver ?? "Nao atribuido"}</span>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(contact)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => convertContact(contact)}
                  disabled={convertingId === contact.id || contact.status === "in_progress"}
                  className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {convertingId === contact.id ? "Convertendo..." : "Converter em membro"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
