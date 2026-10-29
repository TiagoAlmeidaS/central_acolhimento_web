import {
  listChurchAttendance,
  listChurchMeetingTypes,
  listChurchMemberships,
  listChurchOccurrences,
} from "@/server/repositories/church-repository";
import { addDays, parseDateOnly, toDateOnly, todayDateOnly } from "@/server/domain/dashboard-date";
import { buildOverdueNextActionByMember, countPeopleWithOverdueNextAction } from "@/ui/mvp/dashboard-status-utils";
import type {
  ChurchAttendanceRecord,
  ChurchMeetingOccurrence,
  ChurchMeetingType,
  ChurchMembership,
  DataScope,
  Followup,
  Member,
} from "@/server/domain/mvp";

// Calculos do perfil da igreja (frequencia e cuidado) usados pelo painel da coordenacao.
// Somente servidor: chama os repositorios da igreja.

export type ChurchPeriod = "day" | "week" | "month";

export type PeriodRange = {
  start: string;
  end: string;
  label: string;
};

export type ChurchMetricComparison = {
  value: number;
  previous: number | null;
  delta: number | null;
};

export type ChurchAttentionItem = {
  member: Member;
  caregiverName: string | null;
  lastPresence: string | null;
  sampleTotal: number;
  presentTotal: number;
  absentTotal: number;
  justifiedTotal: number;
  consecutiveAbsences: number;
  frequency: number | null;
  priority: "alta" | "media" | "baixa";
  reason: string;
  latestFollowup: Followup | null;
  overdueAction: Followup | null;
};

export type ChurchProfileDashboard = {
  range: PeriodRange;
  previousRange: PeriodRange;
  activeMemberships: number;
  closedOccurrences: ChurchMeetingOccurrence[];
  pendingOccurrences: ChurchMeetingOccurrence[];
  meetingTypes: ChurchMeetingType[];
  presentPeople: ChurchMetricComparison;
  averageFrequency: ChurchMetricComparison;
  attendanceBase: {
    present: number;
    eligible: number;
    absent: number;
    justified: number;
  };
  trend: Array<{ label: string; present: number; eligible: number; rate: number | null }>;
  attention: ChurchAttentionItem[];
  inCareCases: number;
  overdueContacts: number;
};

export function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function formatDateLabel(value: string) {
  return parseDateOnly(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatShortDateLabel(value: string) {
  return parseDateOnly(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

export function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

export function resolvePeriodRange(period: ChurchPeriod, referenceDate: string): PeriodRange {
  const reference = parseDateOnly(referenceDate);

  if (period === "day") {
    const day = toDateOnly(reference);
    return { start: day, end: day, label: formatDateLabel(day) };
  }

  if (period === "month") {
    const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
    const end = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0));
    return {
      start: toDateOnly(start),
      end: toDateOnly(end),
      label: start.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }),
    };
  }

  const weekday = reference.getUTCDay();
  const distanceFromMonday = weekday === 0 ? 6 : weekday - 1;
  const start = new Date(reference);
  start.setUTCDate(reference.getUTCDate() - distanceFromMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    start: toDateOnly(start),
    end: toDateOnly(end),
    label: `${formatShortDateLabel(toDateOnly(start))} a ${formatShortDateLabel(toDateOnly(end))}`,
  };
}

function resolvePreviousRange(period: ChurchPeriod, range: PeriodRange): PeriodRange {
  if (period === "day") {
    return resolvePeriodRange(period, addDays(range.start, -1));
  }

  if (period === "month") {
    const start = parseDateOnly(range.start);
    start.setUTCMonth(start.getUTCMonth() - 1);
    return resolvePeriodRange(period, toDateOnly(start));
  }

  return resolvePeriodRange(period, addDays(range.start, -7));
}

export function isDateBetween(value: string, start: string, end: string) {
  return value >= start && value <= end;
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

function comparison(value: number, previous: number | null): ChurchMetricComparison {
  if (previous === null) {
    return { value, previous: null, delta: null };
  }

  return { value, previous, delta: value - previous };
}

export function formatComparison(item: ChurchMetricComparison, suffix = "") {
  if (item.previous === null || item.delta === null) return "Sem base anterior";
  const sign = item.delta > 0 ? "+" : "";
  return `${sign}${item.delta}${suffix} vs. período anterior`;
}

async function loadAttendanceForOccurrences(occurrences: ChurchMeetingOccurrence[], scope: DataScope) {
  const pairs = await Promise.all(
    occurrences.map(async (occurrence) => ({
      occurrence,
      records: await listChurchAttendance(occurrence.id, scope),
    })),
  );
  return pairs;
}

function summarizeAttendance(
  pairs: Array<{ occurrence: ChurchMeetingOccurrence; records: ChurchAttendanceRecord[] }>,
  memberships: ChurchMembership[],
  meetingTypeId?: string,
) {
  let eligible = 0;
  let present = 0;
  let absent = 0;
  let justified = 0;
  const presentMembers = new Set<string>();

  for (const { occurrence, records } of pairs) {
    if (meetingTypeId && occurrence.meetingTypeId !== meetingTypeId) continue;
    const eligibleMemberIds = new Set(
      memberships
        .filter((membership) => membership.tenantId === occurrence.tenantId && isMembershipEligible(membership, occurrence.occursOn))
        .map((membership) => membership.memberId),
    );
    for (const record of records) {
      if (!eligibleMemberIds.has(record.memberId)) continue;
      if (record.status === "unmarked") continue;
      eligible += 1;
      if (record.status === "present") {
        present += 1;
        presentMembers.add(record.memberId);
      }
      if (record.status === "absent") absent += 1;
      if (record.status === "justified") justified += 1;
    }
  }

  return {
    eligible,
    present,
    absent,
    justified,
    presentPeople: presentMembers.size,
    averageFrequency: percent(present, eligible),
  };
}

function buildTrend(
  pairs: Array<{ occurrence: ChurchMeetingOccurrence; records: ChurchAttendanceRecord[] }>,
  memberships: ChurchMembership[],
  period: ChurchPeriod,
  range: PeriodRange,
  meetingTypeId?: string,
) {
  const buckets = new Map<string, { label: string; present: number; eligible: number }>();

  for (const { occurrence, records } of pairs) {
    if (meetingTypeId && occurrence.meetingTypeId !== meetingTypeId) continue;
    const key =
      period === "month"
        ? `Semana ${Math.floor((parseDateOnly(occurrence.occursOn).getUTCDate() - 1) / 7) + 1}`
        : occurrence.occursOn;
    const label = period === "month" ? key : formatShortDateLabel(occurrence.occursOn);
    const bucket = buckets.get(key) ?? { label, present: 0, eligible: 0 };
    const eligibleMemberIds = new Set(
      memberships
        .filter((membership) => membership.tenantId === occurrence.tenantId && isMembershipEligible(membership, occurrence.occursOn))
        .map((membership) => membership.memberId),
    );
    for (const record of records) {
      if (!eligibleMemberIds.has(record.memberId) || record.status === "unmarked") continue;
      bucket.eligible += 1;
      if (record.status === "present") bucket.present += 1;
    }
    buckets.set(key, bucket);
  }

  if (period === "day" && buckets.size === 0) {
    return [{ label: formatShortDateLabel(range.start), present: 0, eligible: 0, rate: null }];
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => ({
      ...bucket,
      rate: percent(bucket.present, bucket.eligible),
    }));
}

function buildAttentionList(input: {
  pairs: Array<{ occurrence: ChurchMeetingOccurrence; records: ChurchAttendanceRecord[] }>;
  memberships: ChurchMembership[];
  members: Member[];
  caregiversById: Map<string, string>;
  followups: Followup[];
  meetingTypeId?: string;
}) {
  const memberMap = new Map(input.members.map((member) => [member.id, member]));
  const followupsByMember = new Map<string, Followup[]>();
  for (const followup of input.followups) {
    const list = followupsByMember.get(followup.memberId) ?? [];
    list.push(followup);
    followupsByMember.set(followup.memberId, list);
  }

  const activeMemberIds = new Set(input.memberships.filter((membership) => membership.status === "active").map((membership) => membership.memberId));
  // Mesma regra do KPI "Pessoas com ação vencida": vale só a próxima ação mais
  // recente da pessoa, não qualquer followup antigo com nextActionAt no passado.
  const overdueByMember = buildOverdueNextActionByMember(input.followups);

  const items: Array<ChurchAttentionItem | null> = Array.from(activeMemberIds)
    .map((memberId) => {
      const member = memberMap.get(memberId);
      if (!member) return null;

      const attendance = input.pairs
        .filter(({ occurrence }) => !input.meetingTypeId || occurrence.meetingTypeId === input.meetingTypeId)
        .flatMap(({ occurrence, records }) =>
          records
            .filter((record) => record.memberId === memberId && record.status !== "unmarked")
            .map((record) => ({ record, occursOn: occurrence.occursOn })),
        )
        .sort((a, b) => a.occursOn.localeCompare(b.occursOn));

      const sampleTotal = attendance.length;
      const presentTotal = attendance.filter(({ record }) => record.status === "present").length;
      const absentTotal = attendance.filter(({ record }) => record.status === "absent").length;
      const justifiedTotal = attendance.filter(({ record }) => record.status === "justified").length;
      const frequency = percent(presentTotal, sampleTotal);
      const lastPresence = [...attendance].reverse().find(({ record }) => record.status === "present")?.occursOn ?? null;

      let consecutiveAbsences = 0;
      for (const item of [...attendance].reverse()) {
        if (item.record.status === "present") break;
        if (item.record.status === "absent") consecutiveAbsences += 1;
      }

      const latestFollowup: Followup | null =
        (followupsByMember.get(memberId) ?? []).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null;
      const overdueAction: Followup | null = overdueByMember.get(memberId) ?? null;

      const daysWithoutPresence = lastPresence
        ? Math.floor((parseDateOnly(todayDateOnly()).getTime() - parseDateOnly(lastPresence).getTime()) / 86_400_000)
        : null;
      const needsAttention =
        consecutiveAbsences >= 2 ||
        (sampleTotal >= 3 && frequency !== null && frequency < 50) ||
        (daysWithoutPresence !== null && daysWithoutPresence >= 21 && sampleTotal >= 2) ||
        overdueAction !== null;

      if (!needsAttention) return null;

      const priority: ChurchAttentionItem["priority"] =
        overdueAction || consecutiveAbsences >= 3 || (frequency !== null && frequency < 35 && sampleTotal >= 3)
          ? "alta"
          : consecutiveAbsences >= 2 || (frequency !== null && frequency < 50)
            ? "media"
            : "baixa";

      const reason = overdueAction
        ? "Próxima ação vencida"
        : consecutiveAbsences >= 2
          ? `${consecutiveAbsences} ausências consecutivas`
          : frequency !== null
            ? `Frequência de ${frequency}% na amostra`
            : "Sem presença recente";

      return {
        member,
        caregiverName: member.caregiverId ? input.caregiversById.get(member.caregiverId) ?? null : null,
        lastPresence,
        sampleTotal,
        presentTotal,
        absentTotal,
        justifiedTotal,
        consecutiveAbsences,
        frequency,
        priority,
        reason,
        latestFollowup,
        overdueAction,
      };
    });

  return items
    .filter((item): item is ChurchAttentionItem => item !== null)
    .sort((a, b) => {
      const priorityWeight = { alta: 0, media: 1, baixa: 2 };
      return priorityWeight[a.priority] - priorityWeight[b.priority] || b.consecutiveAbsences - a.consecutiveAbsences || a.member.name.localeCompare(b.member.name);
    })
    .slice(0, 6);
}

export async function buildChurchProfileDashboard(input: {
  scope: DataScope;
  period: ChurchPeriod;
  referenceDate: string;
  meetingTypeId?: string;
  members: Member[];
  caregivers: Array<{ id: string; name: string }>;
  followups: Followup[];
}): Promise<ChurchProfileDashboard> {
  const range = resolvePeriodRange(input.period, input.referenceDate);
  const previousRange = resolvePreviousRange(input.period, range);
  const sampleStart = addDays(range.end, -30);

  const [memberships, meetingTypes, occurrences] = await Promise.all([
    listChurchMemberships(input.scope),
    listChurchMeetingTypes(input.scope),
    listChurchOccurrences(input.scope),
  ]);

  const closedOccurrences = occurrences.filter(
    (occurrence) =>
      occurrence.status === "completed" &&
      Boolean(occurrence.attendanceClosedAt) &&
      isDateBetween(occurrence.occursOn, range.start, range.end) &&
      (!input.meetingTypeId || occurrence.meetingTypeId === input.meetingTypeId),
  );
  const previousClosedOccurrences = occurrences.filter(
    (occurrence) =>
      occurrence.status === "completed" &&
      Boolean(occurrence.attendanceClosedAt) &&
      isDateBetween(occurrence.occursOn, previousRange.start, previousRange.end) &&
      (!input.meetingTypeId || occurrence.meetingTypeId === input.meetingTypeId),
  );
  const sampleOccurrences = occurrences.filter(
    (occurrence) =>
      occurrence.status === "completed" &&
      Boolean(occurrence.attendanceClosedAt) &&
      isDateBetween(occurrence.occursOn, sampleStart, range.end) &&
      (!input.meetingTypeId || occurrence.meetingTypeId === input.meetingTypeId),
  );
  const pendingOccurrences = occurrences.filter(
    (occurrence) =>
      occurrence.status !== "cancelled" &&
      !occurrence.attendanceClosedAt &&
      occurrence.occursOn <= range.end &&
      (!input.meetingTypeId || occurrence.meetingTypeId === input.meetingTypeId),
  );

  const [periodPairs, previousPairs, samplePairs] = await Promise.all([
    loadAttendanceForOccurrences(closedOccurrences, input.scope),
    loadAttendanceForOccurrences(previousClosedOccurrences, input.scope),
    loadAttendanceForOccurrences(sampleOccurrences, input.scope),
  ]);

  const currentSummary = summarizeAttendance(periodPairs, memberships, input.meetingTypeId);
  const previousSummary = summarizeAttendance(previousPairs, memberships, input.meetingTypeId);
  const activeMemberships = memberships.filter((membership) => {
    if (membership.status !== "active") return false;
    if (membership.startedAt && membership.startedAt > range.end) return false;
    if (membership.endedAt && membership.endedAt < range.end) return false;
    return true;
  }).length;
  const caregiversById = new Map(input.caregivers.map((caregiver) => [caregiver.id, caregiver.name]));
  const attention = buildAttentionList({
    pairs: samplePairs,
    memberships,
    members: input.members,
    caregiversById,
    followups: input.followups,
    meetingTypeId: input.meetingTypeId,
  });
  const overdueContacts = countPeopleWithOverdueNextAction(input.followups);
  const inCareCases = input.members.filter((member) => member.status === "in_progress").length;

  return {
    range,
    previousRange,
    activeMemberships,
    closedOccurrences,
    pendingOccurrences,
    meetingTypes,
    presentPeople: comparison(currentSummary.presentPeople, previousClosedOccurrences.length > 0 ? previousSummary.presentPeople : null),
    averageFrequency: comparison(currentSummary.averageFrequency ?? 0, previousSummary.averageFrequency),
    attendanceBase: {
      present: currentSummary.present,
      eligible: currentSummary.eligible,
      absent: currentSummary.absent,
      justified: currentSummary.justified,
    },
    trend: buildTrend(periodPairs, memberships, input.period, range, input.meetingTypeId),
    attention,
    inCareCases,
    overdueContacts,
  };
}
