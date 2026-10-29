const TZ = "America/Sao_Paulo";

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function isValid(date: Date) {
  return !Number.isNaN(date.getTime());
}

/** "12/03" */
export function fmtDay(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = toDate(value);
  if (!isValid(date)) return "—";
  return date.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });
}

/** "12/03/2026" */
export function fmtDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = toDate(value);
  if (!isValid(date)) return "—";
  return date.toLocaleDateString("pt-BR", { timeZone: TZ });
}

/** "14:30" */
export function fmtTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = toDate(value);
  if (!isValid(date)) return "—";
  return date.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

/** "12/03/2026 14:30" */
export function fmtDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return `${fmtDate(value)} ${fmtTime(value)}`;
}

/** "quarta-feira, 12 de março" para datas AAAA-MM-DD ou instantes. */
export function fmtLong(value: string | Date) {
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : toDate(value);
  if (!isValid(date)) return "—";
  return date.toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Dias entre `now` e a data (negativo = passado). */
export function dayDiff(value: string | Date, now: Date) {
  const date = toDate(value);
  if (!isValid(date)) return 0;
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000);
}

/** "hoje", "amanhã", "em 3 dias", "há 2 dias". */
export function relDay(value: string | Date, now: Date) {
  const diff = dayDiff(value, now);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  return diff > 0 ? `em ${diff} dias` : `há ${-diff} dias`;
}

/** "Maria da Silva" -> "Maria S." */
export function shortName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Valor para `<input type="datetime-local">` no fuso local do navegador. */
export function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
