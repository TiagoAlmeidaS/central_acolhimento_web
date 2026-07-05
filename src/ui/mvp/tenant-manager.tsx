"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/server/domain/mvp";
import {
  Card,
  Button,
  Input,
  Select,
  SectionTitle,
} from "@/ui/v2-components/ui";
import {
  IconBuilding,
  IconMapPin,
  IconUser,
  IconCheck,
  IconPlus,
} from "@/ui/v2-components/icons";

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
  const [success, setSuccess] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setSuccess(false);
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
    setSuccess(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

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
      setError(payload.error ?? "Não foi possível salvar a cidade.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    openCreate();
    setSubmitting(false);
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr" }}>
      {/* ── Form panel ── */}
      <Card padding={28}>
        <SectionTitle>
          {editing ? "Editar localidade" : "Nova localidade"}
        </SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, marginTop: -8 }}>
          Cada localidade representa uma unidade operacional da Central.
        </p>

        <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input
              label="Nome da localidade"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Ex: AD Curitiba"
              icon={<IconBuilding />}
              required
            />
            <Input
              label="Coordenador"
              value={form.coordinator}
              onChange={(v) => setForm((f) => ({ ...f, coordinator: v }))}
              placeholder="Nome do responsável"
              icon={<IconUser />}
            />
            <Input
              label="Cidade"
              value={form.city}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              placeholder="Curitiba"
              icon={<IconMapPin />}
              required
            />
            <Input
              label="Estado (UF)"
              value={form.state}
              onChange={(v) => setForm((f) => ({ ...f, state: v.toUpperCase().slice(0, 2) }))}
              placeholder="PR"
              required
            />
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v as "active" | "inactive" }))}
            options={[
              { value: "active", label: "Ativa" },
              { value: "inactive", label: "Inativa" },
            ]}
          />

          {error && (
            <div style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "#FFF1F2",
              border: "1px solid #FECDD3",
              fontSize: 13,
              color: "#E11D48",
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              fontSize: 13,
              color: "#15803D",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <IconCheck size={16} /> Localidade salva com sucesso!
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
              {submitting ? "Salvando..." : editing ? "Salvar localidade" : "Criar localidade"}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" size="md" onClick={openCreate}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* ── List panel ── */}
      <Card padding={28}>
        <SectionTitle>Localidades cadastradas</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, marginTop: -8 }}>
          Clique para editar dados de cada unidade.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tenants.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
              Nenhuma localidade cadastrada ainda.
            </p>
          )}
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => openEdit(tenant)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 18px",
                borderRadius: 14,
                background: editing?.id === tenant.id ? "var(--accent-bg)" : "var(--surface-2)",
                border: editing?.id === tenant.id
                  ? "1.5px solid var(--accent)"
                  : "1.5px solid var(--border)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "border-color .15s, background .15s",
              }}
            >
              <div>
                <div style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                }}>
                  {tenant.name}
                </div>
                <div style={{
                  fontSize: 12.5,
                  color: "var(--text-2)",
                  marginTop: 2,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <IconMapPin size={12} color="var(--accent)" />
                  {tenant.city} – {tenant.state}
                </div>
              </div>
              <span style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: tenant.status === "active" ? "#16A34A" : "var(--text-3)",
                background: tenant.status === "active" ? "#F0FDF4" : "var(--surface)",
                border: `1px solid ${tenant.status === "active" ? "#BBF7D0" : "var(--border)"}`,
                padding: "4px 10px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}>
                {tenant.status === "active" ? "Ativa" : "Inativa"}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
