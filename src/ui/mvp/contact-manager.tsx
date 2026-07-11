"use client";

import { startTransition, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Seed, Tenant } from "@/server/domain/mvp";
import {
  estimateBase64Bytes,
  HOUSE_FRONT_IMAGE_MAX_DIMENSION,
  HOUSE_FRONT_IMAGE_TARGET_BYTES,
} from "@/lib/house-front-image";
import { composeAddress, formatPhone, formatPostalCode, normalizePhone, normalizePostalCode } from "@/ui/mvp/contact-form-utils";
import { Avatar, Button, Card, Input, SectionTitle, Textarea, SearchableSelect } from "@/ui/v2-components/ui";
import { IconCheck, IconHeart, IconMapPin, IconPhone, IconPlus, IconUser, IconX } from "@/ui/v2-components/icons";

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

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Falha ao carregar a imagem."));
    };
    image.src = objectUrl;
  });
}

function scaleDimensions(width: number, height: number, maxDimension: number) {
  if (Math.max(width, height) <= maxDimension) {
    return { width, height };
  }

  const ratio = maxDimension / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function compressHouseFrontImage(file: File) {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Nao foi possivel preparar a compressao da imagem.");
  }

  let bestDataUrl = "";
  let bestBytes = Number.POSITIVE_INFINITY;
  const dimensionAttempts = [HOUSE_FRONT_IMAGE_MAX_DIMENSION, 640, 480];
  const qualityAttempts = [0.55, 0.45, 0.35];

  for (const maxDimension of dimensionAttempts) {
    const { width, height } = scaleDimensions(image.width, image.height, maxDimension);
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of qualityAttempts) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const bytes = estimateBase64Bytes(dataUrl);

      if (bytes < bestBytes) {
        bestDataUrl = dataUrl;
        bestBytes = bytes;
      }

      if (bytes <= HOUSE_FRONT_IMAGE_TARGET_BYTES) {
        return dataUrl;
      }
    }
  }

  if (!bestDataUrl) {
    throw new Error("Nao foi possivel compactar a foto da frente da casa.");
  }

  return bestDataUrl;
}

const emptyForm = {
  tenantId: "",
  referenceName: "",
  age: "",
  phone: "",
  city: "",
  postalCode: "",
  source: "",
  status: "new" as Seed["status"],
  notes: "",
  firstContactAt: getTodayString(),
  openHouse: false,
  address: "",
  street: "",
  neighborhood: "",
  addressNumber: "",
  state: "",
  houseFrontImageUrl: "",
  latitude: null as number | null,
  longitude: null as number | null,
};

export function ContactManager({
  contacts,
  tenants,
}: Readonly<{
  contacts: Seed[];
  tenants: Tenant[];
}>) {
  const router = useRouter();
  const currentTenant = tenants[0] ?? null;
  const [editing, setEditing] = useState<Seed | null>(null);
  const [form, setForm] = useState({
    ...emptyForm,
    tenantId: currentTenant?.id ?? "",
    city: currentTenant?.city ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addressPreview = useMemo(() => composeAddress(form), [form]);

  function resetForm() {
    setEditing(null);
    setForm({
      ...emptyForm,
      tenantId: currentTenant?.id ?? "",
      city: currentTenant?.city ?? "",
    });
    setError(null);
    setSuccess(false);
  }

  function openEdit(contact: Seed) {
    setEditing(contact);
    setForm({
      tenantId: contact.tenantId,
      referenceName: contact.referenceName,
      age: contact.age !== null ? String(contact.age) : "",
      phone: contact.phone,
      city: contact.city,
      postalCode: contact.postalCode,
      source: contact.source,
      status: contact.status,
      notes: contact.notes,
      firstContactAt: contact.firstContactAt ? contact.firstContactAt.slice(0, 10) : "",
      openHouse: contact.openHouse,
      address: contact.address,
      street: contact.street,
      neighborhood: contact.neighborhood,
      addressNumber: contact.addressNumber,
      state: contact.state,
      houseFrontImageUrl: contact.houseFrontImageUrl ?? "",
      latitude: contact.latitude,
      longitude: contact.longitude,
    });
    setError(null);
    setSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCameraFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
      reader.readAsDataURL(file);
    }).catch(() => "");

    if (!result) {
      setError("Não foi possível carregar a foto da frente da casa.");
      return;
    }

    setForm((current) => ({ ...current, houseFrontImageUrl: result }));
  }

  async function handleCompressedCameraFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await compressHouseFrontImage(file).catch(() => "");

    if (!result) {
      setError("Nao foi possivel preparar a foto da frente da casa.");
      return;
    }

    setError(null);
    setForm((current) => ({ ...current, houseFrontImageUrl: result }));
  }

  async function triggerGeocode(street: string, city: string, number: string, state: string, postalCode: string) {
    if (!street || !city) return;
    try {
      const q = `${street}, ${number || ""} ${city} ${state || ""} ${postalCode || ""}, Brazil`;
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const response = await fetch(editing ? `/api/seeds/${editing.id}` : "/api/seeds", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: form.tenantId,
        caregiverId: null,
        referenceName: form.referenceName,
        age: form.age ? Number(form.age) : null,
        phone: normalizePhone(form.phone),
        city: form.city,
        postalCode: normalizePostalCode(form.postalCode),
        source: form.source,
        status: form.status,
        notes: form.notes,
        firstContactAt: form.firstContactAt || null,
        openHouse: form.openHouse,
        address: form.openHouse ? addressPreview : "",
        street: form.openHouse ? form.street.trim() : "",
        neighborhood: form.openHouse ? form.neighborhood.trim() : "",
        addressNumber: form.openHouse ? form.addressNumber.trim() : "",
        state: form.openHouse ? form.state.trim().toUpperCase().slice(0, 2) : "",
        houseFrontImageUrl: form.openHouse ? form.houseFrontImageUrl || null : null,
        latitude: form.openHouse ? form.latitude : null,
        longitude: form.openHouse ? form.longitude : null,
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
        caregiverId: null,
        address: contact.address || undefined,
        notes: contact.notes,
        latitude: contact.latitude,
        longitude: contact.longitude,
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

  async function deleteContact(contact: Seed) {
    const confirmed = window.confirm(`Excluir o contato "${contact.referenceName}"? Esta acao nao pode ser desfeita.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(contact.id);
    setError(null);

    const response = await fetch(`/api/seeds/${contact.id}`, {
      method: "DELETE",
    });

    setDeletingId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel excluir o contato.");
      return;
    }

    if (editing?.id === contact.id) {
      resetForm();
    }

    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card padding={20}>
        <SectionTitle>{editing ? "Editar contato" : "Novo contato em acolhimento"}</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, marginTop: -8, lineHeight: 1.5 }}>
          Captura inicial mobile first. O cuidador será designado depois, dentro da plataforma.
        </p>

        {currentTenant ? (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 14,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Localidade ativa</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              {currentTenant.name} · {currentTenant.city} - {currentTenant.state}
            </div>
          </div>
        ) : null}

        <form style={{ display: "flex", flexDirection: "column", gap: 14 }} onSubmit={handleSubmit}>
          <Input
            label="Nome"
            value={form.referenceName}
            onChange={(value) => setForm((current) => ({ ...current, referenceName: value }))}
            placeholder="Ex: Maria Souza"
            icon={<IconUser />}
            required
          />

          <Input
            label="Idade"
            value={form.age}
            onChange={(value) => setForm((current) => ({ ...current, age: value.replace(/\D/g, "").slice(0, 3) }))}
            placeholder="Ex: 32"
            inputMode="numeric"
          />

          <Input
            label="Telefone"
            value={formatPhone(form.phone)}
            onChange={(value) => setForm((current) => ({ ...current, phone: normalizePhone(value) }))}
            placeholder="(00) 90000-0000"
            icon={<IconPhone />}
            inputMode="numeric"
          />

          <SearchableSelect
            label="Cidade"
            value={form.city}
            onChange={(value) => setForm((current) => ({ ...current, city: value }))}
            options={CIDADES_LIST}
            placeholder="Selecione a cidade"
          />

          <Input
            label="Origem do contato"
            value={form.source}
            onChange={(value) => setForm((current) => ({ ...current, source: value }))}
            placeholder="Culto, visita, indicação, ligação..."
            icon={<IconHeart />}
          />

          <div>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              Primeiro contato
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 54,
                  padding: "0 18px",
                  background: "var(--surface)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 14,
                }}
              >
                <input
                  type="date"
                  value={form.firstContactAt}
                  onChange={(event) => setForm((current) => ({ ...current, firstContactAt: event.target.value }))}
                  style={{
                    flex: 1,
                    border: 0,
                    outline: "none",
                    background: "transparent",
                    fontFamily: "inherit",
                    fontSize: 15,
                    color: "var(--text)",
                  }}
                />
              </div>
            </label>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: form.openHouse ? "var(--accent-bg)" : "var(--surface)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.openHouse}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  openHouse: event.target.checked,
                  address: event.target.checked ? current.address : "",
                  street: event.target.checked ? current.street : "",
                  neighborhood: event.target.checked ? current.neighborhood : "",
                  addressNumber: event.target.checked ? current.addressNumber : "",
                  state: event.target.checked ? current.state : "",
                  postalCode: event.target.checked ? current.postalCode : "",
                  houseFrontImageUrl: event.target.checked ? current.houseFrontImageUrl : "",
                }))
              }
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Casa aberta para visita</div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                Se marcado, abrimos o bloco completo de endereço e a captura da foto da casa.
              </div>
            </div>
          </label>

          {form.openHouse ? (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="CEP"
                    value={formatPostalCode(form.postalCode)}
                    onChange={(value) => setForm((current) => ({ ...current, postalCode: normalizePostalCode(value) }))}
                    onBlur={() => handleCEPLookup(form.postalCode)}
                    placeholder="00000-000"
                    icon={<IconMapPin />}
                    inputMode="numeric"
                  />
                </div>
                <Button type="button" variant="secondary" size="md" onClick={triggerGPS} style={{ height: 54 }}>
                  GPS Atual
                </Button>
              </div>

              <Input
                label="Rua"
                value={form.street}
                onChange={(value) => setForm((current) => ({ ...current, street: value }))}
                onBlur={() => triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode)}
                placeholder="Ex: Rua das Flores"
                icon={<IconMapPin />}
              />

              <Input
                label="Bairro"
                value={form.neighborhood}
                onChange={(value) => setForm((current) => ({ ...current, neighborhood: value }))}
                onBlur={() => triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode)}
                placeholder="Ex: Centro"
                icon={<IconMapPin />}
              />

              <Input
                label="Número"
                value={form.addressNumber}
                onChange={(value) =>
                  setForm((current) => ({ ...current, addressNumber: value.replace(/\D/g, "").slice(0, 10) }))
                }
                onBlur={() => triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode)}
                placeholder="123"
                inputMode="numeric"
              />

              <SearchableSelect
                label="Estado"
                value={form.state}
                onChange={(value) => {
                  setForm((current) => {
                    const next = { ...current, state: value };
                    triggerGeocode(next.street, next.city, next.addressNumber, next.state, next.postalCode);
                    return next;
                  });
                }}
                options={ESTADOS_BRASIL}
                placeholder="UF"
              />

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
                  📍 Coordenadas obtidas: <b>{form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</b>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                  Preencha o CEP, Rua e Número para obter as coordenadas automáticas.
                </div>
              )}

              {addressPreview ? (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Endereço consolidado</div>
                  <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5 }}>{addressPreview}</div>
                </div>
              ) : null}

              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
                  Foto da frente da casa
                </div>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 44,
                    padding: "0 16px",
                    borderRadius: 12,
                    background: "var(--accent-bg)",
                    color: "var(--accent)",
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Abrir câmera ou galeria
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handleCompressedCameraFileChange}
                  />
                </label>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
                  Em celulares compatíveis, o navegador pode abrir a câmera traseira diretamente.
                </div>

                {form.houseFrontImageUrl ? (
                  <div style={{ marginTop: 12 }}>
                    <img
                      src={form.houseFrontImageUrl}
                      alt="Preview da frente da casa"
                      style={{
                        width: "100%",
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        objectFit: "cover",
                        maxHeight: 220,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <Textarea
            label="Observação"
            value={form.notes}
            onChange={(value) => setForm((current) => ({ ...current, notes: value }))}
            placeholder="Contexto, histórico, necessidades, ponto de atenção..."
            rows={4}
          />

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
              <IconCheck size={14} /> Contato salvo com sucesso.
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            <Button type="submit" variant="primary" size="md" disabled={submitting} icon={<IconPlus />} full>
              {submitting ? "Salvando..." : editing ? "Salvar contato" : "Registrar contato"}
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={resetForm} full>
              {editing ? "Cancelar edição" : "Limpar formulário"}
            </Button>
          </div>
        </form>
      </Card>

      <Card padding={20}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
          <SectionTitle>Fila de novos contatos</SectionTitle>
          <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500 }}>
            {contacts.length} {contacts.length === 1 ? "contato" : "contatos"}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16, marginTop: -8, lineHeight: 1.5 }}>
          Depois do primeiro acolhimento, o contato pode ser convertido em membro e distribuído para a equipe.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contacts.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "24px 0", margin: 0 }}>
              Nenhum contato registrado ainda.
            </p>
          ) : null}

          {contacts.map((contact) => {
            const color = statusColors[contact.status] ?? statusColors.new;
            return (
              <div
                key={contact.id}
                style={{
                  padding: "16px",
                  borderRadius: 16,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Avatar name={contact.referenceName} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{contact.referenceName}</div>
                          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                            {contact.phone ? formatPhone(contact.phone) : "Sem telefone"} · {contact.city || "Sem cidade"}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: color.bg,
                            color: color.fg,
                            fontSize: 11.5,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {statusLabels[contact.status]}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: "var(--text-3)" }}>
                        {contact.age !== null ? <span>Idade: {contact.age}</span> : null}
                        {contact.source ? <span>Origem: {contact.source}</span> : null}
                        {contact.openHouse ? <span>Casa aberta</span> : null}
                      </div>

                      {contact.address ? (
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
                          Endereço: {contact.address}
                        </div>
                      ) : null}

                      {contact.houseFrontImageUrl ? (
                        <img
                          src={contact.houseFrontImageUrl}
                          alt="Casa do contato"
                          style={{
                            width: "100%",
                            borderRadius: 14,
                            border: "1px solid var(--border)",
                            objectFit: "cover",
                            maxHeight: 180,
                          }}
                        />
                      ) : null}

                      {contact.notes ? (
                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                          {contact.notes}
                        </p>
                      ) : null}

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                        <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(contact)} full>
                          Editar contato
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteContact(contact)}
                          disabled={deletingId === contact.id || convertingId === contact.id}
                          full
                          style={{
                            color: "#DC2626",
                            border: "1px solid rgba(220,38,38,0.18)",
                            background: "#FFF5F5",
                          }}
                        >
                          {deletingId === contact.id ? "Excluindo..." : "Excluir contato"}
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => convertContact(contact)}
                          disabled={convertingId === contact.id || deletingId === contact.id || contact.status === "in_progress"}
                          full
                        >
                          {convertingId === contact.id
                            ? "Convertendo..."
                            : contact.status === "in_progress"
                              ? "Já convertido em membro"
                              : "Converter em membro"}
                        </Button>
                      </div>
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
