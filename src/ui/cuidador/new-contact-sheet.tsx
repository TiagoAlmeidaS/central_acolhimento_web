"use client";

import { useState, type FormEvent } from "react";
import type { AuthSession } from "@/server/domain/mvp";
import { ALL_CIDADES, ESTADOS_BRASIL } from "@/lib/br-locations";
import { Button, Input, Select, Textarea } from "@/ui/atalaia";
import { LocationPicker, type LocationAddressFill } from "@/ui/mvp/location-picker";
import { formatPhone, formatPostalCode, normalizePostalCode } from "@/ui/mvp/contact-form-utils";
import { createSeed, type NewContactPayload } from "./care-api";
import { Sheet, useResetOnOpen } from "./sheet";

const FORM_ID = "cuidador-new-contact-form";
const CITIES_LIST_ID = "cuidador-cidades";
/** Algumas cidades repetem entre estados na lista base; o datalist precisa de valores únicos. */
const CITY_OPTIONS = Array.from(new Set(ALL_CIDADES));

type FormState = NewContactPayload;

function emptyForm(city: string): FormState {
  return {
    name: "",
    age: "",
    phone: "",
    city,
    notes: "",
    openHouse: false,
    postalCode: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "PB",
    latitude: null,
    longitude: null,
  };
}

export type NewContactSheetProps = {
  open: boolean;
  session: AuthSession;
  onClose: () => void;
  onSaved: (message: string) => void;
};

/** Novo contato (cadastro rápido de quem acabou de chegar). Mesmo POST /api/seeds de antes. */
export function NewContactSheet({ open, session, onClose, onSaved }: NewContactSheetProps) {
  const defaultCity = session.membership.tenantCity ?? "";
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultCity));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  useResetOnOpen(open, () => {
    setForm(emptyForm(defaultCity));
    setSaving(false);
    setError(null);
    setMapOpen(false);
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function geocode(street: string, city: string, number: string, state: string, postalCode: string) {
    if (!street || !city) return;
    try {
      const query = `${street}, ${number || ""} ${city} ${state || ""} ${postalCode || ""}, Brazil`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (data[0]) {
        setForm((current) => ({
          ...current,
          latitude: Number.parseFloat(data[0].lat),
          longitude: Number.parseFloat(data[0].lon),
        }));
      }
    } catch {
      // Sem coordenadas: o contato é salvo mesmo assim.
    }
  }

  async function lookupPostalCode() {
    const cep = normalizePostalCode(form.postalCode);
    if (cep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (response.ok) {
        const data = (await response.json()) as {
          erro?: boolean;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };
        if (!data.erro) {
          const next = {
            street: data.logradouro || form.street,
            neighborhood: data.bairro || form.neighborhood,
            city: data.localidade || form.city,
            state: data.uf || form.state,
          };
          setForm((current) => ({ ...current, ...next }));
          void geocode(next.street, next.city, form.addressNumber, next.state, cep);
          return;
        }
      }
    } catch {
      // CEP indisponível: segue com o que foi digitado.
    }
    void geocode(form.street, form.city, form.addressNumber, form.state, form.postalCode);
  }

  function fillFromMap(address: LocationAddressFill) {
    setForm((current) => ({
      ...current,
      street: address.street || current.street,
      neighborhood: address.neighborhood || current.neighborhood,
      city: address.city || current.city,
      state: address.state || current.state,
      postalCode: address.postalCode || current.postalCode,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Informe o nome para cadastrar o contato.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createSeed(session, { ...form, name: form.name.trim() });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(`${form.name.trim()} entrou na sua lista de contatos.`);
  }

  const refreshGeocode = () => void geocode(form.street, form.city, form.addressNumber, form.state, form.postalCode);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Novo contato"
      subtitle="O essencial é o nome e o telefone. O resto pode vir depois."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={saving} disabled={!form.name.trim()}>
            {saving ? "Cadastrando..." : "Cadastrar contato"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="grid gap-4">
        <Input
          label="Nome completo *"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Ex.: Joana da Silva"
          autoComplete="off"
          data-autofocus=""
          required
        />
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <Input
            label="Telefone (WhatsApp)"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(event) => update("phone", formatPhone(event.target.value))}
            placeholder="(83) 99999-0000"
          />
          <Input
            label="Idade"
            inputMode="numeric"
            value={form.age}
            onChange={(event) => update("age", event.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="32"
          />
        </div>
        <Input
          label="Cidade"
          value={form.city}
          onChange={(event) => update("city", event.target.value)}
          list={CITIES_LIST_ID}
          autoComplete="off"
        />
        <datalist id={CITIES_LIST_ID}>
          {CITY_OPTIONS.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>

        <Textarea
          label="Observações iniciais"
          value={form.notes}
          onChange={(event) => update("notes", event.target.value)}
          placeholder="Contexto, indicações, motivo da busca por acolhimento."
          rows={3}
        />

        <label className="flex cursor-pointer items-start gap-2.5 rounded-card border border-border bg-sunken px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.openHouse}
            onChange={(event) => {
              const checked = event.target.checked;
              setForm((current) => ({
                ...current,
                openHouse: checked,
                postalCode: checked ? current.postalCode : "",
                street: checked ? current.street : "",
                neighborhood: checked ? current.neighborhood : "",
                addressNumber: checked ? current.addressNumber : "",
                state: checked ? current.state : "PB",
              }));
            }}
            className="mt-0.5 size-4 accent-[var(--primary)]"
          />
          <span>
            <b>Casa aberta para visita</b>
            <span className="block text-xs text-muted">Se marcado, pedimos o endereço completo para o mapa.</span>
          </span>
        </label>

        {form.openHouse ? (
          <div className="grid gap-3">
            <Input
              label="CEP"
              inputMode="numeric"
              value={form.postalCode}
              onChange={(event) => update("postalCode", formatPostalCode(event.target.value))}
              onBlur={lookupPostalCode}
              placeholder="00000-000"
            />
            <Input
              label="Rua"
              value={form.street}
              onChange={(event) => update("street", event.target.value)}
              onBlur={refreshGeocode}
              placeholder="Ex.: Rua das Flores"
            />
            <div className="grid grid-cols-[1fr_88px] gap-3">
              <Input
                label="Bairro"
                value={form.neighborhood}
                onChange={(event) => update("neighborhood", event.target.value)}
                onBlur={refreshGeocode}
                placeholder="Ex.: Centro"
              />
              <Input
                label="Número"
                value={form.addressNumber}
                onChange={(event) => update("addressNumber", event.target.value)}
                onBlur={refreshGeocode}
                placeholder="123"
              />
            </div>
            <Select
              label="Estado"
              value={form.state}
              onChange={(event) => {
                update("state", event.target.value);
                void geocode(form.street, form.city, form.addressNumber, event.target.value, form.postalCode);
              }}
              options={ESTADOS_BRASIL}
            />
          </div>
        ) : null}

        <details
          className="rounded-card border border-border"
          onToggle={(event) => setMapOpen((event.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className="min-h-10 cursor-pointer px-3 py-2.5 text-sm font-medium">
            Marcar no mapa{" "}
            <span className="font-normal text-muted">
              {form.latitude !== null ? "(localização marcada)" : "(opcional)"}
            </span>
          </summary>
          <div className="px-3 pb-3">
            {mapOpen ? (
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) => setForm((current) => ({ ...current, latitude: lat, longitude: lng }))}
                onAddressFill={fillFromMap}
              />
            ) : null}
          </div>
        </details>

        {error ? (
          <p role="alert" className="rounded-card border border-danger/50 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </Sheet>
  );
}
