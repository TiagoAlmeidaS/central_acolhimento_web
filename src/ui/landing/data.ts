/**
 * Dados fictícios e estáticos da landing (igrejas e pessoas inventadas, Paraíba).
 * Portados de design-ref/atalaia-v2/data.js (build determinístico, "hoje" = 27/10/2026).
 * A landing é uma demonstração: nada aqui vem de API nem é enviado.
 */

export type MapKind =
  | "new"
  | "contacted"
  | "waiting_visit"
  | "in_progress"
  | "consolidated";

/** [latitude, longitude, situação, urgente (0/1), casa aberta (0/1)] */
export type MapPoint = readonly [number, number, MapKind, 0 | 1, 0 | 1];

export const SOURCES = [
  "Culto dominical",
  "Casa aberta",
  "Indicação de membro",
  "Saída missionária",
  "Redes sociais",
  "Busca espontânea"
] as const;

export const NETWORK = [
  {
    "name": "Igreja Central João Pessoa",
    "city": "João Pessoa",
    "seeds": 46,
    "care": 8
  },
  {
    "name": "Igreja Central Campina Grande",
    "city": "Campina Grande",
    "seeds": 30,
    "care": 6
  },
  {
    "name": "Igreja Central Patos",
    "city": "Patos",
    "seeds": 18,
    "care": 4
  }
] as const;

export const MAP_STATS = {
  city: "João Pessoa",
  seeds: 42,
  members: 28,
  inProgress: 15,
  consolidated: 13,
  open: 14,
} as const;

export const MAP_POINTS: readonly MapPoint[] = [
  [-7.1139, -34.8816, "contacted", 0, 0],
  [-7.138, -34.8402, "contacted", 1, 0],
  [-7.1415, -34.8313, "consolidated", 0, 0],
  [-7.139, -34.8436, "consolidated", 0, 0],
  [-7.1128, -34.8815, "in_progress", 0, 0],
  [-7.1073, -34.8549, "new", 1, 1],
  [-7.1066, -34.8513, "in_progress", 0, 0],
  [-7.1457, -34.8418, "waiting_visit", 0, 0],
  [-7.1039, -34.8539, "waiting_visit", 0, 1],
  [-7.1272, -34.8271, "in_progress", 0, 0],
  [-7.1264, -34.8588, "in_progress", 0, 1],
  [-7.1424, -34.8338, "contacted", 0, 0],
  [-7.1688, -34.8391, "new", 0, 0],
  [-7.123, -34.8592, "new", 0, 0],
  [-7.1261, -34.8573, "waiting_visit", 0, 0],
  [-7.1385, -34.8422, "new", 1, 1],
  [-7.1132, -34.8825, "waiting_visit", 0, 0],
  [-7.1436, -34.8322, "in_progress", 0, 0],
  [-7.1478, -34.8437, "in_progress", 0, 0],
  [-7.1696, -34.84, "waiting_visit", 0, 0],
  [-7.1499, -34.8414, "new", 0, 0],
  [-7.1379, -34.8405, "contacted", 1, 1],
  [-7.1422, -34.8306, "consolidated", 0, 0],
  [-7.113, -34.8829, "in_progress", 0, 1],
  [-7.1418, -34.8406, "contacted", 0, 0],
  [-7.1458, -34.8697, "new", 0, 0],
  [-7.1482, -34.841, "waiting_visit", 0, 0],
  [-7.1411, -34.8345, "contacted", 0, 1],
  [-7.1447, -34.8714, "waiting_visit", 0, 0],
  [-7.1259, -34.8588, "contacted", 0, 0],
  [-7.1718, -34.8366, "waiting_visit", 1, 1],
  [-7.141, -34.8429, "consolidated", 0, 0],
  [-7.1694, -34.8391, "in_progress", 1, 0],
  [-7.1723, -34.8392, "in_progress", 0, 0],
  [-7.1445, -34.873, "waiting_visit", 0, 1],
  [-7.1444, -34.8348, "in_progress", 0, 0],
  [-7.1157, -34.8834, "new", 0, 0],
  [-7.1477, -34.8694, "contacted", 0, 0],
  [-7.1386, -34.8402, "consolidated", 0, 1],
  [-7.1056, -34.8539, "contacted", 0, 0],
  [-7.1482, -34.8385, "contacted", 0, 0],
  [-7.1213, -34.8571, "waiting_visit", 1, 1],
  [-7.1681, -34.8355, "consolidated", 0, 0],
  [-7.1452, -34.8329, "in_progress", 0, 0],
  [-7.1112, -34.8817, "in_progress", 0, 0],
  [-7.1452, -34.8401, "consolidated", 0, 0],
  [-7.1714, -34.8384, "consolidated", 0, 0],
  [-7.1713, -34.8374, "consolidated", 0, 0],
  [-7.1262, -34.8618, "in_progress", 0, 0],
  [-7.1433, -34.87, "in_progress", 0, 0],
  [-7.1121, -34.8824, "consolidated", 0, 0],
  [-7.1474, -34.8438, "in_progress", 0, 0],
  [-7.1407, -34.8301, "consolidated", 0, 0],
  [-7.1145, -34.8816, "consolidated", 0, 1],
  [-7.1443, -34.8408, "in_progress", 0, 1],
  [-7.1448, -34.873, "consolidated", 0, 0],
  [-7.149, -34.843, "in_progress", 0, 0],
  [-7.1257, -34.8597, "consolidated", 0, 0],
  [-7.1731, -34.8373, "consolidated", 0, 0],
  [-7.1434, -34.87, "in_progress", 0, 1],
  [-7.1232, -34.8598, "in_progress", 0, 0],
  [-7.1234, -34.8582, "in_progress", 0, 0],
  [-7.1407, -34.844, "in_progress", 0, 0],
  [-7.1474, -34.8721, "in_progress", 0, 0],
  [-7.1499, -34.8424, "in_progress", 0, 0],
  [-7.1711, -34.8409, "consolidated", 0, 0],
  [-7.127, -34.8246, "consolidated", 0, 0],
  [-7.1416, -34.8404, "in_progress", 0, 0],
  [-7.141, -34.8302, "consolidated", 0, 0],
  [-7.1241, -34.8625, "in_progress", 0, 0],
];

export const QUESTION_COUNTS = {"noCare":2,"late":4,"absent":3,"drivers":3,"days":2} as const;

export const SNAPSHOT = {
  tenant: "Igreja Central João Pessoa",
  first: "Edileuza",
  date: "terça-feira, 27 de outubro",
  needsCount: 18,
  needs: [
  {
    "name": "Luiz Lima Oliveira",
    "reason": "Urgente e sem cuidador",
    "action": "Atribuir",
    "sev": 3
  },
  {
    "name": "Raimundo Lucena Costa",
    "reason": "Urgente · aguardando visita",
    "action": "Abrir",
    "sev": 3
  },
  {
    "name": "Davi Medeiros Brito",
    "reason": "Urgente · aguardando visita",
    "action": "Abrir",
    "sev": 3
  },
  {
    "name": "Ana Silva Souza",
    "reason": "Urgente · contatado",
    "action": "Abrir",
    "sev": 3
  },
  {
    "name": "Francisca Queiroga Brito",
    "reason": "Urgente · contatado",
    "action": "Abrir",
    "sev": 3
  }
],
  kpis: [["Novos · 7 dias",5,false],["Precisam de alguém",18,true],["Ações atrasadas",4,true],["Consolidados",18,false]] as ReadonlyArray<readonly [string, number, boolean]>,
  funnel: [["Novo",7],["Contatado",10],["Aguardando visita",10],["Em acompanhamento",10],["Consolidado",5]] as ReadonlyArray<readonly [string, number]>,
} as const;

/** Linha de cadastro: exemplo preenchido do hero. */
export const CMD_EXAMPLE = "Francisca Araújo · (83) 99812-4410 · Mangabeira";
