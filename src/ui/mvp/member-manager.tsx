"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Member, Tenant } from "@/server/domain/mvp";
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  SectionTitle,
  StatusPill,
  Avatar,
  SearchableSelect,
} from "@/ui/v2-components/ui";

const CIDADES_LIST = [
  "Sapé", "Mari", "Sobrado", "João Pessoa", "Campina Grande", "Guarabira", 
  "Cabedelo", "Bayeux", "Santa Rita", "Rio Tinto", "Mamaguape", "Cruz do Espírito Santo", 
  "Caldas Brandão", "Gurinhém", "Mulungu", "Alagoinha", "Araçagi", "Itabaiana", 
  "Pilar", "Bananeiras", "Solânea", "Patos", "Sousa", "Cajazeiras", "Recife", 
  "Natal", "Fortaleza", "Salvador", "Rio de Janeiro", "São Paulo", "Belo Horizonte", 
  "Brasília", "Curitiba", "Porto Alegre"
].sort();
import {
  IconUser,
  IconPhone,
  IconMapPin,
  IconCheck,
  IconPlus,
  IconX,
  IconUsers,
  IconBuilding,
} from "@/ui/v2-components/icons";

const statusLabels: Record<Member["status"], string> = {
  new: "Novo",
  in_progress: "Em acompanhamento",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

// Maps the member status to the V2 StatusPill keys
const STATUS_MAP: Record<Member["status"], string> = {
  new: "aguardando",
  in_progress: "acompanhamento",
  consolidated: "concluido",
  inactive: "aguardando",
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
  latitude: null as number | null,
  longitude: null as number | null,
  isUrgent: false,
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
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function resetForm() {
    setEditing(null);
    setForm({ ...emptyForm, tenantId: tenants[0]?.id ?? "", city: tenants[0]?.city ?? "" });
    setError(null);
    setSuccess(false);
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
      latitude: member.latitude,
      longitude: member.longitude,
      isUrgent: member.isUrgent ?? false,
    });
    setError(null);
    setSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function triggerGeocode(address: string, city: string) {
    if (!address || !city) return;
    try {
      const q = `${address}, ${city}, Brazil`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      if (response.ok) {
        const data = await response.json() as Array<{ lat: string; lon: string }>;
        if (data && data[0]) {
          setForm((current) => ({
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

  function triggerGPS() {
    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

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
        latitude: form.latitude,
        longitude: form.longitude,
        isUrgent: form.isUrgent,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Não foi possível salvar o membro.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
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

    if (!response.ok) return;

    setAssigningMemberId(null);
    startTransition(() => router.refresh());
  }

  const filteredMembers = members.filter((m) =>
    `${m.name} ${m.city} ${m.phone}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* ── Form ── */}
      <Card padding={28}>
        <SectionTitle>
          {editing ? "Editar membro" : "Novo membro em acolhimento"}
        </SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, marginTop: -8 }}>
          Cadastre pessoas acompanhadas e mantenha o fluxo concentrado no monólito.
        </p>

        <form
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          onSubmit={handleSubmit}
        >
          <Select
            label="Localidade"
            value={form.tenantId}
            onChange={(v) => {
              const next = tenants.find((t) => t.id === v);
              setForm((f) => ({ ...f, tenantId: v, city: f.city || next?.city || "" }));
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
            label="Nome completo"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Ex: João da Silva"
            icon={<IconUser />}
            required
          />

          <Input
            label="Telefone (WhatsApp)"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="(00) 90000-0000"
            icon={<IconPhone />}
          />

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Endereço"
                  value={form.address}
                  onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                  onBlur={() => triggerGeocode(form.address, form.city)}
                  placeholder="Rua, número, bairro"
                  icon={<IconMapPin />}
                />
              </div>
              <Button type="button" variant="secondary" size="md" onClick={triggerGPS} style={{ height: 54 }}>
                GPS Atual
              </Button>
            </div>
          </div>

          <SearchableSelect
            label="Cidade da pessoa"
            value={form.city}
            onChange={(v) => {
              setForm((f) => {
                const next = { ...f, city: v };
                triggerGeocode(next.address, next.city);
                return next;
              });
            }}
            options={CIDADES_LIST}
            placeholder="Selecione a cidade"
          />

          <Input
            label="Data de nascimento"
            type="date"
            value={form.birthDate}
            onChange={(v) => setForm((f) => ({ ...f, birthDate: v }))}
          />

          <Select
            label="Status pastoral"
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v as Member["status"] }))}
            options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
          />

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 0" }}>
              <input
                type="checkbox"
                checked={form.isUrgent}
                onChange={(e) => setForm((f) => ({ ...f, isUrgent: e.target.checked }))}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  accentColor: "#E11D48",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>
                Caso URGENTE (Sinaliza que este assistido necessita de atenção prioritária)
              </span>
            </label>
          </div>

          {form.latitude !== null && form.longitude !== null ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "10px 12px",
                borderRadius: 10,
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                fontSize: 12.5,
                color: "#15803D",
              }}
            >
              📍 Coordenadas obtidas: <b>{form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</b>
            </div>
          ) : (
            <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--text-3)" }}>
              Preencha o Endereço e Cidade para obter as coordenadas automáticas.
            </div>
          )}

          <div style={{ gridColumn: "1 / -1" }}>
            <Textarea
              label="Observações"
              value={form.notes}
              onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
              placeholder="Contexto, necessidades, indicações, histórico..."
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
              <IconCheck size={14} /> Membro salvo com sucesso!
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
              {submitting ? "Salvando..." : editing ? "Salvar membro" : "Criar membro"}
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={resetForm}>
              {editing ? "Cancelar" : "Limpar"}
            </Button>
          </div>
        </form>
      </Card>

      {/* ── List & assign ── */}
      <Card padding={28}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionTitle>
            Membros em acolhimento
          </SectionTitle>
          <span style={{
            fontSize: 12.5, color: "var(--text-3)", fontWeight: 500,
          }}>
            {filteredMembers.length} de {members.length}
          </span>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <Input
            placeholder="Buscar por nome, cidade ou telefone"
            value={searchQuery}
            onChange={setSearchQuery}
            icon={<IconUsers />}
          />
        </div>

        {/* Table */}
        {filteredMembers.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
            {searchQuery ? "Nenhum resultado para a busca." : "Nenhum membro cadastrado ainda."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Pessoa", "Status", "Cuidador", "Localidade", "Ações"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 14px",
                      fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      color: "var(--text-3)", textAlign: "left",
                      borderBottom: "1.5px solid var(--border)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const tenant = tenants.find((t) => t.id === member.tenantId);
                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background .1s",
                      }}
                    >
                      {/* Name */}
                      <td style={{ padding: "14px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar name={member.name} size={38} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 6 }}>
                              {member.name}
                              {member.isUrgent && (
                                <span style={{
                                  background: "#FFF1F2", color: "#E11D48",
                                  fontSize: 10, fontWeight: 800, padding: "2px 6px",
                                  borderRadius: 4, textTransform: "uppercase", border: "1px solid #FECDD3"
                                }}>
                                  Urgente
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>
                              {member.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 14px" }}>
                        <StatusPill status={STATUS_MAP[member.status]} size="sm" />
                      </td>

                      {/* Caregiver assign */}
                      <td style={{ padding: "14px 14px" }}>
                        {assigningMemberId === member.id ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <select
                              defaultValue={member.caregiverId ?? ""}
                              onChange={(e) => assignCaregiver(member.id, e.target.value)}
                              style={{
                                padding: "6px 10px", borderRadius: 8,
                                border: "1.5px solid var(--border)",
                                background: "var(--surface)", color: "var(--text)",
                                fontFamily: "inherit", fontSize: 13, outline: "none",
                              }}
                            >
                              <option value="">Sem atribuição</option>
                              {caregivers.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            {savingAssignId === member.id && (
                              <span style={{ fontSize: 12, color: "var(--text-3)" }}>Salvando...</span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAssigningMemberId(member.id)}
                            style={{
                              padding: "6px 12px", borderRadius: 8,
                              border: "1.5px solid var(--border)",
                              background: "var(--surface-2)",
                              color: member.caregiver ? "var(--text)" : "var(--accent)",
                              fontSize: 13, fontWeight: 600, cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            {member.caregiver ?? "+ Atribuir"}
                          </button>
                        )}
                      </td>

                      {/* City/Tenant */}
                      <td style={{ padding: "14px 14px" }}>
                        <div style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}>
                          <IconBuilding size={12} color="var(--accent)" />
                          {tenant?.name ?? member.city}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 14px" }}>
                        <button
                          type="button"
                          onClick={() => openEdit(member)}
                          style={{
                            padding: "6px 14px", borderRadius: 8,
                            background: "var(--accent-bg)",
                            border: "1px solid rgba(45,127,249,0.2)",
                            color: "var(--accent)",
                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
