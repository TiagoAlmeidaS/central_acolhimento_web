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

/**
 * Valida o canal recebido pela API. Ausente/vazio cai em "other" (fila de
 * reclassificacao); valor fora da taxonomia retorna null para a rota responder
 * 400 com SEED_ORIGIN_CHANNEL_INVALID_MESSAGE.
 */
export function parseSeedOriginChannel(value: unknown): SeedOriginChannel | null {
  if (value === undefined || value === null || value === "") {
    return "other";
  }

  return isSeedOriginChannel(value) ? value : null;
}

export function seedOriginChannelLabel(value: unknown) {
  return isSeedOriginChannel(value) ? SEED_ORIGIN_CHANNEL_LABELS[value] : SEED_ORIGIN_CHANNEL_LABELS.other;
}
