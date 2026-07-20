"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Tenant } from "@/server/domain/mvp";
import {
  Avatar,
  Button,
  Card,
  Input,
  SectionTitle,
  Select,
  Textarea,
} from "@/ui/v2-components/ui";
import {
  IconBuilding,
  IconCheck,
  IconPhone,
  IconPlus,
  IconUser,
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

const accessInputStyle = {
  height: 38,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: 12.5,
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
  const [busyAccessId, setBusyAccessId] = useState<string | null>(null);
  const [accessForms, setAccessForms] = useState<Record<string, { email: string; password: string }>>({});
  const [accessNotice, setAccessNotice] = useState<string | null>(null);
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

  function getAccessForm(caregiver: Caregiver) {
    return accessForms[caregiver.id] ?? { email: caregiver.email ?? "", password: "" };
  }

  function updateAccessForm(caregiverId: string, patch: Partial<{ email: string; password: string }>) {
    setAccessForms((current) => ({
      ...current,
      [caregiverId]: {
        email: current[caregiverId]?.email ?? "",
        password: current[caregiverId]?.password ?? "",
        ...patch,
      },
    }));
    setAccessNotice(null);
    setError(null);
  }

  function generatePassword(caregiverId: string) {
    const suffix = Math.floor(100000 + Math.random() * 900000);
    updateAccessForm(caregiverId, { password: `Central@${suffix}` });
  }

  async function copyAccessNotice() {
    if (!accessNotice) return;
    await navigator.clipboard.writeText(accessNotice);
  }

  async function createCaregiverAccess(caregiver: Caregiver) {
    const accessForm = getAccessForm(caregiver);
    if (!accessForm.email || !accessForm.password) {
      setError("Informe e-mail e senha inicial para criar o acesso.");
      return;
    }

    setBusyAccessId(caregiver.id);
    setError(null);
    setAccessNotice(null);

    const response = await fetch(`/api/caregivers/${caregiver.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: accessForm.email,
        password: accessForm.password,
      }),
    });

    setBusyAccessId(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel criar o acesso do cuidador.");
      return;
    }

    setAccessNotice(
      [
        `Ola, ${caregiver.name}! Seu acesso a Central de Acolhimento foi criado.`,
        "",
        `E-mail: ${accessForm.email}`,
        `Senha inicial: ${accessForm.password}`,
        "",
        "Acesse a plataforma pelo link de login enviado pela coordenacao.",
      ].join("\n"),
    );
    setAccessForms((current) => {
      const next = { ...current };
      delete next[caregiver.id];
      return next;
    });
    startTransition(() => router.refresh());
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
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel salvar o cuidador.");
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
      <Card padding={28}>
        <SectionTitle>{editing ? "Editar cuidador" : "Novo cuidador"}</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, marginTop: -8 }}>
          Cadastre quem vai acompanhar pessoas dentro de cada localidade.
        </p>

        <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
          <Select
            label="Localidade"
            value={form.tenantId}
            onChange={(value) => setForm((current) => ({ ...current, tenantId: value }))}
            options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
            placeholder="Selecione a localidade"
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input
              label="Nome completo"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="Ex: Ana Lima"
              icon={<IconUser />}
              required
            />
            <Input
              label="Telefone"
              value={form.phone}
              onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              placeholder="(00) 90000-0000"
              icon={<IconPhone />}
            />
          </div>

          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            placeholder="email@exemplo.com"
          />

          <Textarea
            label="Observacoes"
            value={form.notes}
            onChange={(value) => setForm((current) => ({ ...current, notes: value }))}
            placeholder="Contexto, disponibilidade, regiao de atuacao..."
            rows={3}
          />

          <button
            type="button"
            onClick={() => setForm((current) => ({ ...current, active: !current.active }))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 12,
              background: form.active ? "#F0FDF4" : "var(--surface-2)",
              border: `1.5px solid ${form.active ? "#BBF7D0" : "var(--border)"}`,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                background: form.active ? "#16A34A" : "var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {form.active ? <IconCheck size={12} color="#fff" /> : null}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Cuidador ativo</span>
          </button>

          {error ? (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "#FFF1F2",
                border: "1px solid #FECDD3",
                fontSize: 13,
                color: "#E11D48",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <IconX size={14} /> {error}
            </div>
          ) : null}

          {accessNotice ? (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                fontSize: 13,
                color: "#15803D",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span>Acesso criado. Mensagem pronta para enviar ao cuidador.</span>
              <button
                type="button"
                onClick={copyAccessNotice}
                style={{
                  border: "1px solid #BBF7D0",
                  background: "#fff",
                  color: "#15803D",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Copiar mensagem
              </button>
            </div>
          ) : null}

          {success ? (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                fontSize: 13,
                color: "#15803D",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <IconCheck size={14} /> Cuidador salvo com sucesso!
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Button type="submit" variant="primary" size="md" disabled={submitting} icon={<IconPlus />}>
              {submitting ? "Salvando..." : editing ? "Salvar cuidador" : "Criar cuidador"}
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={resetForm}>
              {editing ? "Cancelar" : "Limpar"}
            </Button>
          </div>
        </form>
      </Card>

      <Card padding={28}>
        <SectionTitle>Cuidadores cadastrados</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, marginTop: -8 }}>
          Selecione um cuidador para editar dados, disponibilidade e acesso.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {caregivers.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
              Nenhum cuidador cadastrado ainda.
            </p>
          ) : null}

          {caregivers.map((caregiver) => {
            const tenant = tenants.find((item) => item.id === caregiver.tenantId);
            const accessForm = getAccessForm(caregiver);
            return (
              <div
                key={caregiver.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: editing?.id === caregiver.id ? "var(--accent-bg)" : "var(--surface-2)",
                  border: editing?.id === caregiver.id ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                  transition: "border-color .15s, background .15s",
                }}
              >
                <button
                  type="button"
                  onClick={() => openEdit(caregiver)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <Avatar name={caregiver.name} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: "var(--text)",
                        letterSpacing: "-0.01em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {caregiver.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-2)",
                        marginTop: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <IconBuilding size={12} color="var(--accent)" />
                      {tenant?.name ?? "Localidade nao definida"}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: caregiver.active ? "#DCFCE7" : "#F4F4F5",
                      color: caregiver.active ? "#15803D" : "#71717A",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {caregiver.active ? "Ativo" : "Inativo"}
                  </span>
                </button>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  {caregiver.tenantUserId ? (
                    <div style={{ fontSize: 12.5, color: "#15803D", fontWeight: 700 }}>
                      Acesso ativo vinculado a este cuidador.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 600 }}>
                        Sem acesso. Crie login sem duplicar o cuidador nem perder os membros atribuidos.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <input
                          type="email"
                          value={accessForm.email}
                          onChange={(event) => updateAccessForm(caregiver.id, { email: event.target.value })}
                          placeholder="email do cuidador"
                          style={accessInputStyle}
                        />
                        <input
                          type="text"
                          value={accessForm.password}
                          onChange={(event) => updateAccessForm(caregiver.id, { password: event.target.value })}
                          placeholder="senha inicial"
                          style={accessInputStyle}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button type="button" size="sm" variant="secondary" onClick={() => generatePassword(caregiver.id)}>
                          Sugerir senha
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => createCaregiverAccess(caregiver)}
                          disabled={busyAccessId === caregiver.id}
                        >
                          {busyAccessId === caregiver.id ? "Criando..." : "Criar acesso"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
