import type { MapKind } from "./data";

/** Cores de situação do mapa pontilhado e da legenda (a landing é escura nos dois temas). */
export const DOT_COLORS: Record<MapKind | "urgent", string> = {
  new: "#9aa8ff",
  contacted: "#f2b24c",
  waiting_visit: "#f2b24c",
  in_progress: "#6fb6ff",
  consolidated: "#6fd3a2",
  urgent: "#ff7a5c",
};
