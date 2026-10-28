import type { Followup, FollowupType, Member, Seed, SpiritualTemperature } from "@/server/domain/mvp";
import type { IconName } from "@/ui/atalaia";

/** Fuso fixo: servidor e navegador formatam as datas igual (evita erro de hidratação). */
export const CARE_TIME_ZONE = "America/Sao_Paulo";

export const FOLLOWUP_LABELS: Record<FollowupType, string> = {
  visit: "Visita",
  call: "Ligação",
  message: "Mensagem",
  prayer: "Oração",
  other: "Outro",
};

export const FOLLOWUP_ICONS: Record<FollowupType, IconName> = {
  visit: "visit",
  call: "call",
  message: "message",
  prayer: "prayer",
  other: "other",
};

export const FOLLOWUP_TYPES = Object.keys(FOLLOWUP_LABELS) as FollowupType[];

export const TEMPERATURE_LABELS: Record<SpiritualTemperature, string> = {
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
};

/** Pessoa sob o cuidado: contato (seed) ou assistido (member) numa forma única para as telas. */
export type CarePerson = {
  id: string;
  kind: "member" | "seed";
  name: string;
  city: string;
  neighborhood: string;
  phone: string;
  /** Status do domínio (`new`, `waiting_visit`, `in_progress`...). */
  status: string;
  isUrgent: boolean;
  temperature: SpiritualTemperature | null;
  notes: string;
  address: string;
  age: number | null;
  openHouse: boolean;
  source: string;
  caregiverId: string | null;
  /** Chegada do contato (seed) ou cadastro (member). */
  since: string | null;
  /** Último acompanhamento registrado (somente assistidos). */
  lastContactAt: string | null;
  /** Próxima ação programada, vinda do acompanhamento mais recente. */
  nextActionAt: string | null;
  followups: Followup[];
};

export type NeedItem = {
  person: CarePerson;
  reason: string;
  action: string;
  /** 3 urgente, 2 importante, 1 lembrete. */
  severity: 1 | 2 | 3;
};

export type UpcomingAction = {
  person: CarePerson;
  at: string;
  followup: Followup;
};

/* ---------------- Datas ---------------- */

function dayKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CARE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Dias de calendário entre `from` e `to` (positivo quando `to` é depois). */
export function calendarDaysBetween(from: string, to: string): number {
  const a = dayKey(from);
  const b = dayKey(to);
  if (!a || !b) return 0;
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CARE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** "12 de nov." */
export function formatDayMonth(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CARE_TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}

/** Só o número do dia ("12"). */
export function formatDayNumber(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: CARE_TIME_ZONE, day: "numeric" }).format(date);
}

/** Só o mês abreviado ("nov"). */
export function formatMonthShort(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: CARE_TIME_ZONE, month: "short" }).format(date).replace(".", "");
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CARE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** "terça, 12 de novembro" */
export function formatLongDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CARE_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** "hoje", "amanhã", "ontem", "em 3 dias", "há 5 dias". */
export function relativeDay(value: string | null | undefined, nowIso: string): string {
  if (!value) return "";
  const diff = calendarDaysBetween(nowIso, value);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff > 1) return `em ${diff} dias`;
  return `há ${Math.abs(diff)} dias`;
}

/** `datetime-local` e `date` no fuso do app, a partir de um instante. */
export function toDateInput(value: string | Date): string {
  return dayKey(value);
}

export function toTimeInput(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CARE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function toDateTimeInput(value: string | Date): string {
  return `${toDateInput(value)}T${toTimeInput(value)}`;
}

/** Soma dias a um instante (usado para o padrão de "próximo contato"). */
export function addDays(value: string, days: number): string {
  return new Date(Date.parse(value) + days * 86_400_000).toISOString();
}

/** Converte `<input type="date">` + hora (fuso do navegador) em instante ISO. Só chamar em eventos. */
export function localInputToIso(date: string, time = "09:00"): string {
  return new Date(`${date}T${time}`).toISOString();
}

/* ---------------- Contato ---------------- */

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Link do WhatsApp com DDI do Brasil quando o número vem sem ele. */
export function whatsappUrl(phone: string, text?: string): string {
  const digits = phoneDigits(phone);
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telUrl(phone: string): string {
  return `tel:+${phoneDigits(phone).length <= 11 ? "55" : ""}${phoneDigits(phone)}`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : (parts[0] ?? "");
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/* ---------------- Montagem das pessoas ---------------- */

function latestFirst(a: Followup, b: Followup) {
  return Date.parse(b.occurredAt) - Date.parse(a.occurredAt);
}

/**
 * Une assistidos e contatos numa lista só. Contatos já convertidos em assistido
 * (status `in_progress` ou vinculados por `seedId`) não aparecem duas vezes.
 */
export function buildCarePeople(members: Member[], seeds: Seed[], followups: Followup[]): CarePerson[] {
  const byMember = new Map<string, Followup[]>();
  for (const followup of followups) {
    const list = byMember.get(followup.memberId) ?? [];
    list.push(followup);
    byMember.set(followup.memberId, list);
  }
  const convertedSeedIds = new Set(members.map((member) => member.seedId).filter(Boolean));

  const people: CarePerson[] = [];

  for (const member of members) {
    const timeline = (byMember.get(member.id) ?? []).slice().sort(latestFirst);
    const latest = timeline[0];
    people.push({
      id: member.id,
      kind: "member",
      name: member.name,
      city: member.city || "",
      neighborhood: member.neighborhood || "",
      phone: member.phone || "",
      status: member.status,
      isUrgent: Boolean(member.isUrgent),
      temperature: member.spiritualTemperature ?? null,
      notes: member.notes || "",
      address: member.address || "",
      age: member.age,
      openHouse: false,
      source: "",
      caregiverId: member.caregiverId,
      since: member.createdAt ?? null,
      lastContactAt: latest?.occurredAt ?? null,
      nextActionAt: latest?.nextActionAt ?? null,
      followups: timeline,
    });
  }

  for (const seed of seeds) {
    if (seed.status === "in_progress" || convertedSeedIds.has(seed.id)) continue;
    people.push({
      id: seed.id,
      kind: "seed",
      name: seed.referenceName,
      city: seed.city || "",
      neighborhood: seed.neighborhood || "",
      phone: seed.phone || "",
      status: seed.status,
      isUrgent: Boolean(seed.isUrgent),
      temperature: null,
      notes: seed.notes || "",
      address: seed.address || "",
      age: seed.age,
      openHouse: seed.openHouse,
      source: seed.source || "",
      caregiverId: seed.caregiverId,
      since: seed.firstContactAt ?? seed.createdAt ?? null,
      lastContactAt: seed.firstContactAt ?? null,
      nextActionAt: null,
      followups: [],
    });
  }

  return people;
}

export function isOpenPerson(person: CarePerson): boolean {
  return person.status !== "inactive" && person.status !== "consolidated";
}

export function isOverdue(person: CarePerson, nowIso: string): boolean {
  return isOpenPerson(person) && person.nextActionAt !== null && calendarDaysBetween(nowIso, person.nextActionAt) < 0;
}

/** "Precisa de você": o que destrava com uma ação, na ordem de urgência. */
export function buildNeeds(people: CarePerson[], nowIso: string): NeedItem[] {
  const items: NeedItem[] = [];

  for (const person of people) {
    if (!isOpenPerson(person)) continue;

    if (isOverdue(person, nowIso) && person.nextActionAt) {
      items.push({
        person,
        severity: person.isUrgent ? 3 : 2,
        reason: `Ação atrasada desde ${formatDayMonth(person.nextActionAt)}`,
        action: "Registrar",
      });
    } else if (person.isUrgent) {
      items.push({ person, severity: 3, reason: "Caso urgente", action: person.kind === "member" ? "Registrar" : "Abrir" });
    } else if (person.kind === "seed" && person.status === "waiting_visit") {
      items.push({ person, severity: 2, reason: "Esperando visita", action: "Abrir" });
    } else if (person.kind === "seed" && person.status === "new") {
      const days = person.since ? Math.max(0, calendarDaysBetween(person.since, nowIso)) : 0;
      items.push({
        person,
        severity: 1,
        reason: days > 0 ? `Sem primeiro contato há ${plural(days, "dia", "dias")}` : "Chegou agora, sem primeiro contato",
        action: "Abrir",
      });
    } else if (person.kind === "member" && person.status === "new" && person.followups.length === 0) {
      items.push({ person, severity: 1, reason: "Assistido sem nenhum acompanhamento", action: "Registrar" });
    }
  }

  return items.sort((a, b) => b.severity - a.severity || a.person.name.localeCompare(b.person.name, "pt-BR"));
}

/** Próximos compromissos (hoje em diante), do mais próximo ao mais distante. */
export function buildUpcoming(people: CarePerson[], nowIso: string): UpcomingAction[] {
  const items: UpcomingAction[] = [];
  for (const person of people) {
    if (person.kind !== "member" || !isOpenPerson(person) || !person.nextActionAt) continue;
    if (calendarDaysBetween(nowIso, person.nextActionAt) < 0) continue;
    items.push({ person, at: person.nextActionAt, followup: person.followups[0] });
  }
  return items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/** Título legível de uma anotação (compromissos agendados começam com "Agendado:"). */
export function describeFollowupNotes(notes: string): { scheduled: boolean; text: string } {
  const scheduled = notes.startsWith("Agendado:");
  return { scheduled, text: scheduled ? notes.replace("Agendado:", "").trim() : notes };
}
