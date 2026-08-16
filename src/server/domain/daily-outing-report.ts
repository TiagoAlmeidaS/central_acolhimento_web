import type { DailyOutingAgeGroup } from "@/server/domain/mvp";

export const DAILY_OUTING_REPORT_VERSION = "daily-outing-v1" as const;
export const DAILY_OUTING_REPORT_TIMEZONE = "America/Sao_Paulo" as const;

export function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function saoPauloDayUtcRange(dateOnly: string) {
  if (!isValidDateOnly(dateOnly)) throw new Error("Data invalida. Use AAAA-MM-DD.");
  const start = new Date(`${dateOnly}T03:00:00.000Z`);
  const end = new Date(start.getTime() + 86_400_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function isIsoInHalfOpenRange(value: string | null | undefined, start: string, end: string) {
  if (!value) return false;
  const instant = new Date(value).toISOString();
  return instant >= start && instant < end;
}

export function classifyDailyOutingAge(age: number | null): DailyOutingAgeGroup {
  if (age === null) return "unknown";
  return age >= 12 && age <= 17 ? "adolescent" : "other_known";
}
