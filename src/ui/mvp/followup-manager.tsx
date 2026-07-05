"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Followup, Member, Tenant } from "@/server/domain/mvp";
import {
  Card,
  Button,
  Select,
  Textarea,
  SectionTitle,
  Avatar,
} from "@/ui/v2-components/ui";
import {
  IconCalendar,
  IconCheck,
  IconPlus,
  IconX,
  IconPhone,
  IconMessage,
  IconHeart,
  IconDoc,
  IconHome,
} from "@/ui/v2-components/icons";

const typeLabels: Record<Followup["type"], string> = {
  visit: "Visita",
  call: "Ligação",
  message: "Mensagem",
  prayer: "Oração",
  other: "Outro",
};

const typeIcons: Record<Followup["type"], React.ReactNode> = {
  visit: <IconHome size={14} />,
  call: <IconPhone size={14} />,
  message: <IconMessage size={14} />,
  prayer: <IconHeart size={14} />,
  other: <IconDoc size={14} />,
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

// Styled native datetime-local input
function DateTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{
        fontSize: 13.5, fontWeight: 600,
        color: "var(--text)", letterSpacing: "-0.005em",
      }}>
        {label}
      </span>
      <div style={{
        display: "flex", alignItems: "center", height: 54,
        padding: "0 18px",
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        borderRadius: 14,
      }}>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, border: 0, outline: "none",
            background: "transparent", fontFamily: "inherit",
            fontSize: 15, color: "var(--text)", letterSpacing: "-0.005em",
          }}
        />
      </div>
    </label>
  );
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
  const [success, setSuccess] = useState(false);

  function resetForm() {
    setEditing(null);
    setForm({
      ...emptyForm,
      tenantId: tenants[0]?.id ?? "",
      memberId: members[0]?.id ?? "",
      occurredAt: toDateTimeLocal(new Date().toISOString()),
    });
    setError(null);
    setSuccess(false);
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
    setSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const response = await fetch(
      editing ? `/api/followups/${editing.id}` : "/api/followups",
      {
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
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Não foi possível salvar o acompanhamento.");
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
      {/* ── Form ── */}
      <Card padding={28}>
        <SectionTitle>
          {editing ? "Editar acompanhamento" : "Registrar acompanhamento"}
        </SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, marginTop: -8 }}>
          Registre cada ação de cuidado e a próxima movimentação da jornada pastoral.
        </p>

        <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Select
              label="Localidade"
              value={form.tenantId}
              onChange={(v) => setForm((f) => ({ ...f, tenantId: v }))}
              options={tenants.map((t) => ({ value: t.id, label: t.name }))}
              placeholder="Localidade"
              required
            />
            <Select
              label="Pessoa acompanhada"
              value={form.memberId}
              onChange={(v) => setForm((f) => ({ ...f, memberId: v }))}
              options={members.map((m) => ({ value: m.id, label: m.name }))}
              placeholder="Selecione a pessoa"
              required
            />
            <Select
              label="Cuidador"
              value={form.caregiverId}
              onChange={(v) => setForm((f) => ({ ...f, caregiverId: v }))}
              options={[
                { value: "", label: "Sem cuidador" },
                ...caregivers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="Tipo de ação"
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v as Followup["type"] }))}
              options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <DateTimeInput
            label="Quando aconteceu"
            value={form.occurredAt}
            onChange={(v) => setForm((f) => ({ ...f, occurredAt: v }))}
          />

          <DateTimeInput
            label="Próxima ação programada"
            value={form.nextActionAt}
            onChange={(v) => setForm((f) => ({ ...f, nextActionAt: v }))}
          />

          <Textarea
            label="Observações"
            value={form.notes}
            onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="Como foi a conversa, como a pessoa está, próximos passos..."
            rows={4}
          />

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
              <IconCheck size={14} /> Acompanhamento salvo com sucesso!
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              icon={<IconPlus />}
            >
              {submitting ? "Salvando..." : editing ? "Salvar acompanhamento" : "Criar acompanhamento"}
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={resetForm}>
              {editing ? "Cancelar" : "Limpar"}
            </Button>
          </div>
        </form>
      </Card>

      {/* ── Timeline list ── */}
      <Card padding={28}>
        <SectionTitle>Timeline editável</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, marginTop: -8 }}>
          Clique num registro para abrir e editar observações e próxima ação.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {followups.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
              Nenhum acompanhamento registrado ainda.
            </p>
          )}
          {followups.map((followup) => {
            const member = members.find((m) => m.id === followup.memberId);
            return (
              <button
                key={followup.id}
                type="button"
                onClick={() => openEdit(followup)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "14px 16px", borderRadius: 14,
                  background: editing?.id === followup.id ? "var(--accent-bg)" : "var(--surface-2)",
                  border: editing?.id === followup.id
                    ? "1.5px solid var(--accent)"
                    : "1.5px solid var(--border)",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  transition: "border-color .15s, background .15s",
                }}
              >
                <Avatar name={followup.member ?? "?"} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{
                      fontSize: 14.5, fontWeight: 700, color: "var(--text)",
                      letterSpacing: "-0.01em",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {followup.member ?? "Sem membro"}
                    </div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 999,
                      background: "var(--accent-bg)",
                      color: "var(--accent)",
                      fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {typeIcons[followup.type]}
                      {typeLabels[followup.type]}
                    </span>
                  </div>
                  {followup.notes && (
                    <p style={{
                      marginTop: 4, fontSize: 12.5, color: "var(--text-2)",
                      lineHeight: 1.4,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {followup.notes}
                    </p>
                  )}
                  {followup.nextActionAt && (
                    <div style={{
                      marginTop: 6, fontSize: 12, color: "var(--accent)",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <IconCalendar size={12} />
                      Próxima: {new Date(followup.nextActionAt).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
