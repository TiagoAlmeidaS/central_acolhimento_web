export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { requireServerAuthSession } from "@/server/auth/session";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
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
import type {
  ChurchAttendanceRecord,
  ChurchMeetingOccurrence,
  ChurchMeetingType,
  ChurchMembership,
  DataScope,
  Followup,
  Member,
} from "@/server/domain/mvp";
import { Avatar, Button, Card, StatusDot } from "@/ui/v2-components/ui";
import { DashboardMap } from "@/ui/mvp/dashboard-map";
import { WeeklySchedulePanel } from "@/ui/mvp/weekly-schedule-panel";
import {
  buildMemberJourneyDistribution,
  countOperationalAlerts,
  mapMemberStatusToVisualStatus,
} from "@/ui/mvp/dashboard-status-utils";
import {
  IconBell,
  IconCalendar,
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

interface KpiCardProps {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  bg: string;
}

function KpiCard({ icon, label, value, sub, accent, bg }: KpiCardProps) {
  return (
    <Card padding={16} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", letterSpacing: "-0.01em" }}>
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: bg,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "var(--text)",
          letterSpacing: "-0.025em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sub ? <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{sub}</span> : null}
    </Card>
  );
}

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

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function parseDateOnly(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(`${todayDateOnly()}T00:00:00`) : parsed;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: string, amount: number) {
  const date = parseDateOnly(value);
  date.setDate(date.getDate() + amount);
  return toDateOnly(date);
}

function formatDateLabel(value: string) {
  return parseDateOnly(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatShortDateLabel(value: string) {
  return parseDateOnly(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
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
      const overdueAction: Followup | null =
        (followupsByMember.get(memberId) ?? [])
          .filter((followup) => followup.nextActionAt && new Date(followup.nextActionAt) < new Date())
          .sort((a, b) => (a.nextActionAt ?? "").localeCompare(b.nextActionAt ?? ""))[0] ?? null;

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
  const overdueContacts = input.followups.filter((followup) => followup.nextActionAt && new Date(followup.nextActionAt) < new Date()).length;
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

export default async function CoordDashboardPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const session = await requireServerAuthSession("coordinator");
  const scope = getDataScopeFromSession(session);
  const churchPeriod = (firstValue(resolvedSearchParams.churchPeriod) === "day" || firstValue(resolvedSearchParams.churchPeriod) === "month"
    ? firstValue(resolvedSearchParams.churchPeriod)
    : "week") as ChurchPeriod;
  const churchDate = firstValue(resolvedSearchParams.churchDate) ?? todayDateOnly();
  const churchMeetingTypeId = firstValue(resolvedSearchParams.churchMeetingTypeId) || undefined;

  const [members, caregivers, followups, seeds, tenants] = await Promise.all([
    listMembers(scope),
    listCaregivers(scope),
    listFollowups(scope),
    listSeeds(scope),
    listTenants(scope),
  ]);
  const churchProfile = await buildChurchProfileDashboard({
    scope,
    period: churchPeriod,
    referenceDate: churchDate,
    meetingTypeId: churchMeetingTypeId,
    members,
    caregivers,
    followups,
  });
  const selectedChurchMeetingType = churchMeetingTypeId
    ? churchProfile.meetingTypes.find((item) => item.id === churchMeetingTypeId)
    : null;

  const operationalAlerts = countOperationalAlerts(members, seeds);
  const memberJourney = buildMemberJourneyDistribution(members);

  const total = members.length + operationalAlerts.totalOpenContacts;
  const activeMembers = members.filter((member) => member.status === "in_progress").length;
  const completedMembers = members.filter(
    (member) => member.status === "consolidated" || member.status === "inactive"
  ).length;

  const newContactsThisWeek = seeds.filter((seed) => {
    if (!seed.createdAt) return false;
    const createdAt = new Date(seed.createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return createdAt >= oneWeekAgo;
  }).length;

  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const visitsData = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const label = weekdayLabels[date.getDay()];
    const count = followups.filter((followup) => {
      const followupDate = new Date(followup.occurredAt);
      return followupDate.toDateString() === date.toDateString();
    }).length;
    return { dia: label, n: count };
  });

  const caregiversTotal = caregivers.length;
  const caregiversActive = caregivers.filter((caregiver) => caregiver.active).length;
  const caregiverPerformance = caregivers.map((caregiver) => {
    const casesCount = members.filter((member) => member.caregiverId === caregiver.id).length;
    const lastAction = followups
      .filter((f) => {
        const member = members.find((m) => m.id === f.memberId);
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

  const mapItems = [
    ...members.map((member) => {
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
    ...seeds.map((seed) => {
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

  // Resolve active tab from search params
  type DashTab = "igreja" | "tci" | "cuidados" | "cuidadores" | "acoes";
  const rawTab = firstValue(resolvedSearchParams.tab);
  const activeTab: DashTab =
    rawTab === "tci" || rawTab === "cuidados" || rawTab === "cuidadores" || rawTab === "acoes"
      ? rawTab
      : "igreja";

  const tabs: Array<{ key: DashTab; label: string }> = [
    { key: "igreja", label: "Igreja" },
    { key: "tci", label: "TCI" },
    { key: "cuidados", label: "Cuidados" },
    { key: "cuidadores", label: "Cuidadores" },
    { key: "acoes", label: "Ultimas Acoes" },
  ];

  function tabHref(tab: DashTab) {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (tab === "igreja") {
      if (churchPeriod !== "week") params.set("churchPeriod", churchPeriod);
      if (churchDate !== todayDateOnly()) params.set("churchDate", churchDate);
      if (churchMeetingTypeId) params.set("churchMeetingTypeId", churchMeetingTypeId);
    }
    return `/coord?${params.toString()}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          padding: "24px 32px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div>
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
        <div style={{ margin: "20px 32px 0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderRadius: 14, background: "var(--status-urgente-bg)", border: "1px solid #FECACA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEE2E2", color: "#E11D48", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconBell size={17} />
            </div>
            <div>
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

      <nav style={{ padding: "16px 32px 0", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", gap: 4, overflowX: "auto" }}>
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={tabHref(t.key)}
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
              {t.label}
            </Link>
          );
        })}
      </nav>

      <main style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, width: "100%", margin: "0 auto" }}>

        {activeTab === "igreja" && (
          <>
            <Card padding={20}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)" }}>Perfil da Igreja</p>
                  <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>Frequencia e cuidado</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-3)" }}>{churchProfile.range.label} Â· {selectedChurchMeetingType?.name ?? "Todos os tipos"} Â· {tenants[0]?.name ?? session.membership.tenantName}</p>
                </div>
                <form action="/coord" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <input type="hidden" name="tab" value="igreja" />
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>
                    Visao
                    <select name="churchPeriod" defaultValue={churchPeriod} style={{ height: 38, minWidth: 112, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", padding: "0 10px", fontWeight: 700 }}>
                      <option value="day">Dia</option>
                      <option value="week">Semana</option>
                      <option value="month">Mes</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>
                    Data
                    <input type="date" name="churchDate" defaultValue={churchDate} style={{ height: 38, minWidth: 150, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", padding: "0 10px", fontWeight: 700 }} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>
                    Tipo
                    <select name="churchMeetingTypeId" defaultValue={churchMeetingTypeId ?? ""} style={{ height: 38, minWidth: 180, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", padding: "0 10px", fontWeight: 700 }}>
                      <option value="">Todos os tipos</option>
                      {churchProfile.meetingTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                    </select>
                  </label>
                  <Button type="submit" variant="primary" size="md" icon={<IconFilter />}>Filtrar</Button>
                </form>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginTop: 20 }}>
                <KpiCard icon={<IconChurch />} label="Membros da Igreja" value={churchProfile.activeMemberships} sub="Vinculos ativos" accent="#2563EB" bg="#DBEAFE" />
                <KpiCard icon={<IconUsers />} label="Pessoas que reuniram" value={churchProfile.presentPeople.value} sub={`${churchProfile.closedOccurrences.length} chamada(s) Â· ${formatComparison(churchProfile.presentPeople)}`} accent="#16A34A" bg="#DCFCE7" />
                <KpiCard icon={<IconChart />} label="Frequencia media" value={churchProfile.attendanceBase.eligible > 0 ? `${churchProfile.averageFrequency.value}%` : "-"} sub={churchProfile.attendanceBase.eligible > 0 ? `${churchProfile.attendanceBase.present} de ${churchProfile.attendanceBase.eligible}` : "Sem chamada fechada"} accent="#7C3AED" bg="rgba(124,58,237,0.12)" />
                <KpiCard icon={<IconBell />} label="Para revisao" value={churchProfile.attention.length} sub="Sinais de frequencia/cuidado" accent="#EA580C" bg="#FFEDD5" />
                <KpiCard icon={<IconHeart />} label="Casos em andamento" value={churchProfile.inCareCases} sub="Em acompanhamento" accent="#2563EB" bg="#DBEAFE" />
                <KpiCard icon={<IconCalendar />} label="Contatos vencidos" value={churchProfile.overdueContacts} sub="Proximas acoes vencidas" accent="#E11D48" bg="#FFE4E6" />
                <KpiCard icon={<IconHourglass />} label="Chamadas pendentes" value={churchProfile.pendingOccurrences.length} sub="Sem fechamento" accent="#E11D48" bg="#FFE4E6" />
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              <Card padding={20}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Tendencia de participacao</h3>
                    <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>Verde = presencas na base elegivel de chamadas fechadas.</p>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>Aus: {churchProfile.attendanceBase.absent} Â· Just: {churchProfile.attendanceBase.justified}</span>
                </div>
                <ChurchTrendChart data={churchProfile.trend} />
              </Card>
              <Card padding={0}>
                <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
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
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-3)" }}>{item.caregiverName ?? "Sem cuidador"} Â· Ultima presenca: {item.lastPresence ? formatDateLabel(item.lastPresence) : "sem registro"}</p>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: priorityColor(item.priority), textTransform: "uppercase" }}>{item.priority}</span>
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
          </>
        )}

        {activeTab === "tci" && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <KpiCard icon={<IconUsers />} label="Total Acolhidos" value={total} sub={`+${newContactsThisWeek} esta semana`} accent="#2D7FF9" bg="#E8F1FE" />
              <KpiCard icon={<IconHeart />} label="Sendo Cuidados" value={activeMembers} sub={`${total > 0 ? Math.round((activeMembers / total) * 100) : 0}% da base`} accent="#16A34A" bg="#DCFCE7" />
              <KpiCard icon={<IconCheck />} label="Concluidos" value={completedMembers} sub="Ciclos consolidados" accent="#7C3AED" bg="rgba(124,58,237,0.12)" />
              <KpiCard icon={<IconDoc />} label="Novos Contatos" value={operationalAlerts.totalOpenContacts} sub="Em fase de triagem" accent="#EA580C" bg="#FFEDD5" />
            </section>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              <Card padding={20}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Distribuicao por jornada do membro</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center" }}>
                  <StatusDonut data={memberJourney} total={members.length} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    {memberJourney.map((item) => {
                      const pct = members.length > 0 ? Math.round((item.count / members.length) * 100) : 0;
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
              <Card padding={20}>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Acoes nos ultimos 7 dias</h3>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-3)" }}>Total de {followups.length} acompanhamentos</p>
                <VisitChart data={visitsData} />
              </Card>
            </section>
            <Card padding={0}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Sessoes de TCI</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-3)" }}>Acompanhe as sessoes e cameras</p>
                </div>
                <Link href="/coord/tci" style={{ color: "var(--accent)", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>Gerenciar TCI</Link>
              </div>
              <div style={{ padding: "20px 18px" }}>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-3)" }}>Acesse o modulo de TCI para visualizar sessoes, cameras e participantes.</p>
                <Link href="/coord/tci"><Button variant="primary" size="md" icon={<IconUsers />}>Ir para TCI</Button></Link>
              </div>
            </Card>
          </>
        )}

        {activeTab === "cuidados" && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <KpiCard icon={<IconDoc />} label="Contatos na Triagem" value={operationalAlerts.totalOpenContacts} sub="Novos, contatados ou em espera" accent="#7C3AED" bg="rgba(124,58,237,0.12)" />
              <KpiCard icon={<IconHome />} label="Esperando Visita" value={operationalAlerts.waitingVisits} sub="Casas abertas aguardando visita" accent="#0891B2" bg="#ECFEFF" />
              <KpiCard icon={<IconHourglass />} label="Membros Sem Cuidador" value={operationalAlerts.membersWithoutCaregiver} sub="Precisam de designacao" accent="#EA580C" bg="#FFEDD5" />
              <KpiCard icon={<IconUsers />} label="Contatos Sem Cuidador" value={operationalAlerts.contactsWithoutCaregiver} sub="Fila operacional" accent="#2D7FF9" bg="#E8F1FE" />
              <KpiCard icon={<IconBell />} label="Casos Urgentes" value={operationalAlerts.urgentMembers} sub="Prioridade de resposta" accent="#E11D48" bg="#FFE4E6" />
              <KpiCard icon={<IconCalendar />} label="Contatos Vencidos" value={churchProfile.overdueContacts} sub="Proximas acoes vencidas" accent="#E11D48" bg="#FFE4E6" />
            </section>
            <DashboardMap items={mapItems} />
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <KpiCard icon={<IconHeart />} label="Sendo Cuidados" value={activeMembers} sub={`${total > 0 ? Math.round((activeMembers / total) * 100) : 0}% da base`} accent="#16A34A" bg="#DCFCE7" />
              <KpiCard icon={<IconHourglass />} label="Sem Cuidador (Total)" value={operationalAlerts.unassignedPeople} sub="Aguardando vinculacao" accent="#EA580C" bg="#FFEDD5" />
            </section>
          </>
        )}

        {activeTab === "cuidadores" && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <KpiCard icon={<IconUsers />} label="Total de Cuidadores" value={caregiversTotal} sub={`${caregiversActive} ativos`} accent="#2563EB" bg="#DBEAFE" />
              <KpiCard icon={<IconHeart />} label="Casos Ativos" value={activeMembers} sub="Membros sendo acompanhados" accent="#16A34A" bg="#DCFCE7" />
              <KpiCard icon={<IconHourglass />} label="Sem Cuidador" value={operationalAlerts.unassignedPeople} sub="Aguardando vinculacao" accent="#EA580C" bg="#FFEDD5" />
            </section>
            <Card padding={0}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Equipe de cuidadores</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-3)" }}>{caregiversActive} ativos de {caregiversTotal} Â· Ordenado por ultima acao</p>
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

        {activeTab === "acoes" && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <KpiCard icon={<IconCalendar />} label="Total de Acoes" value={followups.length} sub="Acompanhamentos registrados" accent="#2D7FF9" bg="#E8F1FE" />
              <KpiCard icon={<IconCalendar />} label="Acoes esta semana" value={visitsData.reduce((sum, d) => sum + d.n, 0)} sub="Ultimos 7 dias" accent="#16A34A" bg="#DCFCE7" />
              <KpiCard icon={<IconBell />} label="Acoes Vencidas" value={churchProfile.overdueContacts} sub="Proximas acoes em atraso" accent="#E11D48" bg="#FFE4E6" />
            </section>
            <Card padding={20}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Grafico de atividade semanal</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-3)" }}>Acompanhamentos registrados por dia nos ultimos 7 dias</p>
              <VisitChart data={visitsData} />
            </Card>
            <Card padding={20}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Ultimas interacoes pastorais</h3>
                <Link href="/coord/acompanhamentos" style={{ color: "var(--accent)", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>Ver todos</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {followups.slice(0, 10).map((item) => (
                  <div key={item.id} style={{ padding: 14, borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{item.member ?? "Sem membro"}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", flexShrink: 0 }}>
                        {item.type === "visit" ? "Visita" : item.type === "call" ? "Ligacao" : item.type === "message" ? "Mensagem" : item.type === "prayer" ? "Oracao" : "Outro"}
                      </span>
                    </div>
                    {item.notes && <p style={{ margin: "0 0 6px", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.4 }}>{item.notes}</p>}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)" }}>
                      <span>Registrado em: {new Date(item.occurredAt).toLocaleDateString("pt-BR")}</span>
                      {item.nextActionAt && <span style={{ color: "var(--accent)", fontWeight: 600 }}>Prox: {new Date(item.nextActionAt).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                ))}
                {followups.length === 0 && <p style={{ margin: 0, padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>Nenhum acompanhamento registrado ainda.</p>}
              </div>
              <div style={{ marginTop: 16 }}>
                <Link href="/coord/acompanhamentos"><Button variant="secondary" size="md" full icon={<IconCalendar />}>Novo Acompanhamento</Button></Link>
              </div>
            </Card>

            <WeeklySchedulePanel followups={followups} />
          </>
        )}

      </main>
    </div>
  );
}
