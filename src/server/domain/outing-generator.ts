import type {
  OutingConstraintGroup,
  OutingGroup,
  OutingParticipant,
} from "@/server/domain/mvp";

type AllocationUnit = {
  participantIds: string[];
  participants: OutingParticipant[];
  containsDriver: boolean;
  driver: OutingParticipant | null;
  size: number;
};

type WorkingGroup = {
  id: string;
  name: string;
  driverParticipantId: string | null;
  carCapacityTotal: number | null;
  sortOrder: number;
  participants: OutingParticipant[];
};

export type GenerateOutingGroupsInput = {
  outingEventId: string;
  participants: OutingParticipant[];
  constraints: OutingConstraintGroup[];
  targetGroupSize: number;
  allowGroupsWithoutCar: boolean;
  random?: () => number;
};

export function normalizeGuestIdentity(displayName: string, phone?: string | null) {
  return `${displayName.trim().toLowerCase()}::${(phone ?? "").replace(/\D/g, "")}`;
}

function shuffle<T>(items: T[], random: () => number) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function buildUnits(
  participants: OutingParticipant[],
  constraints: OutingConstraintGroup[],
): AllocationUnit[] {
  const participantMap = new Map(participants.map((participant) => [participant.id, participant]));
  const assigned = new Set<string>();
  const units: AllocationUnit[] = [];

  for (const constraint of constraints) {
    const constraintParticipants = constraint.participantIds
      .map((participantId) => participantMap.get(participantId))
      .filter((participant): participant is OutingParticipant => Boolean(participant));

    if (constraintParticipants.length === 0) {
      continue;
    }

    const drivers = constraintParticipants.filter((participant) => participant.isDriver && participant.hasCar);
    if (drivers.length > 1) {
      throw new Error(`O vinculo "${constraint.label}" possui mais de um motorista. Ajuste antes de gerar os grupos.`);
    }

    for (const participant of constraintParticipants) {
      if (assigned.has(participant.id)) {
        throw new Error(`O participante "${participant.displayName}" aparece em mais de um vinculo inseparavel.`);
      }
    }

    for (const participant of constraintParticipants) {
      assigned.add(participant.id);
    }

    units.push({
      participantIds: constraintParticipants.map((participant) => participant.id),
      participants: constraintParticipants,
      containsDriver: drivers.length > 0,
      driver: drivers[0] ?? null,
      size: constraintParticipants.length,
    });
  }

  for (const participant of participants) {
    if (assigned.has(participant.id)) {
      continue;
    }

    units.push({
      participantIds: [participant.id],
      participants: [participant],
      containsDriver: participant.isDriver && participant.hasCar,
      driver: participant.isDriver && participant.hasCar ? participant : null,
      size: 1,
    });
  }

  return units;
}

function getMaximumCapacity(participants: OutingParticipant[]) {
  return participants
    .filter((participant) => participant.isDriver && participant.hasCar)
    .reduce((max, participant) => Math.max(max, 1 + Math.max(0, participant.carSeats)), 0);
}

function getGroupLimit(group: WorkingGroup, targetGroupSize: number, allowGroupsWithoutCar: boolean) {
  if (group.carCapacityTotal !== null) {
    return group.carCapacityTotal;
  }

  return allowGroupsWithoutCar ? targetGroupSize : 0;
}

function canFitUnit(
  group: WorkingGroup,
  unit: AllocationUnit,
  targetGroupSize: number,
  allowGroupsWithoutCar: boolean,
) {
  const limit = getGroupLimit(group, targetGroupSize, allowGroupsWithoutCar);
  return group.participants.length + unit.size <= limit;
}

export function generateOutingGroups(input: GenerateOutingGroupsInput): OutingGroup[] {
  const random = input.random ?? Math.random;
  const units = buildUnits(input.participants, input.constraints);

  if (units.length === 0) {
    throw new Error("Adicione participantes antes de gerar os grupos.");
  }

  const maximumCapacity = getMaximumCapacity(input.participants);
  for (const unit of units) {
    if (unit.size > Math.max(maximumCapacity, input.allowGroupsWithoutCar ? input.targetGroupSize : 0)) {
      throw new Error(`O bloco com ${unit.size} participante(s) excede a capacidade disponivel.`);
    }
  }

  const driverUnits = units
    .filter((unit) => unit.containsDriver)
    .sort((left, right) => {
      const leftCapacity = 1 + Math.max(0, left.driver?.carSeats ?? 0);
      const rightCapacity = 1 + Math.max(0, right.driver?.carSeats ?? 0);
      return rightCapacity - leftCapacity;
    });
  const nonDriverUnits = shuffle(
    units.filter((unit) => !unit.containsDriver),
    random,
  );

  if (driverUnits.length === 0 && !input.allowGroupsWithoutCar) {
    throw new Error("Nao existe motorista disponivel para gerar grupos com carro obrigatorio.");
  }

  const groups: WorkingGroup[] = driverUnits.map((unit, index) => ({
    id: `generated-${index + 1}`,
    name: `Grupo ${index + 1}`,
    driverParticipantId: unit.driver?.id ?? null,
    carCapacityTotal: unit.driver ? 1 + Math.max(0, unit.driver.carSeats) : null,
    sortOrder: index,
    participants: [...unit.participants],
  }));

  if (groups.length === 0) {
    groups.push({
      id: "generated-1",
      name: "Grupo 1",
      driverParticipantId: null,
      carCapacityTotal: null,
      sortOrder: 0,
      participants: [],
    });
  }

  for (const unit of nonDriverUnits) {
    const validGroups = groups
      .filter((group) => canFitUnit(group, unit, input.targetGroupSize, input.allowGroupsWithoutCar))
      .sort((left, right) => left.participants.length - right.participants.length);

    if (validGroups[0]) {
      validGroups[0].participants.push(...unit.participants);
      continue;
    }

    if (!input.allowGroupsWithoutCar) {
      throw new Error(`Nao foi possivel encaixar "${unit.participants.map((participant) => participant.displayName).join(", ")}" sem estourar a capacidade.`);
    }

    groups.push({
      id: `generated-${groups.length + 1}`,
      name: `Grupo ${groups.length + 1}`,
      driverParticipantId: null,
      carCapacityTotal: null,
      sortOrder: groups.length,
      participants: [...unit.participants],
    });
  }

  return groups.map((group) => ({
    id: group.id,
    outingEventId: input.outingEventId,
    name: group.name,
    driverParticipantId: group.driverParticipantId,
    carCapacityTotal: group.carCapacityTotal,
    sortOrder: group.sortOrder,
    participants: [...group.participants],
    assignedBy: "system",
  }));
}
