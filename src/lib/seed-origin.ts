import type { SeedOriginChannel } from "@/server/domain/mvp";

/** Taxonomia fechada de origem do contato. A ordem e a mesma exibida no formulario. */
export const SEED_ORIGIN_CHANNELS: readonly SeedOriginChannel[] = [
  "outing",
  "referral",
  "church_service",
  "public_link",
  "whatsapp",
  "manual",
  "import",
  "other",
];

export const SEED_ORIGIN_CHANNEL_LABELS: Record<SeedOriginChannel, string> = {
  outing: "Saída / Evangelismo",
  referral: "Indicação",
  church_service: "Culto / Reunião",
  public_link: "Link público / QR",
  whatsapp: "WhatsApp",
  manual: "Cadastro manual",
  import: "Importação",
  other: "Outro",
};

export const SEED_ORIGIN_CHANNEL_DETAIL_PLACEHOLDERS: Record<SeedOriginChannel, string> = {
  outing: "Qual saída?",
  referral: "Quem indicou?",
  church_service: "Qual culto ou reunião?",
  public_link: "Qual link ou QR?",
  whatsapp: "Qual grupo ou contato?",
  manual: "Detalhe do cadastro",
  import: "Qual planilha ou base?",
  other: "Descreva a origem",
};

export const SEED_ORIGIN_CHANNEL_INVALID_MESSAGE = `Origem invalida. Use um destes canais: ${SEED_ORIGIN_CHANNELS.join(", ")}.`;

export function isSeedOriginChannel(value: unknown): value is SeedOriginChannel {
  return typeof value === "string" && (SEED_ORIGIN_CHANNELS as readonly string[]).includes(value);
}

/** Campo ausente no corpo da requisicao: o PUT deve preservar o valor atual. */
export const SEED_ORIGIN_CHANNEL_ABSENT = "__ausente__" as const;

export type SeedOriginChannelAbsent = typeof SEED_ORIGIN_CHANNEL_ABSENT;

function isAbsentOriginChannel(value: unknown) {
  return value === undefined || value === null || value === "";
}

/**
 * Valida o canal recebido no POST de criacao. Ausente/vazio cai em "other"
 * (fila de reclassificacao); valor fora da taxonomia retorna null para a rota
 * responder 400 com SEED_ORIGIN_CHANNEL_INVALID_MESSAGE.
 */
export function parseSeedOriginChannelForCreate(value: unknown): SeedOriginChannel | null {
  if (isAbsentOriginChannel(value)) {
    return "other";
  }

  return isSeedOriginChannel(value) ? value : null;
}

/**
 * Valida o canal recebido no PUT de atualizacao. Aqui ausente NAO pode virar
 * "other": significa "nao mexer", senao PUTs parciais (adotar/inativar no app
 * do cuidador) apagariam a origem ja registrada. Valor fora da taxonomia segue
 * retornando null para a rota responder 400.
 */
export function parseSeedOriginChannelForUpdate(
  value: unknown,
): SeedOriginChannel | SeedOriginChannelAbsent | null {
  if (isAbsentOriginChannel(value)) {
    return SEED_ORIGIN_CHANNEL_ABSENT;
  }

  return isSeedOriginChannel(value) ? value : null;
}

/**
 * Texto de origem exibido na lista de pessoas e nas exportacoes. A taxonomia
 * nova e a fonte de verdade: rotulo do canal mais o detalhe quando houver. O
 * `source` legado so entra quando nao ha canal registrado -- "other" sem
 * detalhe, que e exatamente a fila "Origem sem registro".
 */
export function seedOriginText(seed: {
  originChannel?: unknown;
  originDetail?: string | null;
  source?: string | null;
}) {
  const detail = (seed.originDetail ?? "").trim();
  const channel = isSeedOriginChannel(seed.originChannel) ? seed.originChannel : null;

  if (channel && (channel !== "other" || detail)) {
    const label = seedOriginChannelLabel(channel);
    return detail ? `${label} — ${detail}` : label;
  }

  const legacy = (seed.source ?? "").trim();
  return legacy || seedOriginChannelLabel(channel);
}

export function seedOriginChannelLabel(value: unknown) {
  return isSeedOriginChannel(value) ? SEED_ORIGIN_CHANNEL_LABELS[value] : SEED_ORIGIN_CHANNEL_LABELS.other;
}
