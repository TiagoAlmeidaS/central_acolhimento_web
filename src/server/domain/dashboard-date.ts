export const PEOPLE_DASHBOARD_TIMEZONE = "America/Sao_Paulo" as const;

const dateOnlyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PEOPLE_DASHBOARD_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Converte um instante para a data (AAAA-MM-DD) no fuso do painel. */
export function dateOnlyInDashboardTimezone(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateOnlyFormatter.format(date);
}

/** Dia de hoje no fuso do painel, sempre AAAA-MM-DD. */
export function todayDateOnly(now: Date = new Date()) {
  return dateOnlyFormatter.format(now);
}

export function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

/** Ancorado em UTC para que a aritmetica de dias nao dependa do fuso do servidor. */
export function parseDateOnly(value: string, now: Date = new Date()) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? new Date(`${todayDateOnly(now)}T00:00:00.000Z`) : parsed;
}

export function addDays(value: string, amount: number) {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateOnly(date);
}

/** Ultimos `days` dias (AAAA-MM-DD) terminando em hoje, no fuso do painel. */
export function buildRecentDayRange(days: number, now: Date = new Date()) {
  const today = todayDateOnly(now);
  return Array.from({ length: days }).map((_, index) => addDays(today, index - (days - 1)));
}
