import type { Member, Seed, SpiritualTemperature } from "@/server/domain/mvp";

export type JourneyStatusKey = "novo" | "acompanhamento" | "concluido" | "inativo";

export function countOperationalAlerts(members: Member[], seeds: Seed[]) {
  return {
    totalOpenContacts: seeds.filter((seed) => seed.status === "new" || seed.status === "contacted" || seed.status === "waiting_visit").length,
    membersWithoutCaregiver: members.filter((member) => !member.caregiverId).length,
    contactsWithoutCaregiver: seeds.filter((seed) => !seed.caregiverId).length,
    unassignedPeople: members.filter((member) => !member.caregiverId).length + seeds.filter((seed) => !seed.caregiverId).length,
    urgentMembers: members.filter((member) => member.isUrgent).length,
    waitingVisits: seeds.filter((seed) => seed.status === "waiting_visit").length,
  };
}

export function buildMemberJourneyDistribution(members: Member[]) {
  const counts: Record<JourneyStatusKey, number> = {
    novo: 0,
    acompanhamento: 0,
    concluido: 0,
    inativo: 0,
  };

  for (const member of members) {
    if (member.status === "new") {
      counts.novo += 1;
    } else if (member.status === "in_progress") {
      counts.acompanhamento += 1;
    } else if (member.status === "consolidated") {
      counts.concluido += 1;
    } else {
      counts.inativo += 1;
    }
  }

  return [
    { key: "novo" as const, label: "Novo", count: counts.novo },
    { key: "acompanhamento" as const, label: "Em acompanhamento", count: counts.acompanhamento },
    { key: "concluido" as const, label: "Consolidado", count: counts.concluido },
    { key: "inativo" as const, label: "Inativo", count: counts.inativo },
  ];
}

export function mapMemberStatusToVisualStatus(status: Member["status"]) {
  if (status === "new") return "novo";
  if (status === "in_progress") return "acompanhamento";
  if (status === "consolidated") return "concluido";
  return "inativo";
}

export const TEMPERATURE_LABELS: Record<SpiritualTemperature, string> = {
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
};

export function mapSpiritualTemperatureToVisualStatus(temperature: SpiritualTemperature | null | undefined) {
  if (temperature === "cold") return "frio";
  if (temperature === "warm") return "morno";
  if (temperature === "hot") return "quente";
  return null;
}

export function buildTemperatureDistribution(members: Member[]) {
  const counts: Record<string, number> = { cold: 0, warm: 0, hot: 0, unassessed: 0 };
  for (const member of members) {
    if (member.spiritualTemperature === "cold") counts.cold += 1;
    else if (member.spiritualTemperature === "warm") counts.warm += 1;
    else if (member.spiritualTemperature === "hot") counts.hot += 1;
    else counts.unassessed += 1;
  }
  return [
    { key: "quente" as const, label: "Quente", count: counts.hot },
    { key: "morno" as const, label: "Morno", count: counts.warm },
    { key: "frio" as const, label: "Frio", count: counts.cold },
    { key: null as any, label: "Sem avaliação", count: counts.unassessed },
  ];
}
