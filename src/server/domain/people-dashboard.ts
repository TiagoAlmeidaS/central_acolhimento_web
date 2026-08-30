import type {
  ChurchAttendanceRecord,
  ChurchMeetingOccurrence,
  ChurchMeetingType,
  ChurchMembership,
  DataScope,
  Followup,
  Member,
  PeopleDashboardFilters,
  PeopleDashboardPeriod,
  PeopleDashboardSnapshot,
  Seed,
  SeedStatusHistoryEntry,
  Tenant,
} from "@/server/domain/mvp";
import { listChurchAttendance, listChurchMeetingTypes, listChurchMemberships, listChurchOccurrences } from "@/server/repositories/church-repository";
import { listFollowups, listMembers, listSeeds, listSeedStatusHistory, listTenants } from "@/server/repositories/mvp-repository";

export const PEOPLE_DASHBOARD_TIMEZONE = "America/Sao_Paulo" as const;

type PeopleDashboardScope = {
  tenants: Tenant[];
  scopedTenants: Tenant[];
  filters: PeopleDashboardFilters;
};

function isValidDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dateOnlyUtc(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseDateOnlyUtc(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateShort(value: string) {
  return parseDateOnlyUtc(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

function resolvePeriodRange(period: PeopleDashboardPeriod, referenceDate: string) {
  const reference = parseDateOnlyUtc(referenceDate);
  if (Number.isNaN(reference.getTime())) throw new Error("Data invalida. Use AAAA-MM-DD.");

  if (period === "day") {
    return { startDate: referenceDate, endDate: referenceDate, startAt: `${referenceDate}T03:00:00.000Z`, endExclusive: new Date(`${referenceDate}T03:00:00.000Z`).getTime() + 86_400_000 };
  }

  if (period === "month") {
    const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
    const end = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0));
    return {
      startDate: dateOnlyUtc(start),
      endDate: dateOnlyUtc(end),
      startAt: `${dateOnlyUtc(start)}T03:00:00.000Z`,
      endExclusive: new Date(`${dateOnlyUtc(end)}T03:00:00.000Z`).getTime() + 86_400_000,
    };
  }

  const weekday = reference.getUTCDay();
  const distanceFromMonday = weekday === 0 ? 6 : weekday - 1;
  const start = new Date(reference);
  start.setUTCDate(reference.getUTCDate() - distanceFromMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    startDate: dateOnlyUtc(start),
    endDate: dateOnlyUtc(end),
    startAt: `${dateOnlyUtc(start)}T03:00:00.000Z`,
    endExclusive: new Date(`${dateOnlyUtc(end)}T03:00:00.000Z`).getTime() + 86_400_000,
  };
}

function isInstantInRange(value: string | null | undefined, startAt: string, endExclusive: number) {
  if (!value) return false;
  const instant = new Date(value).getTime();
  if (Number.isNaN(instant)) return false;
  return instant >= new Date(startAt).getTime() && instant < endExclusive;
}

function isDateOnlyInRange(value: string | null | undefined, startDate: string, endDate: string) {
  return !!value && value >= startDate && value <= endDate;
}

function sanitizeCsvValue(value: string | number | boolean | null | undefined) {
  const raw = value === null || value === undefined ? "" : String(value);
  const neutralized = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n;]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

function buildScope(tenants: Tenant[], raw: {
  view?: string | null;
  period?: string | null;
  referenceDate?: string | null;
  state?: string | null;
  city?: string | null;
  tenantId?: string | null;
  meetingTypeId?: string | null;
}): PeopleDashboardScope {
  const availableStates = Array.from(new Set(tenants.map((tenant) => tenant.state).filter(Boolean))).sort();
  const period = raw.period === "day" || raw.period === "month" ? raw.period : "week";
  const view = raw.view === "church" ? "church" : "contacts";
  const referenceDate = raw.referenceDate && isValidDateOnly(raw.referenceDate) ? raw.referenceDate : new Date().toISOString().slice(0, 10);
  const state = raw.state?.trim() || (availableStates.length === 1 ? availableStates[0] : "");

  if (!state) throw new Error("Selecione um estado valido.");
  if (!availableStates.includes(state)) throw new Error("Estado fora do escopo acessivel.");

  const stateTenants = tenants.filter((tenant) => tenant.state === state);
  const availableCities = Array.from(new Set(stateTenants.map((tenant) => tenant.city).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const city = raw.city?.trim() || null;
  if (city && !availableCities.includes(city)) throw new Error("Cidade fora do escopo acessivel.");

  const cityTenants = city ? stateTenants.filter((tenant) => tenant.city === city) : stateTenants;
  const tenantId = raw.tenantId?.trim() || null;
  if (tenantId && !cityTenants.some((tenant) => tenant.id === tenantId)) throw new Error("Localidade fora do escopo acessivel.");

  const scopedTenants = tenantId ? cityTenants.filter((tenant) => tenant.id === tenantId) : cityTenants;
  return {
    tenants,
    scopedTenants,
    filters: { view, period, referenceDate, state, city, tenantId, meetingTypeId: raw.meetingTypeId?.trim() || null },
  };
}

function summarizeContacts(seeds: Seed[], followups: Followup[], tenants: Tenant[], history: SeedStatusHistoryEntry[], filters: PeopleDashboardFilters): PeopleDashboardSnapshot {
  const range = resolvePeriodRange(filters.period, filters.referenceDate);
  const tenantMap = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const filteredSeeds = seeds.filter((seed) => isInstantInRange(seed.createdAt, range.startAt, range.endExclusive));
  const followupsBySeedName = new Map<string, Followup[]>();
  for (const followup of followups) {
    const list = followupsBySeedName.get(followup.member ?? "") ?? [];
    list.push(followup);
    followupsBySeedName.set(followup.member ?? "", list);
  }

  const summary = {
    generatedContacts: filteredSeeds.length,
    contactsWithoutCaregiver: filteredSeeds.filter((seed) => !seed.caregiverId).length,
    firstContactPending: filteredSeeds.filter((seed) => !seed.firstContactAt).length,
    waitingVisit: filteredSeeds.filter((seed) => seed.status === "waiting_visit").length,
    updatedInPeriod: filteredSeeds.filter((seed) => isInstantInRange(seed.updatedAt, range.startAt, range.endExclusive)).length,
    urgentContacts: filteredSeeds.filter((seed) => seed.isUrgent).length,
    statusChangesInPeriod: history.filter((item) => isInstantInRange(item.changedAt, range.startAt, range.endExclusive)).length,
  };

  const timelineMap = new Map<string, number>();
  for (let cursor = parseDateOnlyUtc(range.startDate); dateOnlyUtc(cursor) <= range.endDate; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    timelineMap.set(dateOnlyUtc(cursor), 0);
  }
  for (const seed of filteredSeeds) {
    const key = (seed.createdAt ?? "").slice(0, 10);
    if (timelineMap.has(key)) timelineMap.set(key, (timelineMap.get(key) ?? 0) + 1);
  }

  const statusOrder: Seed["status"][] = ["new", "contacted", "waiting_visit", "in_progress", "consolidated", "inactive"];
  const statusDistribution = statusOrder.reduce<Record<string, number>>((acc, status) => {
    acc[status] = filteredSeeds.filter((seed) => seed.status === status).length;
    return acc;
  }, {});

  const cityMap = new Map<string, { state: string; city: string; values: Record<string, number> }>();
  for (const seed of filteredSeeds) {
    const tenant = tenantMap.get(seed.tenantId);
    const key = `${tenant?.state ?? seed.state}::${seed.city}`;
    const existing = cityMap.get(key) ?? {
      state: tenant?.state ?? seed.state,
      city: seed.city,
      values: { generatedContacts: 0, waitingVisit: 0, firstContactPending: 0, urgentContacts: 0 },
    };
    existing.values.generatedContacts += 1;
    if (seed.status === "waiting_visit") existing.values.waitingVisit += 1;
    if (!seed.firstContactAt) existing.values.firstContactPending += 1;
    if (seed.isUrgent) existing.values.urgentContacts += 1;
    cityMap.set(key, existing);
  }

  const people = filteredSeeds
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""))
    .map((seed) => {
      const tenant = tenantMap.get(seed.tenantId);
      const latestFollowup = (followupsBySeedName.get(seed.referenceName) ?? []).sort((a, b) => (b.occurredAt ?? "").localeCompare(a.occurredAt ?? ""))[0];
      return {
        id: seed.id,
        name: seed.referenceName,
        city: seed.city,
        state: tenant?.state ?? seed.state,
        tenantName: tenant?.name ?? "",
        source: seed.source,
        currentStatus: seed.status,
        caregiver: seed.caregiver ?? null,
        createdAt: seed.createdAt ?? null,
        firstContactAt: seed.firstContactAt ?? null,
        updatedAt: seed.updatedAt ?? null,
        latestFollowupAt: latestFollowup?.occurredAt ?? null,
        urgent: seed.isUrgent ? "sim" : "nao",
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    timezone: PEOPLE_DASHBOARD_TIMEZONE,
    filters,
    availableStates: [],
    availableCities: [],
    availableTenants: [],
    summary,
    timeline: Array.from(timelineMap.entries()).map(([key, value]) => ({ key, label: formatDateShort(key), values: { generatedContacts: value } })),
    cities: Array.from(cityMap.values()).sort((a, b) => b.values.generatedContacts - a.values.generatedContacts || a.city.localeCompare(b.city, "pt-BR")),
    people,
    warnings: [],
  };
}

async function loadAttendancePairs(occurrences: ChurchMeetingOccurrence[]) {
  return Promise.all(occurrences.map(async (occurrence) => ({ occurrence, records: await listChurchAttendance(occurrence.id, { tenantId: occurrence.tenantId }) })));
}

function isMembershipEligible(membership: ChurchMembership, occursOn: string) {
  if (membership.status !== "active") return false;
  if (membership.startedAt && membership.startedAt > occursOn) return false;
  if (membership.endedAt && membership.endedAt < occursOn) return false;
  return true;
}

function percent(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : null;
}

async function summarizeChurch(input: {
  memberships: ChurchMembership[];
  members: Member[];
  tenants: Tenant[];
  occurrences: ChurchMeetingOccurrence[];
  meetingTypes: ChurchMeetingType[];
  filters: PeopleDashboardFilters;
}) {
  const range = resolvePeriodRange(input.filters.period, input.filters.referenceDate);
  const tenantMap = new Map(input.tenants.map((tenant) => [tenant.id, tenant]));
  const memberMap = new Map(input.members.map((member) => [member.id, member]));
  const filteredOccurrences = input.occurrences.filter((occurrence) => {
    if (input.filters.meetingTypeId && occurrence.meetingTypeId !== input.filters.meetingTypeId) return false;
    return occurrence.status === "completed" && !!occurrence.attendanceClosedAt && isDateOnlyInRange(occurrence.occursOn, range.startDate, range.endDate);
  });
  const pendingOccurrences = input.occurrences.filter((occurrence) => {
    if (input.filters.meetingTypeId && occurrence.meetingTypeId !== input.filters.meetingTypeId) return false;
    return occurrence.status !== "cancelled" && !occurrence.attendanceClosedAt && isDateOnlyInRange(occurrence.occursOn, range.startDate, range.endDate);
  });
  const pairs = await loadAttendancePairs(filteredOccurrences);

  const warnings: string[] = [];
  let present = 0;
  let absent = 0;
  let justified = 0;
  let unmarkedClosed = 0;
  const presentMembers = new Set<string>();
  const memberStats = new Map<string, { eligible: number; present: number; absent: number; justified: number; lastPresence: string | null; meetingTypeIds: Set<string> }>();
  const cityStats = new Map<string, { state: string; city: string; values: Record<string, number> }>();

  for (const { occurrence, records } of pairs) {
    const eligibleMemberships = input.memberships.filter((membership) => membership.tenantId === occurrence.tenantId && isMembershipEligible(membership, occurrence.occursOn));
    const eligibleIds = new Set(eligibleMemberships.map((membership) => membership.memberId));
    for (const record of records) {
      if (!eligibleIds.has(record.memberId)) continue;
      const member = memberMap.get(record.memberId);
      const tenant = member ? tenantMap.get(member.tenantId) : tenantMap.get(occurrence.tenantId);
      const cityKey = `${tenant?.state ?? ""}::${member?.city ?? tenant?.city ?? ""}`;
      const cityItem = cityStats.get(cityKey) ?? { state: tenant?.state ?? "", city: member?.city ?? tenant?.city ?? "", values: { activeMembers: 0, presentPeople: 0, withoutPresence: 0 } };
      cityStats.set(cityKey, cityItem);

      const stats = memberStats.get(record.memberId) ?? { eligible: 0, present: 0, absent: 0, justified: 0, lastPresence: null, meetingTypeIds: new Set<string>() };
      stats.meetingTypeIds.add(occurrence.meetingTypeId);
      if (record.status === "unmarked") {
        unmarkedClosed += 1;
        continue;
      }
      stats.eligible += 1;
      if (record.status === "present") {
        present += 1;
        stats.present += 1;
        stats.lastPresence = occurrence.occursOn;
        presentMembers.add(record.memberId);
      }
      if (record.status === "absent") {
        absent += 1;
        stats.absent += 1;
      }
      if (record.status === "justified") {
        justified += 1;
        stats.justified += 1;
      }
      memberStats.set(record.memberId, stats);
    }
  }

  if (unmarkedClosed > 0) {
    warnings.push(`${unmarkedClosed} registro(s) fechados ainda estavam sem marcacao e foram excluidos do calculo.`);
  }

  const activeMemberships = input.memberships.filter((membership) => membership.status === "active").length;
  const people = Array.from(memberStats.entries()).map(([memberId, stats]) => {
    const member = memberMap.get(memberId);
    const tenant = member ? tenantMap.get(member.tenantId) : null;
    return {
      id: memberId,
      name: member?.name ?? "Membro sem cadastro",
      city: member?.city ?? tenant?.city ?? "",
      state: member?.state ?? tenant?.state ?? "",
      tenantName: tenant?.name ?? "",
      presences: stats.present,
      absences: stats.absent,
      justified: stats.justified,
      eligibleOccurrences: stats.eligible,
      frequency: percent(stats.present, stats.eligible),
      lastPresence: stats.lastPresence,
      status: stats.present > 0 ? "gathering" : "needs_review",
    };
  }).sort((left, right) => {
    if ((right.frequency ?? -1) !== (left.frequency ?? -1)) return (right.frequency ?? -1) - (left.frequency ?? -1);
    return String(left.name).localeCompare(String(right.name), "pt-BR");
  });

  const activeMembersByCity = new Map<string, Set<string>>();
  for (const membership of input.memberships.filter((item) => item.status === "active")) {
    const member = memberMap.get(membership.memberId);
    if (!member) continue;
    const key = `${member.state}::${member.city}`;
    const set = activeMembersByCity.get(key) ?? new Set<string>();
    set.add(member.id);
    activeMembersByCity.set(key, set);
  }
  for (const item of people) {
    const key = `${item.state}::${item.city}`;
    const cityItem = cityStats.get(key) ?? { state: item.state, city: item.city, values: { activeMembers: 0, presentPeople: 0, withoutPresence: 0 } };
    if (item.presences > 0) cityItem.values.presentPeople += 1;
    if (item.presences === 0 && item.eligibleOccurrences > 0) cityItem.values.withoutPresence += 1;
    cityStats.set(key, cityItem);
  }
  for (const [key, memberIds] of activeMembersByCity.entries()) {
    const cityItem = cityStats.get(key);
    if (cityItem) cityItem.values.activeMembers = memberIds.size;
  }

  const timeline = pairs.map(({ occurrence, records }) => {
    const eligible = records.filter((record) => record.status !== "unmarked").length;
    const occurrencePresent = records.filter((record) => record.status === "present").length;
    const occurrenceAbsent = records.filter((record) => record.status === "absent").length;
    const occurrenceJustified = records.filter((record) => record.status === "justified").length;
    return {
      key: occurrence.id,
      label: `${formatDateShort(occurrence.occursOn)} · ${occurrence.meetingTypeName ?? "Reuniao"}`,
      values: { present: occurrencePresent, eligible, absent: occurrenceAbsent, justified: occurrenceJustified },
    };
  }).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return {
    generatedAt: new Date().toISOString(),
    timezone: PEOPLE_DASHBOARD_TIMEZONE,
    filters: input.filters,
    availableStates: [],
    availableCities: [],
    availableTenants: [],
    summary: {
      activeMemberships,
      gatheringPeople: presentMembers.size,
      peopleWithoutPresence: people.filter((item) => item.presences === 0 && item.eligibleOccurrences > 0).length,
      averageFrequency: present + absent + justified > 0 ? percent(present, present + absent + justified) : null,
      justifiedAbsences: justified,
      pendingCalls: pendingOccurrences.length,
      eligibleOccurrences: filteredOccurrences.length,
      attendanceBase: present + absent + justified,
    },
    timeline,
    cities: Array.from(cityStats.values()).sort((a, b) => b.values.activeMembers - a.values.activeMembers || a.city.localeCompare(b.city, "pt-BR")),
    people,
    warnings: filteredOccurrences.length === 0 ? ["Sem base de chamadas fechadas no periodo selecionado."] : warnings,
  } satisfies PeopleDashboardSnapshot;
}

export async function getPeopleDashboardSnapshot(rawFilters: {
  view?: string | null;
  period?: string | null;
  referenceDate?: string | null;
  state?: string | null;
  city?: string | null;
  tenantId?: string | null;
  meetingTypeId?: string | null;
}, scope: DataScope): Promise<PeopleDashboardSnapshot> {
  const tenants = await listTenants(scope);
  if (tenants.length === 0) throw new Error("Nenhuma localidade acessivel para este dashboard.");

  const scoped = buildScope(tenants, rawFilters);
  const scopedTenantIds = scoped.scopedTenants.map((tenant) => tenant.id);
  const scopedData: DataScope = { tenantIds: scopedTenantIds };

  let snapshot: PeopleDashboardSnapshot;
  if (scoped.filters.view === "contacts") {
    const [seeds, followups, history] = await Promise.all([
      listSeeds(scopedData),
      listFollowups(scopedData),
      listSeedStatusHistory(scopedData),
    ]);
    snapshot = summarizeContacts(seeds, followups, scoped.scopedTenants, history, scoped.filters);
  } else {
    const [memberships, members, occurrences, meetingTypes] = await Promise.all([
      listChurchMemberships(scopedData),
      listMembers(scopedData),
      listChurchOccurrences(scopedData),
      listChurchMeetingTypes(scopedData),
    ]);
    if (scoped.filters.meetingTypeId && !meetingTypes.some((item) => item.id === scoped.filters.meetingTypeId)) {
      throw new Error("Tipo de reuniao fora do escopo acessivel.");
    }
    snapshot = await summarizeChurch({ memberships, members, tenants: scoped.scopedTenants, occurrences, meetingTypes, filters: scoped.filters });
  }

  snapshot.availableStates = Array.from(new Set(tenants.map((tenant) => tenant.state).filter(Boolean))).sort();
  snapshot.availableCities = Array.from(new Set(scoped.scopedTenants.map((tenant) => tenant.city).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  snapshot.availableTenants = scoped.scopedTenants.map((tenant) => ({ id: tenant.id, name: tenant.name, city: tenant.city, state: tenant.state }));
  return snapshot;
}

export function buildPeopleCsv(snapshot: PeopleDashboardSnapshot) {
  if (snapshot.filters.view === "contacts") {
    const header = ["id", "nome", "cidade", "estado", "localidade", "origem", "status_atual", "cuidador", "created_at", "first_contact_at", "updated_at", "urgente"];
    const rows = snapshot.people.map((item) => [
      item.id,
      item.name,
      item.city,
      item.state,
      item.tenantName,
      item.source,
      item.currentStatus,
      item.caregiver,
      item.createdAt,
      item.firstContactAt,
      item.updatedAt,
      item.urgent,
    ].map(sanitizeCsvValue).join(";"));
    return [header.join(";"), ...rows].join("\n");
  }

  const header = ["id", "nome", "cidade", "estado", "localidade", "presencas", "faltas", "justificadas", "elegiveis", "frequencia", "ultima_presenca", "status"];
  const rows = snapshot.people.map((item) => [
    item.id,
    item.name,
    item.city,
    item.state,
    item.tenantName,
    item.presences,
    item.absences,
    item.justified,
    item.eligibleOccurrences,
    item.frequency,
    item.lastPresence,
    item.status,
  ].map(sanitizeCsvValue).join(";"));
  return [header.join(";"), ...rows].join("\n");
}

export function buildPeoplePdf(snapshot: PeopleDashboardSnapshot) {
  const summaryLines = Object.entries(snapshot.summary).map(([key, value]) => `${key}: ${value ?? "—"}`);
  const detailLines = snapshot.people.slice(0, 40).map((item) => Object.entries(item).map(([key, value]) => `${key}=${value ?? ""}`).join(" | "));
  const text = [
    `Dashboard ${snapshot.filters.view === "contacts" ? "Contatos" : "Igreja"}`,
    `Gerado em ${snapshot.generatedAt}`,
    `Periodo: ${snapshot.filters.period} · Referencia ${snapshot.filters.referenceDate}`,
    `Estado: ${snapshot.filters.state}${snapshot.filters.city ? ` · Cidade: ${snapshot.filters.city}` : ""}`,
    "",
    "Resumo",
    ...summaryLines,
    "",
    "Detalhes",
    ...detailLines,
  ];
  return createSimplePdfDocument(text);
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createSimplePdfDocument(lines: string[]) {
  const contentLines: string[] = ["BT", "/F1 10 Tf", "50 792 Td"];
  lines.forEach((line, index) => {
    if (index === 0) {
      contentLines.push(`(${escapePdfText(line)}) Tj`);
      return;
    }
    contentLines.push("0 -14 Td");
    contentLines.push(`(${escapePdfText(line)}) Tj`);
  });
  contentLines.push("ET");
  const stream = contentLines.join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj`,
  ];

  const parts = ["%PDF-1.4\n"];
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(parts.join(""), "utf8"));
    parts.push(`${object}\n`);
  }
  const xrefOffset = Buffer.byteLength(parts.join(""), "utf8");
  parts.push(`xref\n0 ${objects.length + 1}\n`);
  parts.push("0000000000 65535 f \n");
  for (let index = 1; index <= objects.length; index += 1) {
    parts.push(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  }
  parts.push(`trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return Buffer.from(parts.join(""), "utf8");
}
