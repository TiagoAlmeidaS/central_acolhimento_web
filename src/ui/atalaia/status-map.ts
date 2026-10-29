export type PillTone =
  | "neutral"
  | "primary"
  | "warning"
  | "cold"
  | "success"
  | "danger"
  | "muted"
  | "warm"
  | "hot"
  | "lume";

export type StatusKey =
  | "novo"
  | "urgente"
  | "aguardando"
  | "esperando_visita"
  | "acompanhamento"
  | "concluido"
  | "inativo"
  | "frio"
  | "morno"
  | "quente";

export type StatusInfo = {
  key: StatusKey;
  label: string;
  /** Rotulo curto para filtros e espacos apertados. */
  shortLabel?: string;
  tone: PillTone;
};

/** Situacoes de contatos e assistidos em tons Atalaia. O texto e sempre exibido junto da cor. */
export const STATUS_INFO: Record<StatusKey, StatusInfo> = {
  novo: { key: "novo", label: "Novo", tone: "primary" },
  urgente: { key: "urgente", label: "Urgente", tone: "danger" },
  aguardando: { key: "aguardando", label: "Aguardando", tone: "warning" },
  esperando_visita: { key: "esperando_visita", label: "Esperando visita", tone: "warning" },
  acompanhamento: {
    key: "acompanhamento",
    label: "Em acompanhamento",
    shortLabel: "Acompanhando",
    tone: "cold",
  },
  concluido: { key: "concluido", label: "Concluído", tone: "success" },
  inativo: { key: "inativo", label: "Inativo", tone: "muted" },
  frio: { key: "frio", label: "Frio", tone: "cold" },
  morno: { key: "morno", label: "Morno", tone: "warm" },
  quente: { key: "quente", label: "Quente", tone: "hot" },
};

export const STATUS_KEY_ORDER: StatusKey[] = [
  "urgente",
  "novo",
  "esperando_visita",
  "aguardando",
  "acompanhamento",
  "concluido",
  "inativo",
];

/**
 * Converte qualquer grafia usada no app (chaves visuais em portugues, chaves do dominio em
 * ingles como `waiting_visit`/`consolidated`, rotulos livres) para uma `StatusKey`.
 * O que nao for reconhecido cai em "acompanhamento".
 */
export function normalizeStatusKey(raw: string | null | undefined): StatusKey {
  const value = (raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (value.includes("urg")) return "urgente";
  if (value.includes("waitingvisit") || value.includes("visit") || value.includes("esperando")) return "esperando_visita";
  if (value.includes("contacted") || value.includes("aguard")) return "aguardando";
  if (value.includes("inativ") || value.includes("inactive")) return "inativo";
  if (value.includes("concl") || value.includes("cons")) return "concluido";
  if (value.includes("frio") || value.includes("cold")) return "frio";
  if (value.includes("morno") || value.includes("warm")) return "morno";
  if (value.includes("quente") || value.includes("hot")) return "quente";
  if (value === "new" || value.includes("nov")) return "novo";
  return "acompanhamento";
}

export type Temperature = "hot" | "warm" | "cold";

export const TEMPERATURE_INFO: Record<Temperature, { label: string; tone: PillTone }> = {
  hot: { label: "Quente", tone: "hot" },
  warm: { label: "Morno", tone: "warm" },
  cold: { label: "Frio", tone: "cold" },
};
