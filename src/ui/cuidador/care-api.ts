import type { AuthSession, FollowupType, Member, Seed, SpiritualTemperature } from "@/server/domain/mvp";

/**
 * Chamadas às mesmas APIs que o app do cuidador já usava (/api/followups, /api/seeds,
 * /api/members). Nada de contrato novo: só reúne os `fetch` num lugar para as telas.
 */
export type ApiResult = { ok: true } | { ok: false; error: string };

async function send(url: string, method: string, body: unknown, fallback: string): Promise<ApiResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: payload.error ?? fallback };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: `${fallback} Verifique a conexão e tente de novo.` };
  }
}

export type CreateFollowupArgs = {
  session: AuthSession;
  memberId: string;
  type: FollowupType;
  occurredAt: string;
  notes: string;
  nextActionAt?: string | null;
};

export function createFollowup({ session, memberId, type, occurredAt, notes, nextActionAt }: CreateFollowupArgs) {
  return send(
    "/api/followups",
    "POST",
    {
      tenantId: session.membership.tenantId,
      memberId,
      caregiverId: session.membership.caregiverId,
      type,
      occurredAt,
      notes,
      ...(nextActionAt ? { nextActionAt } : {}),
    },
    "Não foi possível salvar o acompanhamento.",
  );
}

export function setTemperature(memberId: string, spiritualTemperature: SpiritualTemperature | null) {
  return send(
    `/api/members/${memberId}/spiritual-temperature`,
    "PATCH",
    { spiritualTemperature },
    "Não foi possível atualizar a temperatura espiritual.",
  );
}

/** Avisar a coordenação = marcar o assistido como urgente (aparece em "Precisa de alguém" na coordenação). */
export function flagMemberUrgent(member: Member, caregiverId: string | null) {
  return send(
    `/api/members/${member.id}`,
    "PUT",
    {
      tenantId: member.tenantId,
      caregiverId,
      seedId: member.seedId,
      name: member.name,
      age: member.age,
      phone: member.phone,
      address: member.address,
      postalCode: member.postalCode,
      street: member.street,
      neighborhood: member.neighborhood,
      addressNumber: member.addressNumber,
      state: member.state,
      city: member.city,
      birthDate: member.birthDate,
      status: member.status,
      spiritualTemperature: member.spiritualTemperature ?? null,
      notes: member.notes,
      latitude: member.latitude,
      longitude: member.longitude,
      isUrgent: true,
    },
    "Não foi possível avisar a coordenação.",
  );
}

export function convertSeed(session: AuthSession, seedId: string, notes: string) {
  return send(
    `/api/seeds/${seedId}/convert`,
    "POST",
    { caregiverId: session.membership.caregiverId, notes },
    "Falha ao converter contato em assistido.",
  );
}

export function inactivateSeed(seed: Seed) {
  return send(
    `/api/seeds/${seed.id}`,
    "PUT",
    { tenantId: seed.tenantId, referenceName: seed.referenceName, status: "inactive" },
    "Não foi possível inativar o contato.",
  );
}

export function inactivateMember(memberId: string) {
  return send(`/api/members/${memberId}/status`, "PATCH", { status: "inactive" }, "Não foi possível inativar o contato.");
}

export function claimSeed(session: AuthSession, seed: Seed) {
  return send(
    `/api/seeds/${seed.id}`,
    "PUT",
    {
      tenantId: seed.tenantId,
      referenceName: seed.referenceName,
      caregiverId: session.membership.caregiverId,
      age: seed.age,
      phone: seed.phone,
      city: seed.city,
      status: seed.status,
      notes: seed.notes,
      openHouse: seed.openHouse,
      address: seed.address,
      street: seed.street,
      neighborhood: seed.neighborhood,
      addressNumber: seed.addressNumber,
      state: seed.state,
      postalCode: seed.postalCode,
      source: seed.source,
      latitude: seed.latitude,
      longitude: seed.longitude,
      isUrgent: seed.isUrgent,
    },
    "Não foi possível assumir a responsabilidade deste contato.",
  );
}

export type NewContactPayload = {
  name: string;
  age: string;
  phone: string;
  city: string;
  notes: string;
  openHouse: boolean;
  postalCode: string;
  street: string;
  neighborhood: string;
  addressNumber: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
};

export function createSeed(session: AuthSession, form: NewContactPayload) {
  const address = form.openHouse
    ? `${form.street}, ${form.addressNumber} - ${form.neighborhood}, ${form.city} - ${form.state}, ${form.postalCode}, Brazil`
    : "";
  return send(
    "/api/seeds",
    "POST",
    {
      tenantId: session.membership.tenantId,
      caregiverId: session.membership.caregiverId,
      referenceName: form.name,
      age: form.age ? Number(form.age) : null,
      phone: form.phone,
      city: form.city,
      status: "new",
      notes: form.notes,
      source: "Cuidador",
      openHouse: form.openHouse,
      address,
      street: form.openHouse ? form.street : "",
      neighborhood: form.openHouse ? form.neighborhood : "",
      addressNumber: form.openHouse ? form.addressNumber : "",
      state: form.openHouse ? form.state : "",
      postalCode: form.openHouse ? form.postalCode : "",
      latitude: form.latitude,
      longitude: form.longitude,
    },
    "Falha ao cadastrar novo contato.",
  );
}
