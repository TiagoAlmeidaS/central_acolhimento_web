"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Tenant } from "@/server/domain/mvp";
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
  IconBuilding,
  IconCheck,
  IconPlus,
  IconX,
} from "@/ui/v2-components/icons";

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
  const [success, setSuccess] = useState(false);

  function resetForm() {
    setEditing(null);
    setForm({ ...emptyForm, tenantId: tenants[0]?.id ?? "" });
    setError(null);
    setSuccess(false);
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
    setSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const response = await fetch(
      editing ? `/api/caregivers/${editing.id}` : "/api/caregivers",
      {
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
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Não foi possível salvar o cuidador.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    resetForm();
    setSubmitting(false);
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr" }}>
      {/* ── Form panel ── */}
      <Card padding={28}>
        <SectionTitle>
          {editing ? "Editar cuidador" : "Novo cuidador"}
        </SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, marginTop: -8 }}>
          Cadastre quem vai acompanhar pessoas dentro de cada localidade.
        </p>

        <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
          <Select
            label="Localidade"
            value={form.tenantId}
            onChange={(v) => setForm((f) => ({ ...f, tenantId: v }))}
            options={tenants.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Selecione a localidade"
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input
              label="Nome completo"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Ex: Ana Lima"
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
          </div>

          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="email@exemplo.com"
          />

          <Textarea
            label="Observações"
            value={form.notes}
            onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="Contexto, disponibilidade, região de atuação..."
            rows={3}
          />

          {/* Active toggle */}
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 12,
              background: form.active ? "#F0FDF4" : "var(--surface-2)",
              border: `1.5px solid ${form.active ? "#BBF7D0" : "var(--border)"}`,
              cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              background: form.active ? "#16A34A" : "var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {form.active && <IconCheck size={12} color="#fff" />}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
              Cuidador ativo
            </span>
          </button>

          {error && (
            <div style={{
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
              padding: "12px 16px", borderRadius: 12,
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              fontSize: 13, color: "#15803D",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <IconCheck size={14} /> Cuidador salvo com sucesso!
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              icon={<IconPlus />}
            >
              {submitting ? "Salvando..." : editing ? "Salvar cuidador" : "Criar cuidador"}
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={resetForm}>
              {editing ? "Cancelar" : "Limpar"}
            </Button>
          </div>
        </form>
      </Card>

      {/* ── List panel ── */}
      <Card padding={28}>
        <SectionTitle>Cuidadores cadastrados</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, marginTop: -8 }}>
          Selecione um cuidador para editar dados e disponibilidade.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {caregivers.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
              Nenhum cuidador cadastrado ainda.
            </p>
          )}
          {caregivers.map((caregiver) => {
            const tenant = tenants.find((t) => t.id === caregiver.tenantId);
            return (
              <button
                key={caregiver.id}
                type="button"
                onClick={() => openEdit(caregiver)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 14,
                  background: editing?.id === caregiver.id ? "var(--accent-bg)" : "var(--surface-2)",
                  border: editing?.id === caregiver.id
                    ? "1.5px solid var(--accent)"
                    : "1.5px solid var(--border)",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  transition: "border-color .15s, background .15s",
                }}
              >
                <Avatar name={caregiver.name} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14.5, fontWeight: 700, color: "var(--text)",
                    letterSpacing: "-0.01em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {caregiver.name}
                  </div>
                  <div style={{
                    fontSize: 12.5, color: "var(--text-2)", marginTop: 2,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <IconBuilding size={12} color="var(--accent)" />
                    {tenant?.name ?? "Localidade não definida"}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                  background: caregiver.active ? "#DCFCE7" : "#F4F4F5",
                  color: caregiver.active ? "#15803D" : "#71717A",
                  whiteSpace: "nowrap",
                }}>
                  {caregiver.active ? "Ativo" : "Inativo"}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
