"use client";

import React, { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthSession, Caregiver, Followup, Member, Seed, Tenant } from "@/server/domain/mvp";
import {
  Avatar,
  Button,
  Card,
  Input,
  SearchInput,
  Select,
  StatusFilterRow,
  StatusPill,
  Textarea,
} from "@/ui/v2-components/ui";
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconDoc,
  IconHeart,
  IconMapPin,
  IconMessage,
  IconPhone,
  IconPlus,
  IconUser,
  IconUsers,
  IconWhatsappFilled,
  IconX,
} from "@/ui/v2-components/icons";

interface Props {
  initialMembers: Member[];
  initialSeeds: Seed[];
  initialFollowups: Followup[];
  session: AuthSession;
  tenants: Tenant[];
}

type TabType = "home" | "details" | "new" | "schedule";

// Status mapping helper for the V2 UI
const STATUS_MAP: Record<string, string> = {
  new: "aguardando",
  contacted: "aguardando",
  in_progress: "acompanhamento",
  consolidated: "concluido",
  inactive: "concluido",
  // V2 UI values mapping to themselves
  urgente: "urgente",
  aguardando: "aguardando",
  acompanhamento: "acompanhamento",
  concluido: "concluido",
};

const typeIcons: Record<Followup["type"], React.ReactNode> = {
  visit: <IconUser size={13} />,
  call: <IconPhone size={13} />,
  message: <IconMessage size={13} />,
  prayer: <IconHeart size={13} />,
  other: <IconDoc size={13} />,
};

const typeLabels: Record<Followup["type"], string> = {
  visit: "Visita",
  call: "Ligação",
  message: "Mensagem",
  prayer: "Oração",
  other: "Outro",
};

export function CaregiverDashboardClient({
  initialMembers,
  initialSeeds,
  initialFollowups,
  session,
  tenants,
}: Props) {
  const router = useRouter();

  // Navigation and selection state
  const [tab, setTab] = useState<TabType>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<"member" | "seed" | null>(null);

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Form states
  const [novaNota, setNovaNota] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Brother Form
  const [newForm, setNewForm] = useState({
    name: "",
    phone: "",
    city: session.membership.tenantCity ?? "",
    status: "new",
    notes: "",
  });

  // Schedule Reunion Form
  const [scheduleForm, setScheduleForm] = useState({
    dateTime: "",
    type: "visit" as Followup["type"],
    notes: "",
  });

  // Unify members and seeds into one search list
  const unifiedList = useMemo(() => {
    const list: Array<{
      id: string;
      kind: "member" | "seed";
      name: string;
      city: string;
      phone: string;
      status: string;
      lastContact: string;
      notes: string;
      address?: string;
    }> = [];

    initialMembers.forEach((m) => {
      list.push({
        id: m.id,
        kind: "member",
        name: m.name,
        city: m.city || "",
        phone: m.phone || "",
        status: STATUS_MAP[m.status] ?? "acompanhamento",
        lastContact: m.lastContact ?? "Nunca contatado",
        notes: m.notes || "",
        address: m.address || "",
      });
    });

    initialSeeds.forEach((s) => {
      list.push({
        id: s.id,
        kind: "seed",
        name: s.referenceName,
        city: s.city || "",
        phone: s.phone || "",
        status: STATUS_MAP[s.status] ?? "aguardando",
        lastContact: "Novo contato",
        notes: s.notes || "",
      });
    });

    return list;
  }, [initialMembers, initialSeeds]);

  // Filter and search logic
  const filteredList = useMemo(() => {
    return unifiedList.filter((item) => {
      // 1. Status Filter
      if (filter !== "all" && item.status !== filter) {
        return false;
      }
      // 2. Text Search
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCity = item.city.toLowerCase().includes(q);
        return matchName || matchCity;
      }
      return true;
    });
  }, [unifiedList, filter, query]);

  // Find selected entity
  const selectedEntity = useMemo(() => {
    if (!selectedId) return null;
    return unifiedList.find((x) => x.id === selectedId) || null;
  }, [unifiedList, selectedId]);

  // Selected member's followups
  const selectedFollowups = useMemo(() => {
    if (!selectedId || selectedKind !== "member") return [];
    return initialFollowups.filter((f) => f.memberId === selectedId);
  }, [initialFollowups, selectedId, selectedKind]);

  // Open detailed view
  function handleOpen(id: string, kind: "member" | "seed") {
    setSelectedId(id);
    setSelectedKind(kind);
    setTab("details");
    setNovaNota("");
    setError(null);
  }

  // Go back
  function handleBack() {
    if (tab === "schedule") {
      setTab("details");
    } else {
      setTab("home");
      setSelectedId(null);
      setSelectedKind(null);
    }
    setError(null);
  }

  // Quick action followup log
  async function handleQuickAction(type: Followup["type"], noteLabel: string) {
    if (!selectedId || selectedKind !== "member") return;
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: session.membership.tenantId,
        memberId: selectedId,
        caregiverId: session.membership.caregiverId,
        type,
        occurredAt: new Date().toISOString(),
        notes: noteLabel,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Não foi possível registrar o contato rápido.");
      return;
    }

    startTransition(() => router.refresh());
  }

  // Add custom timeline note
  async function handleAddNote() {
    if (!novaNota.trim() || !selectedId || selectedKind !== "member") return;
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: session.membership.tenantId,
        memberId: selectedId,
        caregiverId: session.membership.caregiverId,
        type: "other",
        occurredAt: new Date().toISOString(),
        notes: novaNota.trim(),
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Erro ao salvar anotação.");
      return;
    }

    setNovaNota("");
    startTransition(() => router.refresh());
  }

  // Convert seed to full member
  async function handleConvert() {
    if (!selectedId || selectedKind !== "seed") return;
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/seeds/${selectedId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caregiverId: session.membership.caregiverId,
        notes: selectedEntity?.notes ?? "",
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Falha ao converter contato em membro.");
      return;
    }

    // Go back to home page
    setTab("home");
    setSelectedId(null);
    setSelectedKind(null);
    startTransition(() => router.refresh());
  }

  // Create new contact (seed)
  async function handleCreateNew(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.name) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/seeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: session.membership.tenantId,
        caregiverId: session.membership.caregiverId,
        referenceName: newForm.name,
        phone: newForm.phone,
        city: newForm.city,
        status: "new",
        notes: newForm.notes,
        source: "Cuidador",
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Falha ao cadastrar novo contato.");
      return;
    }

    setNewForm({
      name: "",
      phone: "",
      city: session.membership.tenantCity ?? "",
      status: "new",
      notes: "",
    });
    setTab("home");
    startTransition(() => router.refresh());
  }

  // Save next action (schedule reunion)
  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleForm.dateTime || !selectedId) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: session.membership.tenantId,
        memberId: selectedId,
        caregiverId: session.membership.caregiverId,
        type: scheduleForm.type,
        occurredAt: new Date().toISOString(),
        notes: `Agendado: ${scheduleForm.notes || typeLabels[scheduleForm.type]}`,
        nextActionAt: new Date(scheduleForm.dateTime).toISOString(),
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Erro ao agendar compromisso.");
      return;
    }

    setScheduleForm({
      dateTime: "",
      type: "visit",
      notes: "",
    });
    setTab("details");
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ position: "relative", minHeight: "100%", background: "var(--bg)" }}>
      
      {/* ─────────────────────────────────────────────────────────────
          1. LIST TAB (HOME)
          ───────────────────────────────────────────────────────────── */}
      {tab === "home" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Header */}
          <div style={{
            padding: "24px 22px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500, marginBottom: 2 }}>
                Olá, {session.user.firstName}
              </div>
              <h1 style={{
                margin: 0, fontSize: 22, fontWeight: 700,
                letterSpacing: "-0.025em", color: "var(--text)",
                lineHeight: 1.15,
              }}>
                Meus Assistidos
              </h1>
              <div style={{
                marginTop: 6, fontSize: 12, fontWeight: 700,
                color: "var(--accent)", background: "var(--accent-bg)",
                padding: "4px 10px", borderRadius: 999, display: "inline-block",
              }}>
                {session.membership.tenantName}
              </div>
            </div>
            <Avatar name={`${session.user.firstName} ${session.user.lastName}`} size={46} online />
          </div>

          {/* Search bar */}
          <div style={{ padding: "0 22px" }}>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar por nome ou cidade"
            />
          </div>

          {/* Status filters */}
          <div style={{ padding: "0 22px 6px" }}>
            <StatusFilterRow value={filter} onChange={setFilter} />
          </div>

          {/* Items List */}
          <div style={{ padding: "0 22px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredList.length === 0 && (
              <p style={{
                padding: "60px 20px", textAlign: "center",
                color: "var(--text-3)", fontSize: 13.5,
              }}>
                Nenhum assistido encontrado com este filtro.
              </p>
            )}

            {filteredList.map((item) => (
              <Card
                key={item.id}
                padding={16}
                hoverable
                onClick={() => handleOpen(item.id, item.kind)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  cursor: "pointer",
                }}
              >
                <Avatar name={item.name} size={50} />
                <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <h3 style={{
                      margin: 0, fontSize: 15.5, fontWeight: 700,
                      color: "var(--text)", letterSpacing: "-0.015em",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {item.name}
                    </h3>
                    <StatusPill status={item.status} size="xs" />
                  </div>

                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 12.5, color: "var(--text-2)", marginBottom: 4,
                  }}>
                    <IconMapPin size={12} color="var(--accent)" />
                    <span style={{ color: "var(--accent)" }}>{item.city}</span>
                    {item.kind === "seed" && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        background: "#FFEDD5", color: "#C2410C", padding: "1px 5px", borderRadius: 4, marginLeft: 6,
                      }}>
                        Novo contato
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                    Último: <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{item.lastContact}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Floating Action Button */}
          <button
            onClick={() => setTab("new")}
            style={{
              position: "fixed", right: 20, bottom: 95,
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--accent)", color: "#fff",
              border: 0, cursor: "pointer", zIndex: 90,
              boxShadow: "0 10px 24px rgba(45,127,249,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <IconPlus size={26} sw={2.4} />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. DETAILS TAB
          ───────────────────────────────────────────────────────────── */}
      {tab === "details" && selectedEntity && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <button
              onClick={handleBack}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <IconArrowLeft size={16} />
            </button>
            <h1 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: "var(--text)" }}>
              Perfil
            </h1>
            <div style={{ width: 38 }} />
          </div>

          <div style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Hero Card */}
            <Card padding={20} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center", gap: 12,
            }}>
              <Avatar name={selectedEntity.name} size={80} />
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em" }}>
                  {selectedEntity.name}
                </h2>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4, marginTop: 4,
                  justifyContent: "center", fontSize: 13, color: "var(--text-2)",
                }}>
                  <IconMapPin size={13} color="var(--accent)" />
                  <span style={{ color: "var(--accent)" }}>{selectedEntity.city}</span>
                </div>
              </div>

              <StatusPill status={selectedEntity.status} size="md" />

              {selectedEntity.address && (
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-3)" }}>
                  Endereço: {selectedEntity.address}
                </p>
              )}

              {selectedEntity.notes && (
                <p style={{
                  margin: "4px 0", padding: "10px 12px", borderRadius: 8,
                  background: "var(--surface-2)", width: "100%",
                  fontSize: 12.5, color: "var(--text-2)", textAlign: "left",
                  lineHeight: 1.4, border: "1px solid var(--border)",
                }}>
                  {selectedEntity.notes}
                </p>
              )}

              <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 4 }}>
                {selectedEntity.phone && (
                  <Button
                    variant="whatsapp"
                    size="md"
                    icon={<IconWhatsappFilled />}
                    full
                    onClick={() => window.open(`https://wa.me/${selectedEntity.phone.replace(/\D/g, "")}`, "_blank")}
                  >
                    WhatsApp
                  </Button>
                )}
                {selectedKind === "member" && (
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<IconCalendar />}
                    full
                    onClick={() => setTab("schedule")}
                  >
                    Próxima Ação
                  </Button>
                )}
              </div>
            </Card>

            {/* Quick Actions (only for members) */}
            {selectedKind === "member" && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
                {[
                  {
                    icon: <IconPhone />,
                    label: "Liguei agora",
                    act: () => handleQuickAction("call", "Ligação registrada pelo cuidador"),
                  },
                  {
                    icon: <IconCheck />,
                    label: "Marcar contatado",
                    act: () => handleQuickAction("other", "Contato presencial registrado pelo cuidador"),
                  },
                  {
                    icon: <IconHeart />,
                    label: "Oração",
                    act: () => handleQuickAction("prayer", "Momento de oração registrado pelo cuidador"),
                  },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={q.act}
                    disabled={submitting}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: 999,
                      background: "var(--surface)", border: "1px solid var(--border)",
                      fontSize: 12.5, fontWeight: 600, color: "var(--text)",
                      whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <span style={{ color: "var(--accent)", display: "flex" }}>{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* If seed, show conversion action */}
            {selectedKind === "seed" && (
              <Card padding={16} style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#5B21B6", lineHeight: 1.5 }}>
                  Este contato está na lista de triagem. Inicie o acompanhamento para torná-lo um membro de acolhimento.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  full
                  style={{ marginTop: 12, background: "#7C3AED", boxShadow: "none" }}
                  onClick={handleConvert}
                  disabled={submitting}
                >
                  {submitting ? "Convertendo..." : "→ Iniciar Acompanhamento"}
                </Button>
              </Card>
            )}

            {/* Errors */}
            {error && (
              <div style={{
                padding: "12px 14px", borderRadius: 10,
                background: "#FFF1F2", color: "#E11D48", fontSize: 12.5,
              }}>
                {error}
              </div>
            )}

            {/* Timeline Notes Form (only for members) */}
            {selectedKind === "member" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      placeholder="Registrar nota sobre esta pessoa..."
                      value={novaNota}
                      onChange={setNovaNota}
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleAddNote}
                    disabled={submitting || !novaNota.trim()}
                  >
                    Anotar
                  </Button>
                </div>
              </div>
            )}

            {/* Timeline List (only for members) */}
            {selectedKind === "member" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ margin: "10px 0 0", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  Linha de Acompanhamento
                </h3>
                {selectedFollowups.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "16px 0" }}>
                    Nenhuma conversa ou visita registrada ainda.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedFollowups.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          padding: "12px 14px", borderRadius: 12,
                          background: "var(--surface)", border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
                            color: "var(--accent)", background: "var(--accent-bg)",
                            padding: "3px 8px", borderRadius: 999,
                          }}>
                            {typeIcons[f.type]}
                            {typeLabels[f.type]}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                            {new Date(f.occurredAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-2)", lineHeight: 1.4 }}>
                          {f.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. NEW BROTHER TAB (NEW BROTHER)
          ───────────────────────────────────────────────────────────── */}
      {tab === "new" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <button
              onClick={handleBack}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <IconArrowLeft size={16} />
            </button>
            <h1 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: "var(--text)" }}>
              Novo Assistido
            </h1>
            <div style={{ width: 38 }} />
          </div>

          <form onSubmit={handleCreateNew} style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
            <Input
              label="Nome Completo"
              value={newForm.name}
              onChange={(v) => setNewForm((f) => ({ ...f, name: v }))}
              placeholder="Ex: Joana da Silva"
              icon={<IconUser />}
              required
            />
            <Input
              label="Telefone (WhatsApp)"
              value={newForm.phone}
              onChange={(v) => setNewForm((f) => ({ ...f, phone: v }))}
              placeholder="(00) 90000-0000"
              icon={<IconPhone />}
            />
            <Input
              label="Cidade"
              value={newForm.city}
              onChange={(v) => setNewForm((f) => ({ ...f, city: v }))}
              placeholder="Curitiba"
              icon={<IconMapPin />}
            />
            <Textarea
              label="Observações iniciais"
              value={newForm.notes}
              onChange={(v) => setNewForm((f) => ({ ...f, notes: v }))}
              placeholder="Contexto, indicações, motivos da busca de acolhimento..."
              rows={3}
            />

            {error && (
              <div style={{
                padding: "12px 14px", borderRadius: 10,
                background: "#FFF1F2", color: "#E11D48", fontSize: 12.5,
              }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              full
              disabled={submitting || !newForm.name}
            >
              {submitting ? "Cadastrando..." : "Cadastrar novo contato"}
            </Button>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. SCHEDULE REUNION TAB
          ───────────────────────────────────────────────────────────── */}
      {tab === "schedule" && selectedEntity && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <button
              onClick={handleBack}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <IconArrowLeft size={16} />
            </button>
            <h1 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: "var(--text)" }}>
              Agendar Próxima Ação
            </h1>
            <div style={{ width: 38 }} />
          </div>

          <form onSubmit={handleSaveSchedule} style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
                Data e hora do compromisso
              </span>
              <div style={{
                display: "flex", alignItems: "center", height: 54,
                padding: "0 18px", background: "var(--surface)",
                border: "1.5px solid var(--border)", borderRadius: 14,
              }}>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.dateTime}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, dateTime: e.target.value }))}
                  style={{
                    flex: 1, border: 0, outline: "none",
                    background: "transparent", fontFamily: "inherit",
                    fontSize: 15, color: "var(--text)",
                  }}
                />
              </div>
            </div>

            <Select
              label="Tipo de ação"
              value={scheduleForm.type}
              onChange={(v) => setScheduleForm((f) => ({ ...f, type: v as Followup["type"] }))}
              options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
            />

            <Textarea
              label="Notas para o compromisso"
              value={scheduleForm.notes}
              onChange={(v) => setScheduleForm((f) => ({ ...f, notes: v }))}
              placeholder="Ex: Realizar visita de oração para a família..."
              rows={3}
            />

            {error && (
              <div style={{
                padding: "12px 14px", borderRadius: 10,
                background: "#FFF1F2", color: "#E11D48", fontSize: 12.5,
              }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              full
              disabled={submitting || !scheduleForm.dateTime}
            >
              {submitting ? "Salvando..." : "Confirmar Agendamento"}
            </Button>
          </form>
        </div>
      )}

    </div>
  );
}
