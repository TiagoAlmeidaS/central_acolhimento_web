"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Caregiver, OutingEvent, Seed, Tenant } from "@/server/domain/mvp";
import {
  estimateBase64Bytes,
  HOUSE_FRONT_IMAGE_MAX_DIMENSION,
  HOUSE_FRONT_IMAGE_TARGET_BYTES,
} from "@/lib/house-front-image";
import {
  composeAddress,
  formatPhone,
  formatPostalCode,
  normalizePhone,
  normalizePostalCode,
} from "@/ui/mvp/contact-form-utils";
import { LocationPicker, type LocationAddressFill } from "@/ui/mvp/location-picker";
import { buttonClass, Eyebrow, Input, Select, Textarea } from "@/ui/atalaia";
import { Check } from "@/ui/coord/check";
import { CAREGIVER_CAPACITY, SEED_STATUS_LABEL } from "@/ui/coord/seed-utils";

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
].sort((a, b) => a.localeCompare(b, "pt-BR"));

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
    throw new Error("Não foi possível preparar a compressão da imagem.");
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
    throw new Error("Não foi possível compactar a foto da frente da casa.");
  }

  return bestDataUrl;
}

type FormState = {
  tenantId: string;
  caregiverId: string;
  referenceName: string;
  age: string;
  phone: string;
  city: string;
  postalCode: string;
  source: string;
  status: Seed["status"];
  notes: string;
  firstContactAt: string;
  openHouse: boolean;
  isUrgent: boolean;
  address: string;
  street: string;
  neighborhood: string;
  addressNumber: string;
  state: string;
  houseFrontImageUrl: string;
  latitude: number | null;
  longitude: number | null;
  outingEventId: string;
};

const emptyForm: FormState = {
  tenantId: "",
  caregiverId: "",
  referenceName: "",
  age: "",
  phone: "",
  city: "",
  postalCode: "",
  source: "",
  status: "new",
  notes: "",
  firstContactAt: getTodayString(),
  openHouse: false,
  isUrgent: false,
  address: "",
  street: "",
  neighborhood: "",
  addressNumber: "",
  state: "",
  houseFrontImageUrl: "",
  latitude: null,
  longitude: null,
  outingEventId: "",
};

function formFromSeed(seed: Seed): FormState {
  return {
    tenantId: seed.tenantId,
    caregiverId: seed.caregiverId ?? "",
    referenceName: seed.referenceName,
    age: seed.age !== null ? String(seed.age) : "",
    phone: seed.phone,
    city: seed.city,
    postalCode: seed.postalCode,
    source: seed.source,
    status: seed.status,
    notes: seed.notes,
    firstContactAt: seed.firstContactAt ? seed.firstContactAt.slice(0, 10) : "",
    openHouse: seed.openHouse,
    isUrgent: seed.isUrgent ?? false,
    address: seed.address,
    street: seed.street,
    neighborhood: seed.neighborhood,
    addressNumber: seed.addressNumber,
    state: seed.state,
    houseFrontImageUrl: seed.houseFrontImageUrl ?? "",
    latitude: seed.latitude,
    longitude: seed.longitude,
    outingEventId: seed.outingEventId ?? "",
  };
}

function initialForm(editing: Seed | null, tenants: Tenant[]): FormState {
  if (editing) return formFromSeed(editing);
  const tenant = tenants[0] ?? null;
  return { ...emptyForm, firstContactAt: getTodayString(), tenantId: tenant?.id ?? "", city: tenant?.city ?? "" };
}

export type ContactFormProps = {
  tenants: Tenant[];
  outings?: OutingEvent[];
  /** Coordenacao: habilita a escolha do cuidador. Sem isso, o cuidador atual do contato e preservado. */
  caregivers?: Caregiver[];
  /** Contato em edicao; `null` cria um novo. */
  editing?: Seed | null;
  /** id do <form>; o botao de salvar do drawer aponta para ele com `form={formId}`. */
  formId?: string;
  /** Mostra os botoes Salvar/Limpar dentro do formulario (uso fora de drawer). */
  showActions?: boolean;
  /** Chamado depois de salvar com sucesso. */
  onSaved?: (seed: Seed | null) => void;
  /** Chamado ao cancelar (uso com `showActions`). */
  onCancel?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

/** Formulario de contato (criar e editar). Mesmos campos e a mesma API do cadastro anterior. */
export function ContactForm({
  tenants,
  outings = [],
  caregivers,
  editing = null,
  formId = "contact-form",
  showActions = false,
  onSaved,
  onCancel,
  onBusyChange,
}: ContactFormProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(editing, tenants));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const formRef = useRef(form);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    onBusyChange?.(submitting);
  }, [submitting, onBusyChange]);

  const currentTenant = tenants.find((tenant) => tenant.id === form.tenantId) ?? tenants[0] ?? null;
  const addressPreview = useMemo(() => composeAddress(form), [form]);
  const caregiverOptions = (caregivers ?? []).filter(
    (caregiver) => caregiver.tenantId === form.tenantId && (caregiver.active || caregiver.id === form.caregiverId),
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(initialForm(editing, tenants));
    setError(null);
    setNameError(null);
  }

  function handleTenantChange(nextTenantId: string) {
    const previousTenant = tenants.find((tenant) => tenant.id === form.tenantId) ?? null;
    const nextTenant = tenants.find((tenant) => tenant.id === nextTenantId) ?? null;

    setForm((current) => ({
      ...current,
      tenantId: nextTenantId,
      caregiverId: "",
      city: !current.city || current.city === previousTenant?.city ? (nextTenant?.city ?? current.city) : current.city,
    }));
  }

  async function handleCompressedCameraFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await compressHouseFrontImage(file).catch(() => "");

    if (!result) {
      setError("Não foi possível preparar a foto da frente da casa.");
      return;
    }

    setError(null);
    setForm((current) => ({ ...current, houseFrontImageUrl: result }));
  }

  async function triggerGeocode(street: string, city: string, number: string, state: string, postalCode: string) {
    if (!street || !city) return;
    try {
      const q = `${street}, ${number || ""} ${city} ${state || ""} ${postalCode || ""}, Brazil`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
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

  function geocodeCurrent() {
    const current = formRef.current;
    void triggerGeocode(current.street, current.city, current.addressNumber, current.state, current.postalCode);
  }

  async function handleCEPLookup(cep: string) {
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      if (response.ok) {
        const data = await response.json();
        if (data && !data.erro) {
          const current = formRef.current;
          const updated = {
            ...current,
            street: data.logradouro || current.street,
            neighborhood: data.bairro || current.neighborhood,
            city: data.localidade || current.city,
            state: data.uf || current.state,
          };
          setForm((state) => ({
            ...state,
            street: updated.street,
            neighborhood: updated.neighborhood,
            city: updated.city,
            state: updated.state,
          }));
          void triggerGeocode(updated.street, updated.city, updated.addressNumber, updated.state, cleanCEP);
          return;
        }
      }
    } catch (e) {
      console.error("Erro ao buscar CEP:", e);
    }
    geocodeCurrent();
  }

  function handleLocationFill(addr: LocationAddressFill) {
    setForm((f) => ({
      ...f,
      street: addr.street || f.street,
      neighborhood: addr.neighborhood || f.neighborhood,
      city: addr.city || f.city,
      state: addr.state || f.state,
      postalCode: addr.postalCode ? normalizePostalCode(addr.postalCode) : f.postalCode,
    }));
  }

  function handleOpenHouseChange(checked: boolean) {
    setForm((current) => {
      let newStatus = current.status;
      if (checked && current.status === "new") {
        newStatus = "waiting_visit";
      } else if (!checked && current.status === "waiting_visit") {
        newStatus = "new";
      }
      return {
        ...current,
        openHouse: checked,
        status: newStatus,
        address: checked ? current.address : "",
        street: checked ? current.street : "",
        neighborhood: checked ? current.neighborhood : "",
        addressNumber: checked ? current.addressNumber : "",
        state: checked ? current.state : "",
        postalCode: checked ? current.postalCode : "",
        houseFrontImageUrl: checked ? current.houseFrontImageUrl : "",
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.referenceName.trim()) {
      setNameError("Informe o nome da pessoa.");
      return;
    }
    setNameError(null);
    setSubmitting(true);

    const caregiverId = caregivers ? form.caregiverId || null : (editing?.caregiverId ?? null);
    const body: Record<string, unknown> = {
      tenantId: form.tenantId,
      caregiverId,
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
      latitude: form.latitude,
      longitude: form.longitude,
      outingEventId: form.outingEventId || null,
    };
    // isUrgent so existe na edicao (a rota de criacao nao o recebe).
    if (editing) body.isUrgent = form.isUrgent;

    try {
      const response = await fetch(editing ? `/api/seeds/${editing.id}` : "/api/seeds", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Não foi possível salvar o contato.");
        setSubmitting(false);
        return;
      }

      const saved = (await response.json().catch(() => null)) as Seed | null;
      setSubmitting(false);
      if (!editing) {
        setForm(initialForm(null, tenants));
      }
      onSaved?.(saved);
    } catch {
      setError("Sem conexão. Tente de novo.");
      setSubmitting(false);
    }
  }

  const outingOptions = outings.filter((outing) => outing.tenantId === form.tenantId);

  return (
    <form id={formId} className="grid gap-[18px]" onSubmit={handleSubmit} noValidate>
      {currentTenant ? (
        <p className="text-xs text-muted">
          Localidade: <span className="text-fg">{currentTenant.name}</span> · {currentTenant.city}/{currentTenant.state}
          {caregivers ? "" : ". O cuidador será designado depois, dentro da plataforma."}
        </p>
      ) : null}

      <section className="grid gap-3" aria-label="Quem é">
        <Eyebrow>Quem é</Eyebrow>
        <Input
          label="Nome *"
          data-autofocus=""
          value={form.referenceName}
          onChange={(event) => {
            update("referenceName", event.target.value);
            if (nameError) setNameError(null);
          }}
          placeholder="Ex.: Maria Souza"
          autoComplete="off"
          error={nameError}
          required
        />
        <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <Input
            label="Telefone"
            value={formatPhone(form.phone)}
            onChange={(event) => update("phone", normalizePhone(event.target.value))}
            placeholder="(00) 90000-0000"
            inputMode="tel"
            autoComplete="off"
          />
          <Input
            label="Idade"
            value={form.age}
            onChange={(event) => update("age", event.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="Ex.: 32"
            inputMode="numeric"
          />
        </div>
      </section>

      <section className="grid gap-3" aria-label="Acolhimento">
        <Eyebrow>Acolhimento</Eyebrow>
        <Select
          label="Localidade de responsabilidade"
          value={form.tenantId}
          onChange={(event) => handleTenantChange(event.target.value)}
          options={tenants.map((tenant) => ({ value: tenant.id, label: `${tenant.name} - ${tenant.city}/${tenant.state}` }))}
          placeholder="Selecione a localidade"
          required
        />
        <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <Input
            label="Cidade"
            list="contact-form-cidades"
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            placeholder="Selecione ou digite"
            autoComplete="off"
          />
          <datalist id="contact-form-cidades">
            {CIDADES_LIST.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
          <Input
            label="Origem do contato"
            value={form.source}
            onChange={(event) => update("source", event.target.value)}
            placeholder="Culto, visita, indicação, ligação..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <Select
            label="Situação do contato"
            value={form.status}
            onChange={(event) => update("status", event.target.value as Seed["status"])}
            options={Object.entries(SEED_STATUS_LABEL)
              .filter(([value]) => value !== "in_progress")
              .map(([value, label]) => ({ value, label }))}
            required
          />
          <Input
            label="Primeiro contato"
            type="date"
            value={form.firstContactAt}
            onChange={(event) => update("firstContactAt", event.target.value)}
          />
        </div>
        {caregivers ? (
          <Select
            label="Cuidador"
            value={form.caregiverId}
            onChange={(event) => update("caregiverId", event.target.value)}
            hint="Pode ficar sem cuidador: o contato aparece em “Precisa de alguém” até ser atribuído."
          >
            <option value="">Sem cuidador</option>
            {caregiverOptions.map((caregiver) => (
              <option key={caregiver.id} value={caregiver.id}>
                {caregiver.name}
                {caregiver.activeMembers !== undefined ? ` · ${caregiver.activeMembers}/${CAREGIVER_CAPACITY}` : ""}
              </option>
            ))}
          </Select>
        ) : null}
        <Select
          label="Saída de origem"
          value={form.outingEventId}
          onChange={(event) => update("outingEventId", event.target.value)}
        >
          <option value="">Sem saída vinculada</option>
          {outingOptions.map((outing) => (
            <option key={outing.id} value={outing.id}>
              {`${outing.outingTypeName ?? "Não classificada"} · ${outing.name}`}
            </option>
          ))}
        </Select>
        {editing ? (
          <Check
            label="Caso urgente"
            hint="Alguém precisa falar com essa pessoa hoje."
            checked={form.isUrgent}
            onChange={(event) => update("isUrgent", event.target.checked)}
          />
        ) : null}
      </section>

      <section className="grid gap-3" aria-label="Casa e localização">
        <Eyebrow>Casa e localização</Eyebrow>
        <Check
          label="Casa aberta para visita"
          hint="Se marcado, abrimos o bloco completo de endereço e a captura da foto da casa."
          checked={form.openHouse}
          onChange={(event) => handleOpenHouseChange(event.target.checked)}
        />

        <LocationPicker
          latitude={form.latitude}
          longitude={form.longitude}
          onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
          onAddressFill={handleLocationFill}
        />

        {form.openHouse ? (
          <>
            <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
              <Input
                label="CEP"
                value={formatPostalCode(form.postalCode)}
                onChange={(event) => update("postalCode", normalizePostalCode(event.target.value))}
                onBlur={() => void handleCEPLookup(form.postalCode)}
                placeholder="00000-000"
                inputMode="numeric"
              />
              <Input
                label="Número"
                value={form.addressNumber}
                onChange={(event) => update("addressNumber", event.target.value.replace(/\D/g, "").slice(0, 10))}
                onBlur={geocodeCurrent}
                placeholder="123"
                inputMode="numeric"
              />
            </div>
            <Input
              label="Rua"
              value={form.street}
              onChange={(event) => update("street", event.target.value)}
              onBlur={geocodeCurrent}
              placeholder="Ex.: Rua das Flores"
            />
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <Input
                label="Bairro"
                value={form.neighborhood}
                onChange={(event) => update("neighborhood", event.target.value)}
                onBlur={geocodeCurrent}
                placeholder="Ex.: Centro"
              />
              <Input
                label="UF"
                list="contact-form-estados"
                value={form.state}
                onChange={(event) => update("state", event.target.value.toUpperCase().slice(0, 2))}
                onBlur={geocodeCurrent}
                placeholder="UF"
                autoComplete="off"
              />
              <datalist id="contact-form-estados">
                {ESTADOS_BRASIL.map((uf) => (
                  <option key={uf} value={uf} />
                ))}
              </datalist>
            </div>

            {addressPreview ? (
              <div className="rounded-control border border-border bg-sunken px-3 py-2.5">
                <div className="text-xs text-muted">Endereço consolidado</div>
                <div className="mt-0.5 text-[13px] leading-normal">{addressPreview}</div>
              </div>
            ) : null}

            <div className="grid gap-2 rounded-control border border-border px-3 py-3">
              <div className="text-xs font-semibold text-muted">Foto da frente da casa</div>
              <div>
                <label className={buttonClass("neutral", "md", "cursor-pointer")}>
                  Abrir câmera ou galeria
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={handleCompressedCameraFileChange}
                  />
                </label>
              </div>
              <div className="text-xs text-subtle">
                Em celulares compatíveis, o navegador pode abrir a câmera traseira diretamente.
              </div>
              {form.houseFrontImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.houseFrontImageUrl}
                  alt="Prévia da frente da casa"
                  className="max-h-[220px] w-full rounded-control border border-border object-cover"
                />
              ) : null}
            </div>
          </>
        ) : null}
      </section>

      <Textarea
        label="Observação"
        value={form.notes}
        onChange={(event) => update("notes", event.target.value)}
        placeholder="Contexto, histórico, necessidades, pontos de atenção..."
        rows={4}
      />

      {error ? (
        <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      {showActions ? (
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={buttonClass("neutral")} onClick={onCancel ?? resetForm}>
            {editing ? "Cancelar" : "Limpar formulário"}
          </button>
          <button type="submit" className={buttonClass("primary")} disabled={submitting}>
            {submitting ? "Salvando..." : editing ? "Salvar contato" : "Registrar contato"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
