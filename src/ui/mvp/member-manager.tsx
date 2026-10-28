"use client";

import { startTransition, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Caregiver, Member, SpiritualTemperature, Tenant } from "@/server/domain/mvp";
import { buildMemberAddress, formatPhone, formatPostalCode, normalizePhone, normalizePostalCode } from "@/ui/mvp/contact-form-utils";
import { LocationPicker, type LocationAddressFill } from "@/ui/mvp/location-picker";
import { Button, Drawer, Input, Select, Textarea, useToast } from "@/ui/atalaia";
import { SearchableSelect } from "@/ui/v2-components/ui";
import { CheckRow, FormError, FormGrid, Notice, SectionLabel, readApiError, useResetOnOpen } from "@/ui/gestao";
import { ESTADOS_BRASIL, getCidadesByEstado } from "@/lib/br-locations";

export const MEMBER_STATUS_LABEL: Record<Member["status"], string> = {
  new: "Novo",
  in_progress: "Em acompanhamento",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

export const TEMPERATURE_LABEL: Record<SpiritualTemperature, string> = {
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
};

type MemberFormState = {
  tenantId: string;
  caregiverId: string;
  name: string;
  age: string;
  phone: string;
  postalCode: string;
  street: string;
  neighborhood: string;
  addressNumber: string;
  state: string;
  city: string;
  birthDate: string;
  status: Member["status"];
  spiritualTemperature: SpiritualTemperature | null;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  isUrgent: boolean;
};

function blankForm(tenants: Tenant[]): MemberFormState {
  return {
    tenantId: tenants[0]?.id ?? "",
    caregiverId: "",
    name: "",
    age: "",
    phone: "",
    postalCode: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "",
    city: tenants[0]?.city ?? "",
    birthDate: "",
    status: "new",
    spiritualTemperature: null,
    notes: "",
    latitude: null,
    longitude: null,
    isUrgent: false,
  };
}

function formFromMember(member: Member): MemberFormState {
  return {
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
    spiritualTemperature: member.spiritualTemperature ?? null,
    notes: member.notes,
    latitude: member.latitude,
    longitude: member.longitude,
    isUrgent: member.isUrgent ?? false,
  };
}

type MemberFormDrawerProps = Readonly<{
  open: boolean;
  onClose: () => void;
  /** Assistido em edição; `null` cadastra um novo. */
  member: Member | null;
  tenants: Tenant[];
  caregivers: Caregiver[];
  /** Chamado depois de salvar e antes de fechar. */
  onSaved?: () => void;
}>;

/** Drawer de cadastro/edição de assistido (mesmos campos e API de antes). */
export function MemberFormDrawer({ open, onClose, member, tenants, caregivers, onSaved }: MemberFormDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<MemberFormState>(() => blankForm(tenants));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useResetOnOpen(open, () => {
    setForm(member ? formFromMember(member) : blankForm(tenants));
    setSubmitting(false);
    setError(null);
  });

  const addressPreview = useMemo(() => buildMemberAddress(form), [form]);
  const tenantCaregivers = useMemo(
    () => caregivers.filter((caregiver) => !form.tenantId || caregiver.tenantId === form.tenantId),
    [caregivers, form.tenantId],
  );

  async function triggerGeocode(street: string, city: string, number: string, state: string, postalCode: string) {
    if (!street || !city) return;
    try {
      const q = `${street}, ${number || ""} ${city} ${state || ""} ${postalCode || ""}, Brazil`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      if (response.ok) {
        const data = (await response.json()) as Array<{ lat: string; lon: string }>;
        if (data && data[0]) {
          setForm((current) => ({ ...current, latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }));
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
          const updated = {
            ...form,
            street: data.logradouro || form.street,
            neighborhood: data.bairro || form.neighborhood,
            city: data.localidade || form.city,
            state: data.uf || form.state,
          };
          setForm((current) => ({
            ...current,
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
    void triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(member ? `/api/members/${member.id}` : "/api/members", {
      method: member ? "PUT" : "POST",
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
        spiritualTemperature: form.spiritualTemperature ?? null,
        notes: form.notes,
        latitude: form.latitude,
        longitude: form.longitude,
        isUrgent: form.isUrgent,
      }),
    });

    setSubmitting(false);
    if (!response.ok) {
      setError(await readApiError(response, "Não foi possível salvar o assistido."));
      return;
    }

    toast(member ? "Assistido atualizado." : "Assistido cadastrado.");
    onSaved?.();
    onClose();
    startTransition(() => router.refresh());
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={member ? "Editar assistido" : "Novo assistido"}
      subtitle={member ? member.name : "Cadastre a pessoa e quem vai cuidar dela."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="member-form" loading={submitting}>
            {member ? "Salvar assistido" : "Criar assistido"}
          </Button>
        </>
      }
    >
      <form id="member-form" onSubmit={handleSubmit} className="grid gap-4">
        <Input
          label="Nome completo"
          value={form.name}
          onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          placeholder="Ex.: João da Silva"
          required
          data-autofocus
        />

        <FormGrid>
          <Select
            label="Localidade"
            value={form.tenantId}
            onChange={(event) => {
              const next = tenants.find((t) => t.id === event.target.value);
              setForm((f) => ({ ...f, tenantId: event.target.value, caregiverId: "", city: f.city || next?.city || "" }));
            }}
            options={tenants.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Selecione a localidade"
            required
          />
          <Select
            label="Cuidador responsável"
            value={form.caregiverId}
            onChange={(event) => setForm((f) => ({ ...f, caregiverId: event.target.value }))}
            options={[{ value: "", label: "Sem atribuição" }, ...tenantCaregivers.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Input
            label="Telefone (WhatsApp)"
            value={formatPhone(form.phone)}
            onChange={(event) => setForm((f) => ({ ...f, phone: normalizePhone(event.target.value) }))}
            placeholder="(00) 90000-0000"
            inputMode="tel"
          />
          <Input
            label="Idade"
            value={form.age}
            onChange={(event) => setForm((f) => ({ ...f, age: event.target.value.replace(/\D/g, "").slice(0, 3) }))}
            placeholder="Ex.: 45"
            inputMode="numeric"
          />
          <Input
            label="Data de nascimento"
            type="date"
            value={form.birthDate}
            onChange={(event) => setForm((f) => ({ ...f, birthDate: event.target.value }))}
          />
        </FormGrid>

        <fieldset className="m-0 grid gap-3 rounded-card border border-border p-3.5">
          <legend className="px-1">
            <SectionLabel>Endereço</SectionLabel>
          </legend>
          <Input
            label="CEP"
            value={formatPostalCode(form.postalCode)}
            onChange={(event) => setForm((f) => ({ ...f, postalCode: normalizePostalCode(event.target.value) }))}
            onBlur={() => handleCEPLookup(form.postalCode)}
            placeholder="00000-000"
            inputMode="numeric"
          />
          <Input
            label="Rua"
            value={form.street}
            onChange={(event) => setForm((f) => ({ ...f, street: event.target.value }))}
            onBlur={() => triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode)}
            placeholder="Ex.: Rua das Flores"
          />
          <FormGrid>
            <Input
              label="Bairro"
              value={form.neighborhood}
              onChange={(event) => setForm((f) => ({ ...f, neighborhood: event.target.value }))}
              onBlur={() => triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode)}
              placeholder="Ex.: Centro"
            />
            <Input
              label="Número"
              value={form.addressNumber}
              onChange={(event) => setForm((f) => ({ ...f, addressNumber: event.target.value.replace(/\D/g, "").slice(0, 10) }))}
              onBlur={() => triggerGeocode(form.street, form.city, form.addressNumber, form.state, form.postalCode)}
              placeholder="123"
              inputMode="numeric"
            />
            <SearchableSelect
              label="Estado (UF)"
              value={form.state}
              onChange={(v) => {
                setForm((current) => ({ ...current, state: v }));
                void triggerGeocode(form.street, form.city, form.addressNumber, v, form.postalCode);
              }}
              options={ESTADOS_BRASIL}
              placeholder="UF"
            />
            <SearchableSelect
              label="Cidade da pessoa"
              value={form.city}
              onChange={(v) => {
                setForm((current) => ({ ...current, city: v }));
                void triggerGeocode(form.street, v, form.addressNumber, form.state, form.postalCode);
              }}
              options={getCidadesByEstado(form.state)}
              placeholder="Selecione a cidade"
            />
          </FormGrid>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
            onAddressFill={handleLocationFill}
          />
          {addressPreview ? <Notice>Endereço consolidado: {addressPreview}</Notice> : null}
        </fieldset>

        <FormGrid>
          <Select
            label="Situação"
            value={form.status}
            onChange={(event) => setForm((f) => ({ ...f, status: event.target.value as Member["status"] }))}
            options={Object.entries(MEMBER_STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Temperatura espiritual"
            value={form.spiritualTemperature ?? ""}
            onChange={(event) =>
              setForm((f) => ({ ...f, spiritualTemperature: (event.target.value || null) as SpiritualTemperature | null }))
            }
            options={[{ value: "", label: "Sem avaliação" }, ...Object.entries(TEMPERATURE_LABEL).map(([value, label]) => ({ value, label }))]}
          />
        </FormGrid>

        <CheckRow
          checked={form.isUrgent}
          onChange={(event) => setForm((f) => ({ ...f, isUrgent: event.target.checked }))}
          label="Caso urgente"
          description="Sinaliza que este assistido precisa de atenção prioritária."
        />

        <Textarea
          label="Observações"
          value={form.notes}
          rows={3}
          onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))}
          placeholder="Contexto, necessidades, indicações, histórico…"
        />

        <FormError>{error}</FormError>
      </form>
    </Drawer>
  );
}
