"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Member, Tenant } from "@/server/domain/mvp";
import { mapMemberStatusToVisualStatus } from "@/ui/mvp/dashboard-status-utils";
import {
  buildMemberAddress,
  formatPhone,
  formatPostalCode,
  normalizePhone,
  normalizePostalCode,
} from "@/ui/mvp/contact-form-utils";
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

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const CIDADES_LIST = [
  "Sapé", "Mari", "Sobrado", "João Pessoa", "Campina Grande", "Guarabira",
  "Cabedelo", "Bayeux", "Santa Rita", "Rio Tinto", "Mamaguape", "Cruz do Espírito Santo",
  "Caldas Brandão", "Gurinhém", "Mulungu", "Alagoinha", "Araçagi", "Itabaiana",
  "Pilar", "Bananeiras", "Solânea", "Patos", "Sousa", "Cajazeiras", "Recife",
  "Natal", "Fortaleza", "Salvador", "Rio de Janeiro", "São Paulo", "Belo Horizonte",
  "Brasília", "Curitiba", "Porto Alegre",
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

const emptyForm = {
  tenantId: "",
  caregiverId: "",
  name: "",
  age: "",
  phone: "",
  // endereço estruturado
  postalCode: "",
  street: "",
  neighborhood: "",
  addressNumber: "",
  state: "",
  city: "",
  // demais
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
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const addressPreview = useMemo(() => buildMemberAddress(form), [form]);

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
      age: member.age !== null ? String(member.age) : "",
      phone: member.phone,
      postalCode: member.postalCode ?? "",
      street: member.street ?? "",
      neighborhood: member.neighborhood ?? "",
      addressNumber: member.addressNumber ?? "",
      state: member.state ?? "",
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

  async function triggerGeocode(
    street: string,
    city: string,
    number: string,
    state: string,
    postalCode: string
  ) {
    if (!street || !city) return;
    try {
      const q = `${street}, ${number || ""} ${city} ${state || ""} ${postalCode || ""}, Brazil`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      );
      if (response.ok) {
        const data = (await response.json()) as Array<{ lat: string; lon: string }>;
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

  async function handleCEPLookup(cep: string) {
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      if (response.ok) {
        const data = await response.json();
        if (data && !data.erro) {
          setForm((current) => {
            const updated = {
              ...current,
              street: data.logradouro || current.street,
              neighborhood: data.bairro || current.neighborhood,
              city: data.localidade || current.city,
              state: data.uf || current.state,
            };
            triggerGeocode(updated.street, updated.city, updated.addressNumber, updated.state, cleanCEP);
            return updated;
          });
          return;
        }
      }
    } catch (e) {
      console.error("Erro ao buscar CEP:", e);
    }
    triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode);
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
        age: form.age ? Number(form.age) : null,
        phone: normalizePhone(form.phone),
        address: addressPreview,
        postalCode: normalizePostalCode(form.postalCode),
        street: form.street.trim(),
        neighborhood: form.neighborhood.trim(),
        addressNumber: form.addressNumber.trim(),
        state: form.state.trim().toUpperCase().slice(0, 2),
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

  async function updateMemberStatus(memberId: string, status: Member["status"]) {
    setSavingStatusId(memberId);
    setError(null);

    const response = await fetch(`/api/members/${memberId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setSavingStatusId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel atualizar o status do membro.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function removeMember(member: Member) {
    const confirmed = window.confirm(`Excluir o membro "${member.name}"? Os acompanhamentos vinculados tambem serao removidos.`);
    if (!confirmed) {
      return;
    }

    setDeletingMemberId(member.id);
    setError(null);

    const response = await fetch(`/api/members/${member.id}`, {
      method: "DELETE",
    });

    setDeletingMemberId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel excluir o membro.");
      return;
    }

    if (editing?.id === member.id) {
      resetForm();
    }

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
            label="Idade"
            value={form.age}
            onChange={(v) => setForm((f) => ({ ...f, age: v.replace(/\D/g, "").slice(0, 3) }))}
            placeholder="Ex: 45"
            inputMode="numeric"
          />

          <Input
            label="Telefone (WhatsApp)"
            value={formatPhone(form.phone)}
            onChange={(v) => setForm((f) => ({ ...f, phone: normalizePhone(v) }))}
            placeholder="(00) 90000-0000"
            icon={<IconPhone />}
          />

          <Input
            label="Data de nascimento"
            type="date"
            value={form.birthDate}
            onChange={(v) => setForm((f) => ({ ...f, birthDate: v }))}
          />

          {/* ── Bloco de endereço estruturado ── */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div
              style={{
                padding: "16px",
                borderRadius: 16,
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>
                📍 Endereço do membro
              </div>

              {/* CEP + GPS */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="CEP"
                    value={formatPostalCode(form.postalCode)}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, postalCode: normalizePostalCode(v) }))
                    }
                    onBlur={() => handleCEPLookup(form.postalCode)}
                    placeholder="00000-000"
                    icon={<IconMapPin />}
                    inputMode="numeric"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={triggerGPS}
                  style={{ height: 54 }}
                >
                  GPS Atual
                </Button>
              </div>

              {/* Rua */}
              <Input
                label="Rua"
                value={form.street}
                onChange={(v) => setForm((f) => ({ ...f, street: v }))}
                onBlur={() =>
                  triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode)
                }
                placeholder="Ex: Rua das Flores"
                icon={<IconMapPin />}
              />

              {/* Bairro */}
              <Input
                label="Bairro"
                value={form.neighborhood}
                onChange={(v) => setForm((f) => ({ ...f, neighborhood: v }))}
                onBlur={() =>
                  triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode)
                }
                placeholder="Ex: Centro"
                icon={<IconMapPin />}
              />

              {/* Número + Estado */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input
                  label="Número"
                  value={form.addressNumber}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      addressNumber: v.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  onBlur={() =>
                    triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode)
                  }
                  placeholder="123"
                  inputMode="numeric"
                />
                <SearchableSelect
                  label="Estado (UF)"
                  value={form.state}
                  onChange={(v) => {
                    setForm((current) => {
                      const next = { ...current, state: v };
                      triggerGeocode(next.street, next.city, next.addressNumber, next.state, next.postalCode);
                      return next;
                    });
                  }}
                  options={ESTADOS_BRASIL}
                  placeholder="UF"
                />
              </div>

              {/* Cidade */}
              <SearchableSelect
                label="Cidade da pessoa"
                value={form.city}
                onChange={(v) => {
                  setForm((f) => {
                    const next = { ...f, city: v };
                    triggerGeocode(next.street, next.city, next.addressNumber, next.state, next.postalCode);
                    return next;
                  });
                }}
                options={CIDADES_LIST}
                placeholder="Selecione a cidade"
              />

              {/* Badge de coordenadas */}
              {form.latitude !== null && form.longitude !== null ? (
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
                  📍 Coordenadas obtidas:{" "}
                  <b>
                    {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                  </b>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                  Preencha o CEP, Rua e Número para obter as coordenadas automáticas.
                </div>
              )}

              {/* Preview do endereço consolidado */}
              {addressPreview ? (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>
                    Endereço consolidado
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5 }}>
                    {addressPreview}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

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
                              {[member.phone, member.age !== null ? `${member.age} anos` : null].filter(Boolean).join(" · ")}
                            </div>
                            {member.address ? (
                              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2, maxWidth: 260 }}>
                                {member.address}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
                          <StatusPill status={mapMemberStatusToVisualStatus(member.status)} size="sm" />
                          <select
                            value={member.status}
                            onChange={(e) => updateMemberStatus(member.id, e.target.value as Member["status"])}
                            disabled={savingStatusId === member.id}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "1.5px solid var(--border)",
                              background: "var(--surface)",
                              color: "var(--text)",
                              fontFamily: "inherit",
                              fontSize: 12.5,
                              outline: "none",
                              cursor: savingStatusId === member.id ? "wait" : "pointer",
                            }}
                          >
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          {savingStatusId === member.id ? (
                            <span style={{ fontSize: 12, color: "var(--text-3)" }}>Atualizando status...</span>
                          ) : null}
                        </div>
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
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                          <button
                            type="button"
                            onClick={() => removeMember(member)}
                            disabled={deletingMemberId === member.id}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              background: "#FFF5F5",
                              border: "1px solid rgba(220,38,38,0.18)",
                              color: "#DC2626",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: deletingMemberId === member.id ? "wait" : "pointer",
                              fontFamily: "inherit",
                              opacity: deletingMemberId === member.id ? 0.7 : 1,
                            }}
                          >
                            {deletingMemberId === member.id ? "Excluindo..." : "Excluir"}
                          </button>
                        </div>
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
