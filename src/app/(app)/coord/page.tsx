export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { requireServerAuthSession } from "@/server/auth/session";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import {
  listCaregivers,
  listFollowups,
  listMembers,
  listSeeds,
  listTenants,
} from "@/server/repositories/mvp-repository";
import {
  listChurchAttendance,
  listChurchMeetingTypes,
  listChurchMemberships,
  listChurchOccurrences,
} from "@/server/repositories/church-repository";
import { getPeopleDashboardSnapshot } from "@/server/domain/people-dashboard";
import {
  addDays,
  buildRecentDayRange,
  dateOnlyInDashboardTimezone,
  parseDateOnly,
  toDateOnly,
  todayDateOnly,
} from "@/server/domain/dashboard-date";
import type {
  ChurchAttendanceRecord,
  ChurchMeetingOccurrence,
  ChurchMeetingType,
  ChurchMembership,
  DataScope,
  Followup,
  Member,
  PeopleDashboardView,
  SeedOriginChannel,
} from "@/server/domain/mvp";
import { summarizeAcquisition } from "@/server/domain/acquisition";
import { SEED_ORIGIN_CHANNELS, SEED_ORIGIN_CHANNEL_LABELS, isSeedOriginChannel } from "@/lib/seed-origin";
import { filterTenantIdsByRecorte } from "@/lib/listing-filters";
import { Avatar, Button, Card, StatusDot } from "@/ui/v2-components/ui";
import { DashboardMap } from "@/ui/mvp/dashboard-map";
import { WeeklySchedulePanel } from "@/ui/mvp/weekly-schedule-panel";
import { KpiCard } from "@/ui/mvp/kpi-card";
import { CoordAcquisitionSection } from "@/ui/mvp/coord-acquisition-section";
import {
  buildMemberJourneyDistribution,
  buildOverdueNextActionByMember,
  countOperationalAlerts,
  countPeopleWithOverdueNextAction,
  mapMemberStatusToVisualStatus,
} from "@/ui/mvp/dashboard-status-utils";
import {
  IconBell,
  IconCalendar,
  IconCar,
  IconCheck,
  IconChart,
  IconChurch,
  IconDoc,
  IconFilter,
  IconHeart,
  IconHome,
  IconHourglass,
  IconMessage,
  IconUsers,
} from "@/ui/v2-components/icons";

// Id impossivel: usado para montar um DataScope que nao casa com nenhuma
// localidade, ja que tenantIds vazio e interpretado como "sem filtro".
const SCOPE_SEM_LOCALIDADE = "00000000-0000-0000-0000-000000000000";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ChurchPeriod = "day" | "week" | "month";

type PeriodRange = {
  start: string;
  end: string;
  label: string;
};

type ChurchMetricComparison = {
  value: number;
  previous: number | null;
  delta: number | null;
};

type ChurchAttentionItem = {
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

type ChurchProfileDashboard = {
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

function VisitChart({ data }: { data: Array<{ dia: string; n: number }> }) {
  const max = Math.max(...data.map((item) => item.n), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, paddingTop: 8 }}>
      {data.map((item, index) => {
        const height = `${(item.n / max) * 100}%`;
        const isLast = index === data.length - 1;

        return (
          <div key={item.dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", position: "relative" }}>
              <div
                style={{
                  width: "100%",
                  height,
                  minHeight: item.n > 0 ? 8 : 2,
                  borderRadius: 6,
                  background: isLast
                    ? "linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%)"
                    : "linear-gradient(180deg, #BFDBFE 0%, #93C5FD 100%)",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  top: -22,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {item.n}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isLast ? "var(--accent)" : "var(--text-3)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {item.dia}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatusDonut({
  data,
  total,
  size = 140,
}: {
  data: Array<{ key: string; label: string; count: number }>;
  total: number;
  size?: number;
}) {
  const stroke = 20;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const colors: Record<string, string> = {
    novo: "#EA580C",
    acompanhamento: "#2563EB",
    concluido: "#16A34A",
    inativo: "#64748B",
  };
  const segments = data.reduce<Array<{ item: (typeof data)[number]; length: number; offset: number }>>((acc, item) => {
    const offset = acc.reduce((sum, segment) => sum + segment.length, 0);
    const length = total > 0 ? (item.count / total) * circumference : 0;
    return [...acc, { item, length, offset }];
  }, []);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        {segments.map(({ item, length, offset }) => (
            <circle
              key={item.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors[item.key] ?? "#94A3B8"}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {total}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-3)",
            marginTop: 4,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          membros
        </div>
      </div>
    </div>
  );
}

interface CaregiverPerformance {
  id: string;
  name: string;
  casos: number;
  capacidade: "alta" | "normal" | "baixa";
}

function CapacityRow({ caregiver }: { caregiver: CaregiverPerformance }) {
  const totalCapacity = 5;
  const filled = Math.min(caregiver.casos, totalCapacity);
  const colorByCapacity = {
    alta: "#E11D48",
    normal: "#2563EB",
    baixa: "#16A34A",
  }[caregiver.capacidade];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Avatar name={caregiver.name} size={36} ring />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {caregiver.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          {Array.from({ length: totalCapacity }).map((_, index) => (
            <div
              key={`${caregiver.id}-${index}`}
              style={{
                width: 14,
                height: 6,
                borderRadius: 2,
                background: index < filled ? colorByCapacity : "var(--border)",
              }}
            />
          ))}
          <span style={{ fontSize: 11.5, color: "var(--text-3)", marginLeft: 6 }}>
            {caregiver.casos} / {totalCapacity} casos
          </span>
        </div>
      </div>
    </div>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateLabel(value: string) {
  return parseDateOnly(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatShortDateLabel(value: string) {
  return parseDateOnly(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

function resolvePeriodRange(period: ChurchPeriod, referenceDate: string): PeriodRange {
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

function isDateBetween(value: string, start: string, end: string) {
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

function formatComparison(item: ChurchMetricComparison, suffix = "") {
  if (item.previous === null || item.delta === null) return "Sem base anterior";
  const sign = item.delta > 0 ? "+" : "";
  return `${sign}${item.delta}${suffix} vs. periodo anterior`;
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
  // Mesma regra do KPI "Pessoas com acao vencida": vale so a proxima acao mais
  // recente da pessoa, nao qualquer followup antigo com nextActionAt no passado.
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
        ? "Proxima acao vencida"
        : consecutiveAbsences >= 2
          ? `${consecutiveAbsences} ausencias consecutivas`
          : frequency !== null
            ? `Frequencia de ${frequency}% na amostra`
            : "Sem presenca recente";

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

async function buildChurchProfileDashboard(input: {
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

function ChurchTrendChart({ data }: { data: ChurchProfileDashboard["trend"] }) {
  const max = Math.max(...data.map((item) => item.eligible), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, minHeight: 140, paddingTop: 16 }}>
      {data.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-3)", fontSize: 13 }}>Sem chamada fechada no periodo.</p>
      ) : (
        data.map((item) => (
          <div key={item.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 42 }}>
            <div style={{ height: 110, display: "flex", alignItems: "flex-end", position: "relative", borderBottom: "1px solid var(--border)" }}>
              <div
                style={{
                  width: "100%",
                  height: `${(item.eligible / max) * 100}%`,
                  minHeight: item.eligible > 0 ? 12 : 2,
                  borderRadius: 6,
                  background: "var(--surface-2)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "auto 0 0",
                    height: item.eligible > 0 ? `${(item.present / item.eligible) * 100}%` : "0%",
                    background: "linear-gradient(180deg, #86EFAC 0%, #16A34A 100%)",
                  }}
                />
              </div>
              <span style={{ position: "absolute", top: -14, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "var(--text)", fontWeight: 700 }}>
                {item.rate === null ? "-" : `${item.rate}%`}
              </span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textAlign: "center" }}>{item.label}</span>
          </div>
        ))
      )}
    </div>
  );
}

function priorityColor(priority: ChurchAttentionItem["priority"]) {
  if (priority === "alta") return "#E11D48";
  if (priority === "media") return "#EA580C";
  return "#2563EB";
}

type DashSegment = "aquisicao" | "cuidado" | "igreja" | "equipe" | "atividade";

/** Cada segmento responde a UMA pergunta; nenhuma metrica aparece em dois. */
const DASH_SEGMENTS: Array<{ key: DashSegment; label: string; question: string }> = [
  { key: "aquisicao", label: "Aquisicao", question: "De onde as pessoas estao vindo, por qual canal e quem as cadastrou." },
  { key: "cuidado", label: "Cuidado", question: "Quem esta sendo cuidado, em que etapa da jornada e o que esta parado." },
  { key: "igreja", label: "Igreja", question: "Quem esta reunindo, com que frequencia e quem parou de aparecer." },
  { key: "equipe", label: "Equipe", question: "Quem cuida de quem, com que carga e quem esta sem movimento." },
  { key: "atividade", label: "Atividade", question: "O que foi feito no periodo: acoes, visitas, saidas e TCI." },
];

/** As abas antigas continuam valendo como atalho para o segmento equivalente. */
const LEGACY_TAB_TO_SEGMENT: Record<string, DashSegment> = {
  igreja: "igreja",
  tci: "atividade",
  cuidados: "cuidado",
  cuidadores: "equipe",
  acoes: "atividade",
};

function resolveSegment(value: string | undefined): DashSegment {
  if (value && DASH_SEGMENTS.some((segment) => segment.key === value)) return value as DashSegment;
  if (value && LEGACY_TAB_TO_SEGMENT[value]) return LEGACY_TAB_TO_SEGMENT[value];
  return "aquisicao";
}

/** Respiro lateral unico: 16px no celular, ate 32px no desktop. */
const PAGE_GUTTER = "clamp(16px, 4vw, 32px)";

const fieldLabelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-3)",
  minWidth: 0,
};

const fieldControlStyle: React.CSSProperties = {
  height: 38,
  width: "100%",
  minWidth: 0,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  padding: "0 10px",
  fontWeight: 700,
  fontFamily: "inherit",
  fontSize: 13,
};

export default async function CoordDashboardPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const accessibleScope: DataScope = { tenantIds: accessibleTenantIds };
  // --- Recorte global ------------------------------------------------------
  // Um unico conjunto de parametros vale para a pagina inteira. Os nomes antigos
  // (churchPeriod/peoplePeriod, churchDate/peopleDate, churchMeetingTypeId/
  // peopleMeetingTypeId, peopleState/peopleCity/peopleTenantId) seguem sendo
  // lidos como fallback para que URLs salvas antes da unificacao continuem
  // funcionando.
  const readParam = (...names: string[]) => {
    for (const name of names) {
      const value = firstValue(resolvedSearchParams[name]);
      if (value) return value;
    }
    return undefined;
  };

  const activeSegment = resolveSegment(readParam("seg", "tab"));
  const rawPeriod = readParam("period", "peoplePeriod", "churchPeriod");
  const period: ChurchPeriod = rawPeriod === "day" || rawPeriod === "month" ? rawPeriod : "week";
  const referenceDate = readParam("date", "peopleDate", "churchDate") ?? todayDateOnly();
  const selectedMeetingTypeId = readParam("meetingTypeId", "peopleMeetingTypeId", "churchMeetingTypeId") ?? "";
  const rawOrigin = readParam("origin");
  const selectedOrigin: SeedOriginChannel | null = isSeedOriginChannel(rawOrigin) ? rawOrigin : null;
  const reportFormat = readParam("format", "peopleFormat") === "pdf" ? "pdf" : "csv";
  // A lente do bloco de pessoas deixou de ser um filtro proprio: o segmento decide.
  const peopleView: PeopleDashboardView = activeSegment === "igreja" ? "church" : "contacts";

  // Tudo carrega pelo escopo acessivel -- o mesmo universo que os seletores da
  // barra de recorte oferecem e que getPeopleDashboardSnapshot ja usa. E o que
  // listAccessibleTenantIds garante: apenas as localidades em que o usuario tem
  // vinculo (listUserMemberships), nunca a base inteira.
  const [members, caregivers, followups, seeds, accessibleTenants] = await Promise.all([
    listMembers(accessibleScope),
    listCaregivers(accessibleScope),
    listFollowups(accessibleScope),
    listSeeds(accessibleScope),
    listTenants(accessibleScope),
  ]);
  const availableStates = Array.from(new Set(accessibleTenants.map((tenant) => tenant.state).filter(Boolean))).sort();
  const defaultState = availableStates.includes(session.membership.tenantState)
    ? session.membership.tenantState
    : availableStates[0] ?? session.membership.tenantState;
  const selectedState = readParam("state", "peopleState") ?? defaultState;
  const stateCities = Array.from(new Set(accessibleTenants.filter((tenant) => tenant.state === selectedState).map((tenant) => tenant.city).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const selectedCity = readParam("city", "peopleCity") ?? "";
  const cityTenants = accessibleTenants.filter((tenant) => tenant.state === selectedState && (!selectedCity || tenant.city === selectedCity));
  const selectedTenantId = readParam("tenantId", "peopleTenantId") ?? "";

  // Localidades acessiveis que sobrevivem ao recorte: e por elas que o recorte
  // passa a valer tambem fora do bloco de Pessoas. Precisa sair de
  // accessibleTenants (a mesma fonte dos seletores acima), senao escolher uma
  // localidade acessivel fora da sessao zeraria a pagina inteira.
  const recorteTenantIds = filterTenantIdsByRecorte(accessibleTenants, {
    state: selectedState,
    city: selectedCity,
    tenantId: selectedTenantId,
  });
  const recorteTenantIdSet = new Set(recorteTenantIds);
  const inRecorte = (tenantId: string) => recorteTenantIdSet.has(tenantId);
  // tenantIds vazio significa "sem filtro" nos repositorios, entao um recorte que
  // nao casa com nenhuma localidade acessivel precisa de um escopo que nao casa
  // com nada -- caso contrario a Igreja mostraria a base inteira enquanto o
  // restante da pagina, filtrado em memoria por inRecorte, mostra zero.
  const recorteScope: DataScope =
    recorteTenantIds.length > 0 ? { tenantIds: recorteTenantIds } : { tenantIds: [SCOPE_SEM_LOCALIDADE] };

  const scopedMembers = members.filter((member) => inRecorte(member.tenantId));
  const originSeeds = selectedOrigin
    ? seeds.filter((seed) => (seed.originChannel ?? "other") === selectedOrigin)
    : seeds;
  const scopedSeeds = originSeeds.filter((seed) => inRecorte(seed.tenantId));
  const scopedMemberIds = new Set(scopedMembers.map((member) => member.id));
  const scopedFollowups = followups.filter((followup) =>
    followup.memberId ? scopedMemberIds.has(followup.memberId) : inRecorte(followup.tenantId),
  );

  const peopleSnapshot = await getPeopleDashboardSnapshot(
    {
      view: peopleView,
      period,
      referenceDate,
      state: selectedState,
      city: selectedCity || null,
      tenantId: selectedTenantId || null,
      meetingTypeId: selectedMeetingTypeId || null,
    },
    accessibleScope,
  );
  const churchProfile = await buildChurchProfileDashboard({
    scope: recorteScope,
    period,
    referenceDate,
    meetingTypeId: selectedMeetingTypeId || undefined,
    members: scopedMembers,
    caregivers,
    followups: scopedFollowups,
  });
  const selectedChurchMeetingType = selectedMeetingTypeId
    ? churchProfile.meetingTypes.find((item) => item.id === selectedMeetingTypeId)
    : null;
  const peopleReportParams = new URLSearchParams();
  peopleReportParams.set("format", reportFormat);
  peopleReportParams.set("period", period);
  peopleReportParams.set("referenceDate", referenceDate);
  peopleReportParams.set("state", selectedState);
  if (selectedCity) peopleReportParams.set("city", selectedCity);
  if (selectedTenantId) peopleReportParams.set("tenantId", selectedTenantId);
  if (peopleView === "church" && selectedMeetingTypeId) {
    peopleReportParams.set("meetingTypeId", selectedMeetingTypeId);
  }
  const peopleReportHref = `/api/reports/people/${peopleView === "contacts" ? "contacts" : "church-attendance"}?${peopleReportParams.toString()}`;

  const operationalAlerts = countOperationalAlerts(scopedMembers, scopedSeeds);
  const memberJourney = buildMemberJourneyDistribution(scopedMembers);

  const total = scopedMembers.length + operationalAlerts.totalOpenContacts;
  const activeMembers = scopedMembers.filter((member) => member.status === "in_progress").length;
  const completedMembers = scopedMembers.filter(
    (member) => member.status === "consolidated" || member.status === "inactive"
  ).length;

  const recentDays = buildRecentDayRange(7);

  const newContactsThisWeek = scopedSeeds.filter((seed) => {
    const createdOn = dateOnlyInDashboardTimezone(seed.createdAt);
    return !!createdOn && createdOn >= recentDays[0];
  }).length;

  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const visitsData = recentDays.map((day) => {
    const label = weekdayLabels[parseDateOnly(day).getUTCDay()];
    const count = scopedFollowups.filter((followup) => dateOnlyInDashboardTimezone(followup.occurredAt) === day).length;
    return { dia: label, n: count };
  });

  // --- Aquisicao: contatos criados dentro do recorte global.
  const globalRange = resolvePeriodRange(period, referenceDate);
  const acquisitionSeeds = scopedSeeds.filter((seed) => {
    const createdOn = dateOnlyInDashboardTimezone(seed.createdAt);
    return !!createdOn && isDateBetween(createdOn, globalRange.start, globalRange.end);
  });
  const acquisition = summarizeAcquisition(acquisitionSeeds);
  // Acoes dentro do recorte de periodo: o segmento Atividade responde "o que foi
  // feito no periodo", entao seus cartoes nao podem contar a base historica.
  const periodFollowups = scopedFollowups.filter((followup) => {
    const occurredOn = dateOnlyInDashboardTimezone(followup.occurredAt);
    return !!occurredOn && isDateBetween(occurredOn, globalRange.start, globalRange.end);
  });
  // Quem cadastrou so tem nome quando o usuario da localidade tambem e cuidador;
  // o resto cai no rotulo honesto do proprio modulo de aquisicao.
  const registrarNames = Object.fromEntries(
    caregivers
      .filter((caregiver) => caregiver.tenantUserId)
      .map((caregiver) => [caregiver.tenantUserId as string, caregiver.name]),
  );

  const scopedCaregivers = caregivers.filter((caregiver) => inRecorte(caregiver.tenantId));
  const caregiversTotal = scopedCaregivers.length;
  const caregiversActive = scopedCaregivers.filter((caregiver) => caregiver.active).length;
  const caregiverPerformance = scopedCaregivers.map((caregiver) => {
    const casesCount = scopedMembers.filter((member) => member.caregiverId === caregiver.id).length;
    const lastAction = scopedFollowups
      .filter((f) => {
        const member = scopedMembers.find((m) => m.id === f.memberId);
        return member?.caregiverId === caregiver.id;
      })
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
    const capacity: "alta" | "normal" | "baixa" = casesCount >= 4 ? "alta" : casesCount >= 2 ? "normal" : "baixa";
    return {
      id: caregiver.id,
      name: caregiver.name,
      casos: casesCount,
      capacidade: capacity,
      lastActionAt: lastAction?.occurredAt ?? null,
      active: caregiver.active,
    };
  }).sort((a, b) => {
    if (a.lastActionAt && b.lastActionAt) return b.lastActionAt.localeCompare(a.lastActionAt);
    if (a.lastActionAt) return -1;
    if (b.lastActionAt) return 1;
    return a.name.localeCompare(b.name);
  });
  const overloadedCaregivers = caregiverPerformance.filter((caregiver) => caregiver.casos >= 4).length;
  const stalledThreshold = addDays(todayDateOnly(), -14);
  const stalledCaregivers = caregiverPerformance.filter((caregiver) => {
    if (!caregiver.active) return false;
    if (!caregiver.lastActionAt) return true;
    return (dateOnlyInDashboardTimezone(caregiver.lastActionAt) ?? "") < stalledThreshold;
  }).length;
  const averageCaseload = caregiversActive > 0
    ? Math.round((caregiverPerformance.filter((caregiver) => caregiver.active).reduce((sum, caregiver) => sum + caregiver.casos, 0) / caregiversActive) * 10) / 10
    : 0;

  const mapItems = [
    ...scopedMembers.map((member) => {
      const caregiver = member.caregiverId
        ? caregivers.find((item) => item.id === member.caregiverId)?.name ?? null
        : null;

      return {
        id: member.id,
        name: member.name,
        city: member.city || "",
        address: member.address || "",
        status: mapMemberStatusToVisualStatus(member.status),
        caregiver,
        lastContact: member.lastContact ?? null,
        latitude: member.latitude,
        longitude: member.longitude,
        age: member.age,
        birthDate: member.birthDate,
      };
    }),
    ...scopedSeeds.map((seed) => {
      const caregiver = seed.caregiverId
        ? caregivers.find((item) => item.id === seed.caregiverId)?.name ?? null
        : null;

      return {
        id: seed.id,
        name: seed.referenceName,
        city: seed.city || "",
        address: seed.address || "",
        status: "aguardando",
        caregiver,
        lastContact: "Novo contato",
        latitude: seed.latitude,
        longitude: seed.longitude,
        age: seed.age,
        birthDate: null,
      };
    }),
  ];

  const activeSegmentDef = DASH_SEGMENTS.find((segment) => segment.key === activeSegment) ?? DASH_SEGMENTS[0];
  const scopeLabel = [
    globalRange.label,
    selectedState,
    selectedCity || null,
    selectedTenantId ? accessibleTenants.find((tenant) => tenant.id === selectedTenantId)?.name ?? null : null,
    selectedOrigin ? SEED_ORIGIN_CHANNEL_LABELS[selectedOrigin] : null,
  ].filter(Boolean).join(" \u00b7 ");

  /** Recorte preservado na troca de segmento — vale para TODOS os segmentos. */
  function segmentHref(segment: DashSegment) {
    const params = new URLSearchParams();
    params.set("seg", segment);
    if (period !== "week") params.set("period", period);
    if (referenceDate !== todayDateOnly()) params.set("date", referenceDate);
    if (selectedState) params.set("state", selectedState);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedTenantId) params.set("tenantId", selectedTenantId);
    if (selectedMeetingTypeId) params.set("meetingTypeId", selectedMeetingTypeId);
    if (selectedOrigin) params.set("origin", selectedOrigin);
    if (reportFormat !== "csv") params.set("format", reportFormat);
    return `/coord?${params.toString()}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          padding: `24px ${PAGE_GUTTER} 16px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--accent)" }}>
            Lideranca
          </p>
          <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text)" }}>
            Painel da Coordenacao
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-3)" }}>
            Localidade: {session.membership.tenantName} ({session.membership.tenantCity} - {session.membership.tenantState})
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link
            href={`/coord/relatorios/saidas?date=${todayDateOnly()}&tenantId=${session.membership.tenantId}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 42, padding: "0 16px", borderRadius: 12, background: "var(--accent)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 800 }}
          >
            <IconDoc size={17} />
            Gerar relatorio
          </Link>
          <Avatar name={`${session.user.firstName} ${session.user.lastName}`} size={46} ring />
        </div>
      </header>

      {operationalAlerts.urgentMembers > 0 && (
        <div style={{ margin: `20px ${PAGE_GUTTER} 0`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "14px 20px", borderRadius: 14, background: "var(--status-urgente-bg)", border: "1px solid #FECACA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEE2E2", color: "#E11D48", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconBell size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#991B1B" }}>
                {operationalAlerts.urgentMembers} caso{operationalAlerts.urgentMembers > 1 ? "s" : ""} urgente{operationalAlerts.urgentMembers > 1 ? "s" : ""} pendente{operationalAlerts.urgentMembers > 1 ? "s" : ""} de resposta
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#7F1D1D" }}>Verifique a timeline de acompanhamentos para delegar a um cuidador de plantao.</p>
            </div>
          </div>
          <Link href="/coord/acompanhamentos" style={{ padding: "8px 16px", borderRadius: 10, background: "#E11D48", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            Verificar
          </Link>
        </div>
      )}

      {/* Barra de recorte global: um filtro so, valido para a pagina inteira. */}
      <section style={{ padding: `20px ${PAGE_GUTTER} 0` }}>
        <Card padding={16}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)" }}>
              Recorte aplicado a pagina inteira
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-3)" }}>{scopeLabel}</p>
          </div>
          <form action="/coord" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, alignItems: "end" }}>
            <input type="hidden" name="seg" value={activeSegment} />
            <label style={fieldLabelStyle}>
              Periodo
              <select name="period" defaultValue={period} style={fieldControlStyle}>
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </label>
            <label style={fieldLabelStyle}>
              Data
              <input type="date" name="date" defaultValue={referenceDate} style={fieldControlStyle} />
            </label>
            <label style={fieldLabelStyle}>
              Estado
              <select name="state" defaultValue={selectedState} style={fieldControlStyle}>
                {availableStates.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </label>
            <label style={fieldLabelStyle}>
              Cidade
              <select name="city" defaultValue={selectedCity} style={fieldControlStyle}>
                <option value="">Todas</option>
                {stateCities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </label>
            <label style={fieldLabelStyle}>
              Localidade
              <select name="tenantId" defaultValue={selectedTenantId} style={fieldControlStyle}>
                <option value="">Todas</option>
                {cityTenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
              </select>
            </label>
            <label style={fieldLabelStyle}>
              Origem
              <select name="origin" defaultValue={selectedOrigin ?? ""} style={fieldControlStyle}>
                <option value="">Todas</option>
                {SEED_ORIGIN_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>{SEED_ORIGIN_CHANNEL_LABELS[channel]}</option>
                ))}
              </select>
            </label>
            {activeSegment === "igreja" ? (
              <label style={fieldLabelStyle}>
                Tipo de reuniao
                <select name="meetingTypeId" defaultValue={selectedMeetingTypeId} style={fieldControlStyle}>
                  <option value="">Todos os tipos</option>
                  {churchProfile.meetingTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
              </label>
            ) : (
              // O seletor so faz sentido na Igreja, mas o formulario envia apenas os
              // campos presentes: sem este oculto, "Aplicar" descartaria o tipo de
              // reuniao que segmentHref preserva na troca de segmento.
              selectedMeetingTypeId ? <input type="hidden" name="meetingTypeId" value={selectedMeetingTypeId} /> : null
            )}
            <label style={fieldLabelStyle}>
              Relatorio
              <select name="format" defaultValue={reportFormat} style={fieldControlStyle}>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Button type="submit" variant="primary" size="md" icon={<IconFilter />}>Aplicar</Button>
              <Link href={peopleReportHref} style={{ textDecoration: "none" }}>
                <Button type="button" variant="secondary" size="md" icon={<IconDoc />}>Exportar</Button>
              </Link>
            </div>
          </form>
          <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--text-3)" }}>
            A origem filtra contatos (Aquisicao, Cuidado e o mapa). Cartoes marcados como retrato de agora nao seguem o periodo.
          </p>
        </Card>
      </section>

      <nav style={{ padding: `16px ${PAGE_GUTTER} 0`, marginTop: 16, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", gap: 4, overflowX: "auto" }}>
        {DASH_SEGMENTS.map((segment) => {
          const isActive = activeSegment === segment.key;
          return (
            <Link
              key={segment.key}
              href={segmentHref(segment.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                borderRadius: "10px 10px 0 0",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                color: isActive ? "var(--accent)" : "var(--text-2)",
                background: isActive ? "var(--bg)" : "transparent",
                borderTop: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                borderLeft: isActive ? "1px solid var(--border)" : "1px solid transparent",
                borderRight: isActive ? "1px solid var(--border)" : "1px solid transparent",
                borderBottom: isActive ? "1px solid var(--bg)" : "none",
                marginBottom: isActive ? -1 : 0,
                whiteSpace: "nowrap",
              }}
            >
              {segment.label}
            </Link>
          );
        })}
      </nav>

      <main style={{ flex: 1, padding: `28px ${PAGE_GUTTER} 96px`, display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, width: "100%", margin: "0 auto" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>{activeSegmentDef.label}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-3)" }}>{activeSegmentDef.question}</p>
        </div>

        {activeSegment === "aquisicao" && (
          <CoordAcquisitionSection summary={acquisition} periodLabel={globalRange.label} registrarNames={registrarNames} />
        )}

        {activeSegment === "cuidado" && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
              <KpiCard icon={<IconUsers />} label="Total Acolhidos" value={total} sub={`+${newContactsThisWeek} nos ultimos 7 dias`} accent="#2D7FF9" bg="#E8F1FE" />
              <KpiCard icon={<IconHeart />} label="Sendo Cuidados" value={activeMembers} sub={`${total > 0 ? Math.round((activeMembers / total) * 100) : 0}% da base`} accent="#16A34A" bg="#DCFCE7" />
              <KpiCard icon={<IconCheck />} label="Concluidos" value={completedMembers} sub="Ciclos consolidados" accent="#7C3AED" bg="rgba(124,58,237,0.12)" />
              <KpiCard icon={<IconDoc />} label="Contatos na Triagem" value={operationalAlerts.totalOpenContacts} sub="Novos, contatados ou em espera" snapshot accent="#EA580C" bg="#FFEDD5" />
              <KpiCard icon={<IconHome />} label="Esperando Visita" value={operationalAlerts.waitingVisits} sub="Casas abertas aguardando visita" snapshot accent="#0891B2" bg="#ECFEFF" />
              <KpiCard icon={<IconHourglass />} label="Sem Cuidador" value={operationalAlerts.unassignedPeople} sub={`${operationalAlerts.membersWithoutCaregiver} membro(s) + ${operationalAlerts.contactsWithoutCaregiver} contato(s)`} snapshot accent="#EA580C" bg="#FFEDD5" />
              <KpiCard icon={<IconBell />} label="Casos Urgentes" value={operationalAlerts.urgentMembers} sub="Prioridade de resposta" snapshot accent="#E11D48" bg="#FFE4E6" />
              <KpiCard icon={<IconCalendar />} label="Pessoas com acao vencida" value={churchProfile.overdueContacts} sub="1 por pessoa, pela proxima acao mais recente" snapshot accent="#E11D48" bg="#FFE4E6" />
              <KpiCard icon={<IconChart />} label="Atualizados no periodo" value={peopleSnapshot.summary.updatedInPeriod ?? 0} sub="Baseado em updated_at" accent="#2563EB" bg="#DBEAFE" />
            </section>

            {peopleSnapshot.warnings.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {peopleSnapshot.warnings.map((warning) => (
                  <div key={warning} style={{ padding: "10px 12px", borderRadius: 10, background: "#FFF7ED", border: "1px solid #FED7AA", color: "#9A3412", fontSize: 12.5 }}>
                    {warning}
                  </div>
                ))}
              </div>
            )}

            <Card padding={20}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Distribuicao por jornada do membro</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
                <StatusDonut data={memberJourney} total={scopedMembers.length} />
                <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 8 }}>
                  {memberJourney.map((item) => {
                    const pct = scopedMembers.length > 0 ? Math.round((item.count / scopedMembers.length) * 100) : 0;
                    return (
                      <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <StatusDot status={item.key} size={8} />
                        <span style={{ flex: 1, fontSize: 12.5, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{item.count}</span>
                        <span style={{ fontSize: 11, color: "var(--text-3)", minWidth: 32, textAlign: "right" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              <Card padding={20}>
                <div style={{ marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Serie do periodo</h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>Cadastros distribuidos no periodo selecionado.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {peopleSnapshot.timeline.length > 0 ? peopleSnapshot.timeline.map((item) => (
                    <div key={item.key} style={{ display: "grid", gridTemplateColumns: "minmax(90px, 1fr) repeat(auto-fit, minmax(90px, 1fr))", gap: 8, fontSize: 12.5, alignItems: "center" }}>
                      <strong style={{ color: "var(--text)" }}>{item.label}</strong>
                      {Object.entries(item.values).map(([key, value]) => (
                        <span key={key} style={{ color: "var(--text-2)" }}>{key}: <strong style={{ color: "var(--text)" }}>{value}</strong></span>
                      ))}
                    </div>
                  )) : <p style={{ margin: 0, color: "var(--text-3)", fontSize: 13 }}>Nenhum dado no periodo.</p>}
                </div>
              </Card>

              <Card padding={20}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Cidades do estado</h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>Totais agrupados apenas para {peopleSnapshot.filters.state}.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {peopleSnapshot.cities.length > 0 ? peopleSnapshot.cities.map((city) => (
                    <div key={`${city.state}-${city.city}`} style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                        <strong style={{ color: "var(--text)" }}>{city.city}</strong>
                        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{city.state}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12.5, color: "var(--text-2)" }}>
                        {Object.entries(city.values).map(([key, value]) => (
                          <span key={key}>{key}: <strong style={{ color: "var(--text)" }}>{value}</strong></span>
                        ))}
                      </div>
                    </div>
                  )) : <p style={{ margin: 0, color: "var(--text-3)", fontSize: 13 }}>Nenhuma cidade com dados no recorte.</p>}
                </div>
              </Card>
            </div>

            <Card padding={0}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Lista nominal de contatos</h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>Status atual, origem e andamento recente.</p>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>{peopleSnapshot.people.length} registro(s)</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {peopleSnapshot.people.length > 0 ? peopleSnapshot.people.slice(0, 20).map((person) => (
                  <div key={String(person.id)} style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: 13.5, color: "var(--text)" }}>{String(person.name ?? "Sem nome")}</strong>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-3)" }}>
                          {String(person.city ?? "")}{person.state ? ` - ${String(person.state)}` : ""} · {String(person.tenantName ?? "Sem localidade")}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", flexShrink: 0 }}>
                        {String(person.currentStatus ?? "—")}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12.5, color: "var(--text-2)" }}>
                      <span>Origem: <strong style={{ color: "var(--text)" }}>{String(person.source ?? "—")}</strong></span>
                      <span>Cuidador: <strong style={{ color: "var(--text)" }}>{String(person.caregiver ?? "Sem cuidador")}</strong></span>
                      <span>Criado: <strong style={{ color: "var(--text)" }}>{formatDateTimeLabel(String(person.createdAt ?? ""))}</strong></span>
                      <span>Atualizado: <strong style={{ color: "var(--text)" }}>{formatDateTimeLabel(String(person.updatedAt ?? ""))}</strong></span>
                    </div>
                  </div>
                )) : <p style={{ margin: 0, padding: 18, color: "var(--text-3)", fontSize: 13 }}>Nenhum registro encontrado com esses filtros.</p>}
              </div>
            </Card>

            <DashboardMap items={mapItems} />
          </>
        )}

        {activeSegment === "igreja" && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
              <KpiCard icon={<IconChurch />} label="Membros da Igreja" value={churchProfile.activeMemberships} sub="Vinculos ativos" accent="#2563EB" bg="#DBEAFE" />
              <KpiCard icon={<IconUsers />} label="Pessoas que reuniram" value={churchProfile.presentPeople.value} sub={`${churchProfile.closedOccurrences.length} chamada(s) · ${formatComparison(churchProfile.presentPeople)}`} accent="#16A34A" bg="#DCFCE7" />
              <KpiCard icon={<IconChart />} label="Frequencia media" value={churchProfile.attendanceBase.eligible > 0 ? `${churchProfile.averageFrequency.value}%` : "—"} sub={churchProfile.attendanceBase.eligible > 0 ? `${churchProfile.attendanceBase.present} de ${churchProfile.attendanceBase.eligible}` : "Sem chamada fechada"} accent="#7C3AED" bg="rgba(124,58,237,0.12)" />
              <KpiCard icon={<IconHourglass />} label="Sem presenca" value={peopleSnapshot.summary.peopleWithoutPresence ?? 0} sub="Sem nenhuma presenca no periodo" accent="#EA580C" bg="#FFEDD5" />
              <KpiCard icon={<IconCheck />} label="Justificadas" value={peopleSnapshot.summary.justifiedAbsences ?? 0} sub="Mantidas no denominador" accent="#0891B2" bg="#ECFEFF" />
              <KpiCard icon={<IconCalendar />} label="Chamadas pendentes" value={churchProfile.pendingOccurrences.length} sub="Sem fechamento · nao entram na frequencia" accent="#E11D48" bg="#FFE4E6" />
              <KpiCard icon={<IconBell />} label="Para revisao" value={churchProfile.attention.length} sub="Sinais de frequencia e cuidado" accent="#EA580C" bg="#FFEDD5" />
            </section>

            {peopleSnapshot.warnings.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {peopleSnapshot.warnings.map((warning) => (
                  <div key={warning} style={{ padding: "10px 12px", borderRadius: 10, background: "#FFF7ED", border: "1px solid #FED7AA", color: "#9A3412", fontSize: 12.5 }}>
                    {warning}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              <Card padding={20}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 8, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Tendencia de participacao</h3>
                    <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>
                      Verde = presencas na base elegivel de chamadas fechadas · {selectedChurchMeetingType?.name ?? "Todos os tipos"}.
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>Aus: {churchProfile.attendanceBase.absent} · Just: {churchProfile.attendanceBase.justified}</span>
                </div>
                <ChurchTrendChart data={churchProfile.trend} />
              </Card>
              <Card padding={0}>
                <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Pessoas para revisao</h3>
                    <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>Fila baseada em ausencias, frequencia e acoes vencidas.</p>
                  </div>
                  <Link href="/coord/igreja" style={{ color: "var(--accent)", textDecoration: "none", fontSize: 12.5, fontWeight: 800 }}>Igreja</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {churchProfile.attention.length > 0 ? churchProfile.attention.map((item) => (
                    <div key={item.member.id} style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: priorityColor(item.priority), flexShrink: 0 }} />
                            <strong style={{ fontSize: 13.5, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.member.name}</strong>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-3)" }}>{item.caregiverName ?? "Sem cuidador"} · Ultima presenca: {item.lastPresence ? formatDateLabel(item.lastPresence) : "sem registro"}</p>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: priorityColor(item.priority), textTransform: "uppercase", flexShrink: 0 }}>{item.priority}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{item.reason}. {item.presentTotal} presenca(s) em {item.sampleTotal} chamada(s).</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link href={`/coord/membros/${item.member.id}/editar`} style={{ textDecoration: "none" }}><Button variant="secondary" size="sm" icon={<IconHeart />}>Designar</Button></Link>
                        <Link href="/coord/acompanhamentos" style={{ textDecoration: "none" }}><Button variant="secondary" size="sm" icon={<IconMessage />}>Iniciar contato</Button></Link>
                      </div>
                    </div>
                  )) : <p style={{ margin: 0, padding: 18, color: "var(--text-3)", fontSize: 13 }}>Nenhuma pessoa para revisao nesta amostra.</p>}
                </div>
              </Card>
            </div>

            <Card padding={0}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Lista nominal de frequencia</h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>Presencas, faltas, justificativas e ultima presenca.</p>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>{peopleSnapshot.people.length} registro(s)</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {peopleSnapshot.people.length > 0 ? peopleSnapshot.people.slice(0, 20).map((person) => (
                  <div key={String(person.id)} style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: 13.5, color: "var(--text)" }}>{String(person.name ?? "Sem nome")}</strong>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-3)" }}>
                          {String(person.city ?? "")}{person.state ? ` - ${String(person.state)}` : ""} · {String(person.tenantName ?? "Sem localidade")}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", flexShrink: 0 }}>
                        {String(person.status ?? "—")}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12.5, color: "var(--text-2)" }}>
                      <span>Presencas: <strong style={{ color: "var(--text)" }}>{String(person.presences ?? 0)}</strong></span>
                      <span>Faltas: <strong style={{ color: "var(--text)" }}>{String(person.absences ?? 0)}</strong></span>
                      <span>Justificadas: <strong style={{ color: "var(--text)" }}>{String(person.justified ?? 0)}</strong></span>
                      <span>Frequencia: <strong style={{ color: "var(--text)" }}>{person.frequency !== null && person.frequency !== undefined ? `${String(person.frequency)}%` : "—"}</strong></span>
                      <span>Ultima presenca: <strong style={{ color: "var(--text)" }}>{String(person.lastPresence ?? "—")}</strong></span>
                    </div>
                  </div>
                )) : <p style={{ margin: 0, padding: 18, color: "var(--text-3)", fontSize: 13 }}>Nenhum registro encontrado com esses filtros.</p>}
              </div>
            </Card>
          </>
        )}

        {activeSegment === "equipe" && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
              <KpiCard icon={<IconUsers />} label="Total de Cuidadores" value={caregiversTotal} sub={`${caregiversActive} ativos`} accent="#2563EB" bg="#DBEAFE" />
              <KpiCard icon={<IconChart />} label="Carga media" value={averageCaseload} sub="Casos por cuidador ativo" snapshot accent="#7C3AED" bg="rgba(124,58,237,0.12)" />
              <KpiCard icon={<IconHourglass />} label="Sobrecarregados" value={overloadedCaregivers} sub="4 casos ou mais" snapshot accent="#E11D48" bg="#FFE4E6" />
              <KpiCard icon={<IconBell />} label="Sem movimento" value={stalledCaregivers} sub="Ativos sem acao ha 14 dias ou mais" snapshot accent="#EA580C" bg="#FFEDD5" />
            </section>
            <Card padding={0}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Equipe de cuidadores</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-3)" }}>{caregiversActive} ativos de {caregiversTotal} · Ordenado por ultima acao</p>
                </div>
                <Link href="/coord/cuidadores" style={{ color: "var(--accent)", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>Gerenciar</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {caregiverPerformance.length > 0 ? caregiverPerformance.map((caregiver) => (
                  <div key={caregiver.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                    <Avatar name={caregiver.name} size={38} ring />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{caregiver.name}</div>
                        {!caregiver.active && <span style={{ fontSize: 10, fontWeight: 800, background: "#FEE2E2", color: "#E11D48", padding: "1px 6px", borderRadius: 4 }}>Inativo</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        {Array.from({ length: 5 }).map((_, index) => {
                          const colorByCapacity = { alta: "#E11D48", normal: "#2563EB", baixa: "#16A34A" }[caregiver.capacidade];
                          return <div key={`${caregiver.id}-${index}`} style={{ width: 14, height: 6, borderRadius: 2, background: index < Math.min(caregiver.casos, 5) ? colorByCapacity : "var(--border)" }} />;
                        })}
                        <span style={{ fontSize: 11.5, color: "var(--text-3)", marginLeft: 6 }}>{caregiver.casos} casos</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>Ultima acao</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginTop: 2 }}>{caregiver.lastActionAt ? new Date(caregiver.lastActionAt).toLocaleDateString("pt-BR") : "Sem registro"}</div>
                    </div>
                  </div>
                )) : <p style={{ padding: 18, fontSize: 13, color: "var(--text-3)", margin: 0 }}>Nenhum cuidador cadastrado.</p>}
              </div>
            </Card>
          </>
        )}

        {activeSegment === "atividade" && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
              <KpiCard icon={<IconCalendar />} label="Total de Acoes" value={periodFollowups.length} sub={`Acompanhamentos registrados · ${globalRange.label}`} accent="#2D7FF9" bg="#E8F1FE" />
              <KpiCard icon={<IconCheck />} label="Acoes nos ultimos 7 dias" value={visitsData.reduce((sum, day) => sum + day.n, 0)} sub="Janela fixa de 7 dias" accent="#16A34A" bg="#DCFCE7" />
              <KpiCard icon={<IconHome />} label="Visitas registradas" value={periodFollowups.filter((followup) => followup.type === "visit").length} sub={`Acoes do tipo visita · ${globalRange.label}`} accent="#0891B2" bg="#ECFEFF" />
            </section>
            <Card padding={20}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Acoes nos ultimos 7 dias</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-3)" }}>Acompanhamentos registrados por dia</p>
              <VisitChart data={visitsData} />
            </Card>
            <Card padding={20}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Ultimas interacoes pastorais</h3>
                <Link href="/coord/acompanhamentos" style={{ color: "var(--accent)", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>Ver todos</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {scopedFollowups.slice(0, 10).map((item) => (
                  <div key={item.id} style={{ padding: 14, borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{item.member ?? "Sem membro"}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", flexShrink: 0 }}>
                        {item.type === "visit" ? "Visita" : item.type === "call" ? "Ligacao" : item.type === "message" ? "Mensagem" : item.type === "prayer" ? "Oracao" : "Outro"}
                      </span>
                    </div>
                    {item.notes && <p style={{ margin: "0 0 6px", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.4 }}>{item.notes}</p>}
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", fontSize: 11, color: "var(--text-3)" }}>
                      <span>Registrado em: {new Date(item.occurredAt).toLocaleDateString("pt-BR")}</span>
                      {item.nextActionAt && <span style={{ color: "var(--accent)", fontWeight: 600 }}>Prox: {new Date(item.nextActionAt).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                ))}
                {scopedFollowups.length === 0 && <p style={{ margin: 0, padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>Nenhum acompanhamento registrado ainda.</p>}
              </div>
              <div style={{ marginTop: 16 }}>
                <Link href="/coord/acompanhamentos"><Button variant="secondary" size="md" full icon={<IconCalendar />}>Novo Acompanhamento</Button></Link>
              </div>
            </Card>

            <WeeklySchedulePanel followups={scopedFollowups} />

            <Card padding={0}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Saidas e sessoes de TCI</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-3)" }}>Os dois modulos de atividade de campo ficam aqui.</p>
              </div>
              <div style={{ padding: "20px 18px", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/coord/saidas" style={{ textDecoration: "none" }}><Button variant="secondary" size="md" icon={<IconCar />}>Ir para Saidas</Button></Link>
                <Link href="/coord/tci" style={{ textDecoration: "none" }}><Button variant="primary" size="md" icon={<IconUsers />}>Ir para TCI</Button></Link>
              </div>
            </Card>
          </>
        )}

      </main>
    </div>
  );
}
