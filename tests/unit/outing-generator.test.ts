import { describe, expect, it } from "vitest";
import { generateOutingGroups } from "@/server/domain/outing-generator";
import type { OutingConstraintGroup, OutingParticipant } from "@/server/domain/mvp";

function participant(overrides: Partial<OutingParticipant> & Pick<OutingParticipant, "id" | "displayName">): OutingParticipant {
  const { id, displayName, ...rest } = overrides;
  return {
    id,
    outingEventId: "outing-1",
    participantType: "guest",
    participantId: null,
    displayName,
    firstName: null,
    lastName: null,
    phone: null,
    email: null,
    hasCar: false,
    carSeats: 0,
    isDriver: false,
    notes: "",
    ...rest,
  };
}

function constraint(participantIds: string[], label = "Casal"): OutingConstraintGroup {
  return {
    id: `constraint-${participantIds.join("-")}`,
    outingEventId: "outing-1",
    label,
    constraintType: "must_stay_together",
    participantIds,
  };
}

describe("generateOutingGroups", () => {
  it("mantem casal no mesmo grupo", () => {
    const participants = [
      participant({ id: "driver-1", displayName: "Motorista 1", hasCar: true, isDriver: true, carSeats: 3 }),
      participant({ id: "driver-2", displayName: "Motorista 2", hasCar: true, isDriver: true, carSeats: 3 }),
      participant({ id: "a", displayName: "Ana" }),
      participant({ id: "b", displayName: "Bruno" }),
      participant({ id: "c", displayName: "Clara" }),
      participant({ id: "d", displayName: "Davi" }),
    ];

    const groups = generateOutingGroups({
      outingEventId: "outing-1",
      participants,
      constraints: [constraint(["a", "b"], "Casal Ana e Bruno")],
      targetGroupSize: 4,
      allowGroupsWithoutCar: false,
      random: () => 0.2,
    });

    const groupWithAna = groups.find((group) => group.participants.some((item) => item.id === "a"));
    expect(groupWithAna?.participants.some((item) => item.id === "b")).toBe(true);
  });

  it("distribui motoristas primeiro e respeita capacidade", () => {
    const participants = [
      participant({ id: "driver-1", displayName: "Motorista 1", hasCar: true, isDriver: true, carSeats: 1 }),
      participant({ id: "driver-2", displayName: "Motorista 2", hasCar: true, isDriver: true, carSeats: 2 }),
      participant({ id: "a", displayName: "Ana" }),
      participant({ id: "b", displayName: "Bruno" }),
      participant({ id: "c", displayName: "Clara" }),
    ];

    const groups = generateOutingGroups({
      outingEventId: "outing-1",
      participants,
      constraints: [],
      targetGroupSize: 4,
      allowGroupsWithoutCar: false,
      random: () => 0.5,
    });

    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.driverParticipantId)).toBe(true);
    expect(groups.every((group) => (group.carCapacityTotal ?? 0) >= group.participants.length)).toBe(true);
  });

  it("falha quando um bloco ultrapassa a capacidade disponivel", () => {
    const participants = [
      participant({ id: "driver-1", displayName: "Motorista 1", hasCar: true, isDriver: true, carSeats: 1 }),
      participant({ id: "a", displayName: "Ana" }),
      participant({ id: "b", displayName: "Bruno" }),
      participant({ id: "c", displayName: "Clara" }),
    ];

    expect(() =>
      generateOutingGroups({
        outingEventId: "outing-1",
        participants,
        constraints: [constraint(["a", "b", "c"], "Familia")],
        targetGroupSize: 4,
        allowGroupsWithoutCar: false,
      }),
    ).toThrow(/excede a capacidade/i);
  });
});
