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
  IconMapPin,
  IconClock,
  IconVideo,
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
function parseScheduledNotes(notesText: string, defaultType: string) {
  const isScheduled = notesText.startsWith("Agendado:");
  if (!isScheduled) {
    return {
      isScheduled: false,
      title: `Acompanhamento: ${defaultType}`,
      duration: "30 min",
      location: "Não informado",
      notes: notesText,
    };
  }

  const titleMatch = notesText.match(/📌 Título:\s*(.*)/);
  const durationMatch = notesText.match(/⏱️ Duração:\s*(.*)/);
  const locationMatch = notesText.match(/📍 Local:\s*(.*)/);
  const notesMatch = notesText.match(/📝 Notas:\s*([\s\S]*)/);

  return {
    isScheduled: true,
    title: titleMatch ? titleMatch[1].trim() : "Compromisso",
    duration: durationMatch ? durationMatch[1].trim() : "60 min",
    location: locationMatch ? locationMatch[1].trim() : "Presencial",
    notes: notesMatch ? notesMatch[1].trim() : "",
  };
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "schedule">("history");

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
    setIsFormOpen(false);
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
    setIsFormOpen(true);
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      
      {/* ── Form View (Only shown when isFormOpen is true) ── */}
      {isFormOpen ? (
        <Card padding={28}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => resetForm()}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text)",
              }}
            >
              ←
            </button>
            <SectionTitle>
              {editing ? "Editar acompanhamento" : "Registrar acompanhamento"}
            </SectionTitle>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, marginTop: -8 }}>
            Registre cada ação de cuidado e a próxima movimentação da jornada pastoral.
          </p>

          <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
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
                {submitting ? "Salvando..." : editing ? "Salvar alterações" : "Salvar acompanhamento"}
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={() => resetForm()}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : (() => {
        const now = new Date();

        // Sort history: latest occurred first
        const historyFollowups = [...followups]
          .filter((f) => !f.nextActionAt || new Date(f.nextActionAt) <= now)
          .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

        // Sort schedule: soonest scheduled first
        const scheduledFollowups = [...followups]
          .filter((f) => f.nextActionAt && new Date(f.nextActionAt) > now)
          .sort((a, b) => new Date(a.nextActionAt!).getTime() - new Date(b.nextActionAt!).getTime());

        const totalUpcoming = scheduledFollowups.length;
        const visitsCount = scheduledFollowups.filter((f) => f.type === "visit").length;
        const callsCount = scheduledFollowups.filter((f) => f.type === "call").length;
        const otherCount = scheduledFollowups.filter((f) => f.type !== "visit" && f.type !== "call").length;

        return (
          <Card padding={28}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div>
                <SectionTitle>Acompanhamento Pastoral</SectionTitle>
                <p style={{ fontSize: 13, color: "var(--text-2)", margin: "4px 0 0" }}>
                  Gerencie o histórico e a programação futura de visitas e ligações.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={<IconPlus />}
                onClick={() => {
                  resetForm();
                  setIsFormOpen(true);
                }}
              >
                Novo Registro
              </Button>
            </div>

            {/* Tabs Switcher Header */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                style={{
                  padding: "12px 18px",
                  border: 0,
                  background: "transparent",
                  borderBottom: activeTab === "history" ? "3px solid var(--accent)" : "3px solid transparent",
                  color: activeTab === "history" ? "var(--text)" : "var(--text-3)",
                  fontSize: 14,
                  fontWeight: activeTab === "history" ? 700 : 500,
                  cursor: "pointer",
                  transition: "all .15s",
                  fontFamily: "inherit",
                }}
              >
                Histórico ({historyFollowups.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                style={{
                  padding: "12px 18px",
                  border: 0,
                  background: "transparent",
                  borderBottom: activeTab === "schedule" ? "3px solid var(--accent)" : "3px solid transparent",
                  color: activeTab === "schedule" ? "var(--text)" : "var(--text-3)",
                  fontSize: 14,
                  fontWeight: activeTab === "schedule" ? 700 : 500,
                  cursor: "pointer",
                  transition: "all .15s",
                  fontFamily: "inherit",
                }}
              >
                Programação ({scheduledFollowups.length})
              </button>
            </div>

            {/* TAB CONTENT: HISTORY */}
            {activeTab === "history" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {historyFollowups.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
                    Nenhum histórico registrado ainda.
                  </p>
                ) : (
                  historyFollowups.map((followup) => {
                    const member = members.find((m) => m.id === followup.memberId);
                    const isUrgent = !!member?.isUrgent;
                    return (
                      <button
                        key={followup.id}
                        type="button"
                        onClick={() => openEdit(followup)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "14px 16px", borderRadius: 14,
                          background: "var(--surface-2)",
                          border: isUrgent ? "1.5px solid #FECDD3" : "1.5px solid var(--border)",
                          borderLeft: isUrgent ? "4px solid #E11D48" : undefined,
                          cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                          transition: "border-color .15s, background .15s",
                          width: "100%",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = isUrgent ? "#E11D48" : "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isUrgent ? "#FECDD3" : "var(--border)";
                        }}
                      >
                        <Avatar name={followup.member ?? "?"} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div style={{
                              fontSize: 14.5, fontWeight: 700, color: "var(--text)",
                              letterSpacing: "-0.01em",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              display: "flex", alignItems: "center", gap: 6,
                            }}>
                              {followup.member ?? "Sem membro"}
                              {isUrgent && (
                                <span style={{
                                  background: "#FFF1F2", color: "#E11D48",
                                  fontSize: 9.5, fontWeight: 800, padding: "1px 5px",
                                  borderRadius: 4, textTransform: "uppercase", border: "1px solid #FECDD3",
                                }}>
                                  Urgente
                                </span>
                              )}
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
                              margin: "4px 0 0",
                            }}>
                              {followup.notes}
                            </p>
                          )}
                          <div style={{
                            marginTop: 6, fontSize: 12, color: "var(--text-3)",
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            <span>Aconteceu em: {new Date(followup.occurredAt).toLocaleDateString("pt-BR")}</span>
                            {followup.nextActionAt && (
                              <span style={{ color: "var(--accent)", fontWeight: 500 }}>
                                • Próxima: {new Date(followup.nextActionAt).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT: SCHEDULE */}
            {activeTab === "schedule" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Stats Summary */}
                <div style={{ padding: "0 0 4px" }}>
                  <Card padding={16} style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "var(--accent-bg)", color: "var(--accent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}><IconCalendar size={22} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                          {totalUpcoming} {totalUpcoming === 1 ? "reunião programada" : "reuniões programadas"}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                          {visitsCount} {visitsCount === 1 ? "visita" : "visitas"} · {callsCount} {callsCount === 1 ? "ligação" : "ligações"} · {otherCount} {otherCount === 1 ? "outros" : "outros"}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Scheduled Cards List */}
                {scheduledFollowups.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
                    Nenhuma programação pendente.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {scheduledFollowups.map((followup) => {
                      const parsed = parseScheduledNotes(followup.notes, typeLabels[followup.type]);
                      const member = members.find((m) => m.id === followup.memberId);
                      const isUrgent = !!member?.isUrgent;
                      const isOnline = parsed.location.toLowerCase().includes("http") || parsed.location.toLowerCase().includes("online") || parsed.location.toLowerCase().includes("vídeo") || parsed.location.toLowerCase().includes("video");

                      const dateFormatted = new Date(followup.nextActionAt!).toLocaleString("pt-BR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <Card
                          key={followup.id}
                          padding={0}
                          onClick={() => openEdit(followup)}
                          style={{
                            overflow: "hidden",
                            cursor: "pointer",
                            border: isUrgent ? "1.5px solid #FECDD3" : "1.5px solid var(--border)",
                            background: "var(--surface)",
                            transition: "border-color .15s, transform .1s",
                            width: "100%",
                          }}
                          hoverable
                        >
                          <div style={{ display: "flex", alignItems: "stretch" }}>
                            <div style={{
                              width: 6,
                              background: isUrgent ? "#E11D48" : "var(--accent)",
                              flexShrink: 0,
                            }} />
                            <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column" }}>
                              <div style={{
                                display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                                fontSize: 12, color: isUrgent ? "#E11D48" : "var(--accent)",
                                fontWeight: 700, letterSpacing: "-0.005em",
                              }}>
                                <IconClock size={14} />
                                <span style={{ textTransform: "capitalize" }}>{dateFormatted}</span>
                                <span style={{ color: "var(--text-3)", fontWeight: 500 }}>· {parsed.duration}</span>
                              </div>
                              <div style={{
                                fontSize: 15, fontWeight: 700, color: "var(--text)",
                                letterSpacing: "-0.015em", marginBottom: 6,
                              }}>{parsed.title}</div>
                              <div style={{
                                display: "flex", alignItems: "center", gap: 12,
                                fontSize: 12.5, color: "var(--text-2)", flexWrap: "wrap",
                              }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                                  {isOnline ? <IconVideo size={13} /> : <IconMapPin size={13} />}
                                  {parsed.location}
                                </span>
                                {member && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                                    <Avatar name={member.name} size={22} />
                                    <span style={{ fontWeight: 600, color: "var(--text)" }}>
                                      {member.name.split(" ")[0]}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })()}
    </div>
  );
}
