"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Member, Tenant } from "@/server/domain/mvp";
import { PanelShell } from "@/ui/mvp/panel-shell";

const statusLabels: Record<Member["status"], string> = {
  new: "Novo",
  in_progress: "Em acompanhamento",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

const emptyForm = {
  tenantId: "",
  caregiverId: "",
  name: "",
  phone: "",
  address: "",
  city: "",
  birthDate: "",
  status: "new" as Member["status"],
  notes: "",
};

export function MemberManager({
  members,
  tenants,
  caregivers,
}: Readonly<{
  members: Member[];
  tenants: Tenant[];
  caregivers: Caregiver[];
}>) {
  const router = useRouter();
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ ...emptyForm, tenantId: tenants[0]?.id ?? "" });
  const [assigningMemberId, setAssigningMemberId] = useState<string | null>(null);
  const [savingAssignId, setSavingAssignId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditing(null);
    setForm({ ...emptyForm, tenantId: tenants[0]?.id ?? "", city: tenants[0]?.city ?? "" });
    setError(null);
  }

  function openEdit(member: Member) {
    setEditing(member);
    setForm({
      tenantId: member.tenantId,
      caregiverId: member.caregiverId ?? "",
      name: member.name,
      phone: member.phone,
      address: member.address,
      city: member.city,
      birthDate: member.birthDate ?? "",
      status: member.status,
      notes: member.notes,
    });
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(editing ? `/api/members/${editing.id}` : "/api/members", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: form.tenantId,
        caregiverId: form.caregiverId || null,
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        birthDate: form.birthDate || null,
        status: form.status,
        notes: form.notes,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel salvar o membro.");
      setSubmitting(false);
      return;
    }

    resetForm();
    setSubmitting(false);
    startTransition(() => router.refresh());
  }

  async function assignCaregiver(memberId: string, caregiverId: string) {
    setSavingAssignId(memberId);

    const response = await fetch(`/api/members/${memberId}/assign-caregiver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caregiverId: caregiverId || null }),
    });

    setSavingAssignId(null);

    if (!response.ok) {
      return;
    }

    setAssigningMemberId(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <PanelShell
        title={editing ? "Editar membro" : "Novo membro"}
        description="Cadastre pessoas acompanhadas e mantenha o fluxo do MVP concentrado no monólito."
      >
        <form className="grid gap-4 xl:grid-cols-2" onSubmit={handleSubmit}>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Cidade</span>
            <select
              required
              value={form.tenantId}
              onChange={(event) => {
                const nextTenant = tenants.find((tenant) => tenant.id === event.target.value);
                setForm((current) => ({
                  ...current,
                  tenantId: event.target.value,
                  city: current.city || nextTenant?.city || "",
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
            <span className="mb-1 block font-medium text-slate-700">Cuidador</span>
            <select
              value={form.caregiverId}
              onChange={(event) => setForm((current) => ({ ...current, caregiverId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            >
              <option value="">Sem atribuição</option>
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
          <label className="text-sm xl:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Endereco</span>
            <input
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
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
            <span className="mb-1 block font-medium text-slate-700">Nascimento</span>
            <input
              type="date"
              value={form.birthDate}
              onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as Member["status"] }))
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
              {submitting ? "Salvando..." : editing ? "Salvar membro" : "Criar membro"}
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

      <PanelShell title="Editar e atribuir" description="Atribua cuidadores diretamente na lista e abra a edição completa quando precisar.">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Cuidador</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.phone}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{statusLabels[member.status]}</td>
                  <td className="px-4 py-4">
                    {assigningMemberId === member.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={member.caregiverId ?? ""}
                          onChange={(event) => assignCaregiver(member.id, event.target.value)}
                          className="rounded-xl border border-slate-200 px-3 py-2"
                        >
                          <option value="">Sem atribuição</option>
                          {caregivers.map((caregiver) => (
                            <option key={caregiver.id} value={caregiver.id}>
                              {caregiver.name}
                            </option>
                          ))}
                        </select>
                        {savingAssignId === member.id && <span className="text-xs text-slate-500">Salvando...</span>}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAssigningMemberId(member.id)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      >
                        {member.caregiver ?? "Atribuir"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => openEdit(member)}
                      className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelShell>
    </div>
  );
}
