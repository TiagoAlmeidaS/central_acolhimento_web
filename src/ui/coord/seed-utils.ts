import type { Caregiver, Followup, Member, Seed } from "@/server/domain/mvp";

/** Limite de assistidos por cuidador usado nas barras de carga (mesmo criterio do painel anterior). */
export const CAREGIVER_CAPACITY = 5;
/** Contato sem cuidador ha mais que isso entra em "Precisa de alguem". */
export const NEEDS_UNASSIGNED_DAYS = 2;
/** Contato parado (novo/contatado) ha mais dias que isso entra em "Precisa de alguem". */
export const STALE_DAYS = 7;
/** Contato esperando visita ha esse numero de dias (ou mais) sem movimento precisa de alguem. */
export const WAITING_VISIT_DAYS = 3;

export type SeedStatus = Seed["status"];

/** Colunas do quadro, na ordem da jornada de acolhimento. */
export const BOARD_STATUSES: SeedStatus[] = ["new", "contacted", "waiting_visit", "in_progress", "consolidated"];

export const SEED_STATUS_LABEL: Record<SeedStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  waiting_visit: "Esperando visita",
  in_progress: "Virou membro",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

/** Rotulos no plural para colunas e filtros. */
export const SEED_STATUS_PLURAL: Record<SeedStatus, string> = {
  new: "Novos",
  contacted: "Contatados",
  waiting_visit: "Esperando visita",
  in_progress: "Viraram membros",
  consolidated: "Consolidados",
  inactive: "Inativos",
};

const DAY_MS = 86_400_000;

export function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export function daysSince(value: string | null | undefined, now: Date = new Date()): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));
}

/** Dias ate uma data futura (negativo quando ja passou). */
export function daysUntil(value: string | null | undefined, now: Date = new Date()): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - now.getTime()) / DAY_MS);
}

export function formatRelativeDays(days: number) {
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `${days} dias`;
  if (days < 30) return `${Math.floor(days / 7)} sem`;
  return `${Math.floor(days / 30)} m`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Quando o contato foi cadastrado (primeiro contato, ou criacao quando nao informado). */
export function seedStartedAt(seed: Seed) {
  return seed.firstContactAt ?? seed.createdAt ?? null;
}

/** Ultimo movimento conhecido do contato (atualizacao, senao o cadastro). */
export function seedLastActivityAt(seed: Seed) {
  return seed.updatedAt ?? seed.createdAt ?? seed.firstContactAt ?? null;
}

export function isOpenSeed(seed: Seed) {
  return seed.status === "new" || seed.status === "contacted" || seed.status === "waiting_visit";
}

// --- Precisa de alguem -------------------------------------------------------------------------

export type NeedAction = "assign" | "open" | "designate" | "register";

export type NeedItem = {
  key: string;
  kind: "seed" | "member";
  id: string;
  name: string;
  tenantId: string;
  reason: string;
  /** 3 urgente, 2 importante, 1 acompanhar. */
  sev: 1 | 2 | 3;
  action: NeedAction;
  actionLabel: string;
  days: number;
  /** Destino do botao quando a acao nao pode ser feita no proprio lugar. */
  href: string;
};

export function seedHref(id: string) {
  return `/coord/contatos?contato=${encodeURIComponent(id)}`;
}

/**
 * Quem precisa de alguem agora, ordenado pelo que um clique destrava: primeiro o que se resolve
 * atribuindo um cuidador, depois gravidade e tempo de espera.
 */
export function buildNeeds(input: {
  seeds: Seed[];
  members: Member[];
  followups: Followup[];
  now?: Date;
}): NeedItem[] {
  const now = input.now ?? new Date();
  const out: NeedItem[] = [];

  for (const seed of input.seeds) {
    if (seed.status === "consolidated" || seed.status === "inactive" || seed.status === "in_progress") continue;
    const sinceStart = daysSince(seedStartedAt(seed), now);
    const sinceActivity = daysSince(seedLastActivityAt(seed), now);
    const base = { kind: "seed" as const, id: seed.id, name: seed.referenceName, tenantId: seed.tenantId, href: seedHref(seed.id) };

    if (!seed.caregiverId && seed.isUrgent) {
      out.push({ ...base, key: `seed-${seed.id}`, sev: 3, reason: "Urgente e sem cuidador", action: "assign", actionLabel: "Atribuir", days: sinceStart });
    } else if (!seed.caregiverId && sinceStart > NEEDS_UNASSIGNED_DAYS) {
      out.push({ ...base, key: `seed-${seed.id}`, sev: 2, reason: `Sem cuidador há ${plural(sinceStart, "dia", "dias")}`, action: "assign", actionLabel: "Atribuir", days: sinceStart });
    } else if (seed.isUrgent) {
      out.push({ ...base, key: `seed-${seed.id}`, sev: 3, reason: `Urgente · ${SEED_STATUS_LABEL[seed.status].toLowerCase()}`, action: "open", actionLabel: "Abrir", days: sinceActivity });
    } else if (seed.status === "waiting_visit" && sinceActivity >= WAITING_VISIT_DAYS) {
      out.push({ ...base, key: `seed-${seed.id}`, sev: 2, reason: `Esperando visita há ${plural(sinceActivity, "dia", "dias")}`, action: "open", actionLabel: "Abrir", days: sinceActivity });
    } else if (sinceActivity > STALE_DAYS) {
      out.push({ ...base, key: `seed-${seed.id}`, sev: 1, reason: `Sem movimento há ${sinceActivity} dias`, action: "open", actionLabel: "Abrir", days: sinceActivity });
    }
  }

  const latestByMember = new Map<string, Followup>();
  for (const followup of input.followups) {
    const current = latestByMember.get(followup.memberId);
    if (!current || followup.occurredAt > current.occurredAt) latestByMember.set(followup.memberId, followup);
  }

  for (const member of input.members) {
    if (member.status === "inactive" || member.status === "consolidated") continue;
    const base = { kind: "member" as const, id: member.id, name: member.name, tenantId: member.tenantId };
    const designateHref = `/coord/membros/${member.id}/editar`;
    const nextAction = latestByMember.get(member.id)?.nextActionAt ?? null;
    const lateDays = nextAction ? -(daysUntil(nextAction, now) ?? 0) : 0;
    const sinceStart = daysSince(member.createdAt, now);

    if (member.isUrgent && !member.caregiverId) {
      out.push({ ...base, key: `member-${member.id}`, sev: 3, reason: "Urgente e sem cuidador", action: "designate", actionLabel: "Designar", days: sinceStart, href: designateHref });
    } else if (!member.caregiverId) {
      out.push({ ...base, key: `member-${member.id}`, sev: 2, reason: "Assistido sem cuidador", action: "designate", actionLabel: "Designar", days: sinceStart, href: designateHref });
    } else if (member.isUrgent) {
      out.push({ ...base, key: `member-${member.id}`, sev: 3, reason: "Caso urgente", action: "open", actionLabel: "Abrir", days: sinceStart, href: designateHref });
    } else if (lateDays > 0) {
      out.push({ ...base, key: `member-${member.id}`, sev: lateDays > 7 ? 2 : 1, reason: `Próxima ação atrasada ${plural(lateDays, "dia", "dias")}`, action: "register", actionLabel: "Registrar", days: lateDays, href: "/coord/acompanhamentos" });
    }
  }

  return out.sort(
    (a, b) =>
      b.sev - a.sev ||
      Number(b.action === "assign") - Number(a.action === "assign") ||
      b.days - a.days,
  );
}

/** Assistidos ativos cuja ultima proxima acao combinada ja passou. */
export function countLateActions(members: Member[], followups: Followup[], now: Date = new Date()) {
  const latest = new Map<string, Followup>();
  for (const followup of followups) {
    const current = latest.get(followup.memberId);
    if (!current || followup.occurredAt > current.occurredAt) latest.set(followup.memberId, followup);
  }
  return members.filter((member) => {
    if (member.status === "inactive") return false;
    const next = latest.get(member.id)?.nextActionAt ?? null;
    return next !== null && (daysUntil(next, now) ?? 0) < 0;
  }).length;
}

/** Cor/estado do ponto de um contato no mapa (chaves visuais do DashboardMap). */
export function seedMapStatus(seed: Seed): string {
  if (seed.isUrgent && seed.status !== "consolidated" && seed.status !== "inactive") return "urgente";
  if (seed.status === "new") return "novo";
  if (seed.status === "contacted" || seed.status === "waiting_visit") return "aguardando";
  if (seed.status === "in_progress") return "acompanhamento";
  if (seed.status === "consolidated") return "concluido";
  return "inativo";
}

/** Quantos assistidos ativos cada cuidador tem. */
export function activeMemberCount(caregiverId: string, members: Member[]) {
  return members.filter((member) => member.caregiverId === caregiverId && member.status !== "inactive").length;
}

export function loadLabel(caregiver: Pick<Caregiver, "name">, count: number) {
  return `${caregiver.name} · ${count}/${CAREGIVER_CAPACITY}`;
}

// --- API de contatos -----------------------------------------------------------------------------

/** Corpo completo de PUT /api/seeds/:id (a rota substitui o registro inteiro). */
export function buildSeedPayload(seed: Seed, overrides: Partial<Seed> = {}) {
  const next = { ...seed, ...overrides };
  return {
    tenantId: next.tenantId,
    caregiverId: next.caregiverId,
    referenceName: next.referenceName,
    age: next.age,
    phone: next.phone,
    city: next.city,
    postalCode: next.postalCode,
    source: next.source,
    status: next.status,
    notes: next.notes,
    firstContactAt: next.firstContactAt,
    openHouse: next.openHouse,
    address: next.address,
    street: next.street,
    neighborhood: next.neighborhood,
    addressNumber: next.addressNumber,
    state: next.state,
    houseFrontImageUrl: next.houseFrontImageUrl,
    latitude: next.latitude,
    longitude: next.longitude,
    isUrgent: next.isUrgent ?? false,
    outingEventId: next.outingEventId ?? null,
  };
}

export type SeedMutationResult = { ok: true; seed: Seed } | { ok: false; error: string };

async function readError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  return payload.error ?? fallback;
}

/** Atualiza um contato (PUT /api/seeds/:id) preservando todos os campos que nao mudaram. */
export async function updateSeedRequest(seed: Seed, overrides: Partial<Seed>): Promise<SeedMutationResult> {
  try {
    const response = await fetch(`/api/seeds/${seed.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSeedPayload(seed, overrides)),
    });
    if (!response.ok) return { ok: false, error: await readError(response, "Não foi possível atualizar o contato.") };
    const updated = (await response.json()) as Seed;
    return { ok: true, seed: { ...seed, ...overrides, ...updated } };
  } catch {
    return { ok: false, error: "Sem conexão. Tente de novo." };
  }
}

/** Converte o contato em membro (POST /api/seeds/:id/convert). */
export async function convertSeedRequest(seed: Seed): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(`/api/seeds/${seed.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caregiverId: seed.caregiverId,
        address: seed.address || undefined,
        notes: seed.notes,
        latitude: seed.latitude,
        longitude: seed.longitude,
      }),
    });
    if (!response.ok) return { ok: false, error: await readError(response, "Não foi possível converter o contato.") };
    return { ok: true };
  } catch {
    return { ok: false, error: "Sem conexão. Tente de novo." };
  }
}

/** Exclui o contato (DELETE /api/seeds/:id). */
export async function deleteSeedRequest(seed: Seed): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(`/api/seeds/${seed.id}`, { method: "DELETE" });
    if (!response.ok) return { ok: false, error: await readError(response, "Não foi possível excluir o contato.") };
    return { ok: true };
  } catch {
    return { ok: false, error: "Sem conexão. Tente de novo." };
  }
}

// --- Filtros da lista de contatos -------------------------------------------------------------

export type ChipId = "" | "needs" | "urgent" | "open" | "none";

const CHIP_BY_PARAM: Record<string, ChipId> = {
  precisa: "needs",
  urgentes: "urgent",
  "casa-aberta": "open",
  "sem-cuidador": "none",
};

/** Traduz `?filtro=` da URL para o chip ativo da lista de contatos. */
export function chipFromParam(value: string | undefined): ChipId {
  return (value && CHIP_BY_PARAM[value]) || "";
}
