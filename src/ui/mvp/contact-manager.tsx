"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Seed, Tenant } from "@/server/domain/mvp";
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  SectionTitle,
  Avatar,
} from "@/ui/v2-components/ui";
import {
  IconUser,
  IconPhone,
  IconMapPin,
  IconCheck,
  IconPlus,
  IconX,
  IconHeart,
  IconUsers,
} from "@/ui/v2-components/icons";

const statusLabels: Record<Seed["status"], string> = {
  new: "Novo",
  contacted: "Contatado",
  in_progress: "Virou membro",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

const statusColors: Record<Seed["status"], { bg: string; fg: string }> = {
  new: { bg: "#FFEDD5", fg: "#C2410C" },
  contacted: { bg: "#DBEAFE", fg: "#1D4ED8" },
  in_progress: { bg: "#F3E8FF", fg: "#7C3AED" },
  consolidated: { bg: "#DCFCE7", fg: "#15803D" },
  inactive: { bg: "#F4F4F5", fg: "#71717A" },
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
  const [success, setSuccess] = useState(false);

  function resetForm() {
    setEditing(null);
    setForm({ ...emptyForm, tenantId: tenants[0]?.id ?? "", city: tenants[0]?.city ?? "" });
    setError(null);
    setSuccess(false);
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
    setSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

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
      setError(payload.error ?? "Não foi possível salvar o contato.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
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
      setError(payload.error ?? "Não foi possível converter o contato.");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* ── Form ── */}
      <Card padding={28}>
        <SectionTitle>
          {editing ? "Editar contato" : "Registrar novo contato"}
        </SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, marginTop: -8 }}>
          Porta de entrada do cuidado. Registre o contato e acompanhe a conversão para membro.
        </p>

        <form
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          onSubmit={handleSubmit}
        >
          <Select
            label="Localidade"
            value={form.tenantId}
            onChange={(v) => {
              const tenant = tenants.find((t) => t.id === v);
              setForm((f) => ({ ...f, tenantId: v, city: tenant?.city ?? f.city }));
            }}
            options={tenants.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Selecione a localidade"
            required
          />

          <Select
            label="Cuidador responsável"
            value={form.caregiverId}
            onChange={(v) => setForm((f) => ({ ...f, caregiverId: v }))}
            options={[
              { value: "", label: "Sem atribuição" },
              ...caregivers.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Input
            label="Nome da pessoa"
            value={form.referenceName}
            onChange={(v) => setForm((f) => ({ ...f, referenceName: v }))}
            placeholder="Ex: Maria Souza"
            icon={<IconUser />}
            required
          />

          <Input
            label="Telefone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="(00) 90000-0000"
            icon={<IconPhone />}
          />

          <Input
            label="Cidade da pessoa"
            value={form.city}
            onChange={(v) => setForm((f) => ({ ...f, city: v }))}
            placeholder="Curitiba"
            icon={<IconMapPin />}
          />

          <Input
            label="Origem do contato"
            value={form.source}
            onChange={(v) => setForm((f) => ({ ...f, source: v }))}
            placeholder="Culto, visita, indicação..."
            icon={<IconHeart />}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v as Seed["status"] }))}
            options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
          />

          <div>
            <label style={{
              display: "flex", flexDirection: "column", gap: 8,
              fontSize: 13.5, fontWeight: 600, color: "var(--text)",
            }}>
              Primeiro contato
              <div style={{
                display: "flex", alignItems: "center", height: 54,
                padding: "0 18px",
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                borderRadius: 14,
              }}>
                <input
                  type="date"
                  value={form.firstContactAt}
                  onChange={(e) => setForm((f) => ({ ...f, firstContactAt: e.target.value }))}
                  style={{
                    flex: 1, border: 0, outline: "none",
                    background: "transparent", fontFamily: "inherit",
                    fontSize: 15, color: "var(--text)",
                  }}
                />
              </div>
            </label>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Textarea
              label="Observações"
              value={form.notes}
              onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
              placeholder="Contexto, histórico, dúvidas, necessidades..."
              rows={3}
            />
          </div>

          {error && (
            <div style={{
              gridColumn: "1 / -1",
              padding: "12px 16px", borderRadius: 12,
              background: "#FFF1F2", border: "1px solid #FECDD3",
              fontSize: 13, color: "#E11D48",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <IconX size={14} /> {error}
            </div>
          )}

          {success && (
            <div style={{
              gridColumn: "1 / -1",
              padding: "12px 16px", borderRadius: 12,
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              fontSize: 13, color: "#15803D",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <IconCheck size={14} /> Contato salvo com sucesso!
            </div>
          )}

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              icon={<IconPlus />}
            >
              {submitting ? "Salvando..." : editing ? "Salvar contato" : "Registrar contato"}
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={resetForm}>
              {editing ? "Cancelar" : "Limpar"}
            </Button>
          </div>
        </form>
      </Card>

      {/* ── Contacts list ── */}
      <Card padding={28}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionTitle>Fila de novos contatos</SectionTitle>
          <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500 }}>
            {contacts.length} {contacts.length === 1 ? "contato" : "contatos"}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, marginTop: -8 }}>
          Acompanhe o funil e converta para membro quando o acompanhamento começar.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contacts.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
              Nenhum contato registrado ainda.
            </p>
          )}
          {contacts.map((contact) => {
            const col = statusColors[contact.status] ?? statusColors.new;
            const caregiver = caregivers.find((c) => c.id === contact.caregiverId);
            return (
              <div
                key={contact.id}
                style={{
                  padding: "16px 18px",
                  borderRadius: 14,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <Avatar name={contact.referenceName} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
                          {contact.referenceName}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                          {contact.phone || "Sem telefone"} • {contact.city || "Sem cidade"}
                        </div>
                      </div>
                      <span style={{
                        padding: "4px 10px", borderRadius: 999,
                        background: col.bg, color: col.fg,
                        fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap",
                      }}>
                        {statusLabels[contact.status]}
                      </span>
                    </div>

                    {contact.notes && (
                      <p style={{
                        marginTop: 8, fontSize: 13, color: "var(--text-2)",
                        lineHeight: 1.5,
                      }}>
                        {contact.notes}
                      </p>
                    )}

                    <div style={{
                      marginTop: 8, fontSize: 12, color: "var(--text-3)",
                      display: "flex", gap: 16, flexWrap: "wrap",
                    }}>
                      {contact.source && <span>Origem: {contact.source}</span>}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <IconUsers size={11} />
                        {caregiver?.name ?? "Sem cuidador"}
                      </span>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => openEdit(contact)}
                        style={{
                          padding: "6px 14px", borderRadius: 8,
                          background: "var(--surface)",
                          border: "1.5px solid var(--border)",
                          color: "var(--text)",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => convertContact(contact)}
                        disabled={convertingId === contact.id || contact.status === "in_progress"}
                        style={{
                          padding: "6px 14px", borderRadius: 8,
                          background: contact.status === "in_progress" ? "#F3E8FF" : "var(--accent)",
                          border: "1.5px solid transparent",
                          color: contact.status === "in_progress" ? "#7C3AED" : "#fff",
                          fontSize: 13, fontWeight: 600,
                          cursor: (convertingId === contact.id || contact.status === "in_progress") ? "not-allowed" : "pointer",
                          opacity: convertingId === contact.id ? 0.6 : 1,
                          fontFamily: "inherit",
                        }}
                      >
                        {convertingId === contact.id
                          ? "Convertendo..."
                          : contact.status === "in_progress"
                          ? "Já é membro"
                          : "→ Converter em membro"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
