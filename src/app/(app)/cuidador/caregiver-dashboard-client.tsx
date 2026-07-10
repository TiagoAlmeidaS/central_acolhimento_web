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
  SearchableSelect,
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

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const CIDADES_LIST = [
  "Sapé", "Mari", "Sobrado", "João Pessoa", "Campina Grande", "Guarabira", 
  "Cabedelo", "Bayeux", "Santa Rita", "Rio Tinto", "Mamaguape", "Cruz do Espírito Santo", 
  "Caldas Brandão", "Gurinhém", "Mulungu", "Alagoinha", "Araçagi", "Itabaiana", 
  "Pilar", "Bananeiras", "Solânea", "Patos", "Sousa", "Cajazeiras", "Recife", 
  "Natal", "Fortaleza", "Salvador", "Rio de Janeiro", "São Paulo", "Belo Horizonte", 
  "Brasília", "Curitiba", "Porto Alegre"
].sort();

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
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Brother Form
  const [newForm, setNewForm] = useState({
    name: "",
    age: "",
    phone: "",
    city: session.membership.tenantCity ?? "",
    status: "new",
    notes: "",
    openHouse: false,
    postalCode: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "PB",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  async function triggerNewFormGeocode(street: string, city: string, number: string, state: string, postalCode: string) {
    if (!street || !city) return;
    try {
      const q = `${street}, ${number || ""} ${city} ${state || ""} ${postalCode || ""}, Brazil`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      if (response.ok) {
        const data = await response.json() as Array<{ lat: string; lon: string }>;
        if (data && data[0]) {
          setNewForm((current) => ({
            ...current,
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          }));
        }
      }
    } catch (e) {
      console.error("Erro na geocodificação:", e);
    }
  }

  async function handleNewFormCEPLookup(cep: string) {
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      if (response.ok) {
        const data = await response.json();
        if (data && !data.erro) {
          setNewForm((current) => {
            const updated = {
              ...current,
              street: data.logradouro || current.street,
              neighborhood: data.bairro || current.neighborhood,
              city: data.localidade || current.city,
              state: data.uf || current.state,
            };
            triggerNewFormGeocode(updated.street, updated.city, updated.addressNumber, updated.state, cleanCEP);
            return updated;
          });
          return;
        }
      }
    } catch (e) {
      console.error("Erro ao buscar CEP:", e);
    }
    triggerNewFormGeocode(newForm.street, newForm.city, newForm.addressNumber, newForm.state, newForm.postalCode);
  }

  function triggerNewFormGPS() {
    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewForm((current) => ({
          ...current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      },
      (err) => {
        setError(`Erro ao obter GPS: ${err.message}`);
      }
    );
  }

  // Schedule Reunion Form
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "19:00",
    type: "visit" as Followup["type"],
    title: "",
    duration: "60",
    location: "",
    notes: "",
    notificar: true,
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
      isUrgent: boolean;
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
        isUrgent: !!m.isUrgent,
      });
    });

    initialSeeds.forEach((s) => {
      if (s.status === "in_progress") return; // Evita duplicação de contatos que viraram membros
      list.push({
        id: s.id,
        kind: "seed",
        name: s.referenceName,
        city: s.city || "",
        phone: s.phone || "",
        status: STATUS_MAP[s.status] ?? "aguardando",
        lastContact: "Novo contato",
        notes: s.notes || "",
        isUrgent: !!s.isUrgent,
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

  React.useEffect(() => {
    if (tab === "schedule" && selectedEntity) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduleForm((f) => ({
        ...f,
        date: tomorrow.toISOString().slice(0, 10),
        time: "19:00",
        type: "visit",
        title: `Visita · ${selectedEntity.name.split(" ").slice(0, 2).join(" ")}`,
        duration: "60",
        location: selectedEntity.city || "",
        notes: "",
        notificar: true,
      }));
    }
  }, [tab, selectedEntity]);

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
    setIsAddingNote(false);
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

    const addressComposed = newForm.openHouse
      ? `${newForm.street}, ${newForm.addressNumber} - ${newForm.neighborhood}, ${newForm.city} - ${newForm.state}, ${newForm.postalCode}, Brazil`
      : "";

    const response = await fetch("/api/seeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: session.membership.tenantId,
        caregiverId: session.membership.caregiverId,
        referenceName: newForm.name,
        age: newForm.age ? Number(newForm.age) : null,
        phone: newForm.phone,
        city: newForm.city,
        status: "new",
        notes: newForm.notes,
        source: "Cuidador",
        openHouse: newForm.openHouse,
        address: addressComposed,
        street: newForm.openHouse ? newForm.street : "",
        neighborhood: newForm.openHouse ? newForm.neighborhood : "",
        addressNumber: newForm.openHouse ? newForm.addressNumber : "",
        state: newForm.openHouse ? newForm.state : "",
        postalCode: newForm.openHouse ? newForm.postalCode : "",
        latitude: newForm.openHouse ? newForm.latitude : null,
        longitude: newForm.openHouse ? newForm.longitude : null,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Falha ao cadastrar novo contato.");
      return;
    }

    setNewForm({
      name: "",
      age: "",
      phone: "",
      city: session.membership.tenantCity ?? "",
      status: "new",
      notes: "",
      openHouse: false,
      postalCode: "",
      street: "",
      neighborhood: "",
      addressNumber: "",
      state: "PB",
      latitude: null,
      longitude: null,
    });
    setTab("home");
    startTransition(() => router.refresh());
  }

  // Save next action (schedule reunion)
  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleForm.date || !scheduleForm.time || !selectedId) return;
    setSubmitting(true);
    setError(null);

    const nextActionAtISO = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString();
    const titleText = scheduleForm.title.trim() || typeLabels[scheduleForm.type];
    const durationText = `${scheduleForm.duration} minutos`;
    const locationText = scheduleForm.location.trim();

    let noteContent = `Agendado: ${titleText}`;
    if (locationText) {
      noteContent += `\n📍 Local: ${locationText}`;
    }
    noteContent += `\n⏰ Duração: ${durationText}`;
    if (scheduleForm.notes.trim()) {
      noteContent += `\n📝 Notas: ${scheduleForm.notes.trim()}`;
    }

    const response = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: session.membership.tenantId,
        memberId: selectedId,
        caregiverId: session.membership.caregiverId,
        type: scheduleForm.type,
        occurredAt: new Date().toISOString(),
        notes: noteContent,
        nextActionAt: nextActionAtISO,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Erro ao agendar compromisso.");
      return;
    }

    // Launch WhatsApp if enabled
    if (scheduleForm.notificar && selectedEntity?.phone) {
      const formattedDate = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toLocaleDateString("pt-BR");
      const msg = `Olá, ${selectedEntity.name}! Passando para confirmar nosso compromisso: *${titleText}* no dia *${formattedDate}* às *${scheduleForm.time}*.${locationText ? `\n📍 Local: ${locationText}.` : ""}\nDeus abençoe!`;
      window.open(`https://wa.me/${selectedEntity.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
    }

    setScheduleForm({
      date: "",
      time: "19:00",
      type: "visit" as Followup["type"],
      title: "",
      duration: "60",
      location: "",
      notes: "",
      notificar: true,
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
                  borderLeft: item.isUrgent ? "4px solid #E11D48" : undefined,
                }}
              >
                <Avatar name={item.name} size={50} />
                <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <h3 style={{
                      margin: 0, fontSize: 15.5, fontWeight: 700,
                      color: "var(--text)", letterSpacing: "-0.015em",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      {item.name}
                      {item.isUrgent && (
                        <span style={{
                          background: "#FFF1F2",
                          color: "#E11D48",
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                          border: "1px solid #FECDD3",
                        }}>
                          Urgente
                        </span>
                      )}
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
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {selectedEntity.name}
                  {selectedEntity.isUrgent && (
                    <span style={{
                      background: "#FFF1F2", color: "#E11D48",
                      fontSize: 10, fontWeight: 800, padding: "2px 6px",
                      borderRadius: 4, textTransform: "uppercase", border: "1px solid #FECDD3"
                    }}>
                      Urgente
                    </span>
                  )}
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

            {/* Timeline Notes & List (only for members) */}
            {selectedKind === "member" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "6px 2px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Linha do tempo
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                    {selectedFollowups.length} {selectedFollowups.length === 1 ? "registro" : "registros"}
                  </span>
                </div>

                <Card padding={20}>
                  {selectedFollowups.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "20px 0", margin: 0 }}>
                      Nenhum registro de acompanhamento ainda.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {selectedFollowups.map((f, index) => {
                        const isLast = index === selectedFollowups.length - 1;
                        const isScheduled = f.notes.startsWith("Agendado:");
                        const displayNotes = isScheduled ? f.notes.replace("Agendado:", "").trim() : f.notes;

                        return (
                          <div key={f.id} style={{ display: "flex", gap: 14, position: "relative" }}>
                            {/* Circle and Connector line */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                background: isScheduled ? "var(--accent-bg)" : "var(--surface-2)",
                                color: isScheduled ? "var(--accent)" : "var(--text-2)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {typeIcons[f.type]}
                              </div>
                              {!isLast && (
                                <div style={{
                                  flex: 1, width: 2, background: "var(--border)", marginTop: 4, marginBottom: 4,
                                  borderRadius: 1,
                                }} />
                              )}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 22 }}>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
                                  {isScheduled ? "Ação Agendada" : typeLabels[f.type]}
                                </span>
                                <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                                  {new Date(f.occurredAt).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              <div style={{
                                fontSize: 13.5, lineHeight: 1.5, color: "var(--text-2)",
                                letterSpacing: "-0.005em", whiteSpace: "pre-wrap",
                              }}>
                                {displayNotes}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add note inline */}
                  <div style={{
                    marginTop: 18, paddingTop: 18,
                    borderTop: "1px dashed var(--border)",
                  }}>
                    {!isAddingNote ? (
                      <button
                        onClick={() => {
                          setIsAddingNote(true);
                          setError(null);
                        }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10,
                          padding: "12px 14px", borderRadius: 12,
                          background: "var(--surface-2)", border: "1px dashed var(--border-strong)",
                          color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit",
                          fontSize: 13.5, fontWeight: 500, letterSpacing: "-0.005em",
                          textAlign: "left",
                        }}
                      >
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%",
                          background: "var(--accent-bg)", color: "var(--accent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}><IconPlus size={14} /></div>
                        <span>Registrar uma nota ou observação</span>
                      </button>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Textarea
                          placeholder="Digite aqui as observações ou pontos tratados no acompanhamento..."
                          value={novaNota}
                          onChange={setNovaNota}
                          rows={3}
                        />
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setIsAddingNote(false);
                              setNovaNota("");
                              setError(null);
                            }}
                            disabled={submitting}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleAddNote}
                            disabled={submitting || !novaNota.trim()}
                          >
                            {submitting ? "Anotando..." : "Salvar Nota"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
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
              label="Idade"
              value={newForm.age}
              onChange={(v) => setNewForm((f) => ({ ...f, age: v.replace(/\D/g, "").slice(0, 3) }))}
              placeholder="Ex: 32"
              inputMode="numeric"
            />
            <Input
              label="Telefone (WhatsApp)"
              value={newForm.phone}
              onChange={(v) => setNewForm((f) => ({ ...f, phone: v }))}
              placeholder="(00) 90000-0000"
              icon={<IconPhone />}
            />
            <SearchableSelect
              label="Cidade"
              value={newForm.city}
              onChange={(v) => setNewForm((f) => ({ ...f, city: v }))}
              options={CIDADES_LIST}
              placeholder="Selecione a cidade"
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: newForm.openHouse ? "var(--accent-bg)" : "var(--surface)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={newForm.openHouse}
                onChange={(e) =>
                  setNewForm((current) => ({
                    ...current,
                    openHouse: e.target.checked,
                    postalCode: e.target.checked ? current.postalCode : "",
                    street: e.target.checked ? current.street : "",
                    neighborhood: e.target.checked ? current.neighborhood : "",
                    addressNumber: e.target.checked ? current.addressNumber : "",
                    state: e.target.checked ? current.state : "PB",
                    latitude: e.target.checked ? current.latitude : null,
                    longitude: e.target.checked ? current.longitude : null,
                  }))
                }
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Casa aberta para visita</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                  Se marcado, abrimos o bloco completo de endereço e geolocalização.
                </div>
              </div>
            </label>

            {newForm.openHouse && (
              <>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="CEP"
                      value={newForm.postalCode}
                      onChange={(v) => setNewForm((f) => ({ ...f, postalCode: v }))}
                      onBlur={() => handleNewFormCEPLookup(newForm.postalCode)}
                      placeholder="00000-000"
                      icon={<IconMapPin />}
                    />
                  </div>
                  <Button type="button" variant="secondary" size="md" onClick={triggerNewFormGPS} style={{ height: 54 }}>
                    GPS Atual
                  </Button>
                </div>

                <Input
                  label="Rua"
                  value={newForm.street}
                  onChange={(v) => setNewForm((f) => ({ ...f, street: v }))}
                  onBlur={() => triggerNewFormGeocode(newForm.street, newForm.city, newForm.addressNumber, newForm.state, newForm.postalCode)}
                  placeholder="Ex: Rua das Flores"
                  icon={<IconMapPin />}
                />

                <Input
                  label="Bairro"
                  value={newForm.neighborhood}
                  onChange={(v) => setNewForm((f) => ({ ...f, neighborhood: v }))}
                  onBlur={() => triggerNewFormGeocode(newForm.street, newForm.city, newForm.addressNumber, newForm.state, newForm.postalCode)}
                  placeholder="Ex: Centro"
                  icon={<IconMapPin />}
                />

                <Input
                  label="Número"
                  value={newForm.addressNumber}
                  onChange={(v) => setNewForm((f) => ({ ...f, addressNumber: v }))}
                  onBlur={() => triggerNewFormGeocode(newForm.street, newForm.city, newForm.addressNumber, newForm.state, newForm.postalCode)}
                  placeholder="123"
                />

                <SearchableSelect
                  label="Estado"
                  value={newForm.state}
                  onChange={(v) => {
                    setNewForm((f) => ({ ...f, state: v }));
                    triggerNewFormGeocode(newForm.street, newForm.city, newForm.addressNumber, v, newForm.postalCode);
                  }}
                  options={ESTADOS_BRASIL}
                  placeholder="UF"
                />

                {newForm.latitude !== null && newForm.longitude !== null ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      fontSize: 12.5,
                      color: "#15803D",
                    }}
                  >
                    📍 Coordenadas obtidas: <b>{newForm.latitude.toFixed(6)}, {newForm.longitude.toFixed(6)}</b>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                    Preencha o CEP, Rua e Número para obter as coordenadas automáticas.
                  </div>
                )}
              </>
            )}

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

          <form onSubmit={handleSaveSchedule} style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Person Card Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: "var(--accent-bg)",
              borderRadius: 14,
              border: "1px solid rgba(45, 127, 249, 0.18)",
            }}>
              <Avatar name={selectedEntity.name} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Ação destinada a
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.005em", marginTop: 1 }}>
                  {selectedEntity.name}
                </div>
              </div>
              <StatusPill status={selectedEntity.status} size="sm" />
            </div>

            {/* Selector Grid */}
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.005em", marginBottom: 10 }}>
                Tipo de compromisso
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
                {[
                  { k: "visit" as const, l: "Visita", ic: <IconMapPin /> },
                  { k: "call" as const, l: "Ligação", ic: <IconPhone /> },
                  { k: "message" as const, l: "Mensagem", ic: <IconMessage /> },
                  { k: "prayer" as const, l: "Oração", ic: <IconHeart /> },
                  { k: "other" as const, l: "Outro", ic: <IconDoc /> },
                ].map((t) => {
                  const active = scheduleForm.type === t.k;
                  return (
                    <button
                      key={t.k}
                      type="button"
                      onClick={() => setScheduleForm((f) => ({
                        ...f,
                        type: t.k,
                        title: `${t.l} · ${selectedEntity.name.split(" ").slice(0, 2).join(" ")}`,
                      }))}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: "12px 6px",
                        borderRadius: 14,
                        background: "var(--surface)",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        boxShadow: active ? "0 4px 12px rgba(45,127,249,0.12)" : "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: active ? "var(--accent-bg)" : "var(--surface-2)",
                        color: active ? "var(--accent)" : "var(--text-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {t.ic}
                      </div>
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: active ? "var(--text)" : "var(--text-2)",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}>
                        {t.l}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <Input
              label="Título"
              value={scheduleForm.title}
              onChange={(v) => setScheduleForm((f) => ({ ...f, title: v }))}
              placeholder="Ex: Visita de acompanhamento"
              required
            />

            {/* Date & Time Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
              <Input
                label="Data"
                value={scheduleForm.date}
                onChange={(v) => setScheduleForm((f) => ({ ...f, date: v }))}
                type="date"
                required
              />
              <Input
                label="Hora"
                value={scheduleForm.time}
                onChange={(v) => setScheduleForm((f) => ({ ...f, time: v }))}
                type="time"
                required
              />
            </div>

            {/* Duration */}
            <Select
              label="Duração estimada"
              value={scheduleForm.duration}
              onChange={(v) => setScheduleForm((f) => ({ ...f, duration: v }))}
              options={[
                { value: "15", label: "15 minutos" },
                { value: "30", label: "30 minutos" },
                { value: "45", label: "45 minutos" },
                { value: "60", label: "1 hora" },
                { value: "90", label: "1h 30min" },
                { value: "120", label: "2 horas" },
              ]}
            />

            {/* Local / Link / Telefone */}
            <Input
              label={
                scheduleForm.type === "visit" ? "Local da Visita"
                : scheduleForm.type === "call" ? "Telefone de Contato"
                : scheduleForm.type === "message" ? "Canal/Link da conversa"
                : scheduleForm.type === "prayer" ? "Local da Oração"
                : "Local da Reunião"
              }
              value={scheduleForm.location}
              onChange={(v) => setScheduleForm((f) => ({ ...f, location: v }))}
              placeholder={
                scheduleForm.type === "visit" ? "Ex: Endereço completo ou ponto de encontro"
                : scheduleForm.type === "call" ? selectedEntity.phone || "Ex: (00) 00000-0000"
                : scheduleForm.type === "message" ? "Ex: Link de grupo ou link de reunião online"
                : "Ex: Local do compromisso"
              }
              icon={<IconMapPin />}
            />

            {/* Additional notes */}
            <Textarea
              label="Observações para o compromisso (opcional)"
              value={scheduleForm.notes}
              onChange={(v) => setScheduleForm((f) => ({ ...f, notes: v }))}
              placeholder="Descreva metas da reunião ou pontos para orar..."
              rows={3}
            />

            {/* Whatsapp notification toggle */}
            {selectedEntity.phone && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderRadius: 14,
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#DCFCE7",
                  color: "#16A34A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <IconWhatsappFilled size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
                    Notificar pelo WhatsApp
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
                    Abre o WhatsApp com uma mensagem pré-preenchida ao confirmar.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleForm((f) => ({ ...f, notificar: !f.notificar }))}
                  style={{
                    position: "relative",
                    width: 46,
                    height: 28,
                    borderRadius: 999,
                    background: scheduleForm.notificar ? "#22C55E" : "var(--border-strong)",
                    border: 0,
                    cursor: "pointer",
                    padding: 0,
                    transition: "background .15s",
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute",
                    top: 3,
                    left: scheduleForm.notificar ? 21 : 3,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left .15s",
                  }} />
                </button>
              </div>
            )}

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
              disabled={submitting || !scheduleForm.date || !scheduleForm.time}
            >
              {submitting ? "Salvando..." : "Confirmar e Agendar Ação"}
            </Button>
          </form>
        </div>
      )}

    </div>
  );
}
