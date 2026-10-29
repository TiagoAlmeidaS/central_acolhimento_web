export type DashSegment = "cuidado" | "aquisicao" | "igreja" | "equipe" | "atividade";

/**
 * Cada segmento responde a UMA pergunta; nenhuma métrica aparece em dois.
 * "Cuidado" vem primeiro e é o padrão: é nele que mora "Precisa de alguém", que o Atalaia
 * exige como primeira coisa que a coordenação vê.
 */
export const DASH_SEGMENTS: Array<{ value: DashSegment; label: string; question: string }> = [
  { value: "cuidado", label: "Cuidado", question: "Quem espera uma ação, quem está sendo cuidado e o que está parado." },
  { value: "aquisicao", label: "Aquisição", question: "De onde as pessoas estão vindo, por qual canal e quem as cadastrou." },
  { value: "igreja", label: "Igreja", question: "Quem está reunindo, com que frequência e quem parou de aparecer." },
  { value: "equipe", label: "Equipe", question: "Quem cuida de quem, com que carga e quem está sem movimento." },
  { value: "atividade", label: "Atividade", question: "O que foi feito no período: ações, visitas, saídas e TCI." },
];

/** As abas antigas (`?tab=`) continuam valendo como atalho para o segmento equivalente. */
const LEGACY_TAB_TO_SEGMENT: Record<string, DashSegment> = {
  geral: "cuidado",
  igreja: "igreja",
  tci: "atividade",
  cuidados: "cuidado",
  cuidadores: "equipe",
  acoes: "atividade",
};

export const DEFAULT_SEGMENT: DashSegment = "cuidado";

export function resolveSegment(value: string | undefined): DashSegment {
  if (value && DASH_SEGMENTS.some((segment) => segment.value === value)) return value as DashSegment;
  if (value && Object.prototype.hasOwnProperty.call(LEGACY_TAB_TO_SEGMENT, value)) return LEGACY_TAB_TO_SEGMENT[value];
  return DEFAULT_SEGMENT;
}
