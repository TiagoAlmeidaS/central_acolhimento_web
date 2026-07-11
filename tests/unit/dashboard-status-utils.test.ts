import { describe, expect, it } from "vitest";
import type { Member, Seed } from "@/server/domain/mvp";
import {
  buildMemberJourneyDistribution,
  countOperationalAlerts,
  mapMemberStatusToVisualStatus,
} from "@/ui/mvp/dashboard-status-utils";

function createMember(overrides: Partial<Member>): Member {
  return {
    id: "member-1",
    tenantId: "tenant-1",
    caregiverId: null,
    seedId: null,
    name: "Pessoa",
    age: null,
    phone: "",
    address: "",
    postalCode: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "",
    city: "",
    birthDate: null,
    status: "new",
    notes: "",
    latitude: null,
    longitude: null,
    isUrgent: false,
    ...overrides,
  };
}

function createSeed(overrides: Partial<Seed>): Seed {
  return {
    id: "seed-1",
    tenantId: "tenant-1",
    caregiverId: null,
    referenceName: "Contato",
    age: null,
    phone: "",
    city: "",
    postalCode: "",
    openHouse: false,
    address: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "",
    houseFrontImageUrl: null,
    source: "",
    status: "new",
    notes: "",
    firstContactAt: null,
    latitude: null,
    longitude: null,
    isUrgent: false,
    ...overrides,
  };
}

describe("dashboard status utils", () => {
  it("builds an exclusive member journey distribution", () => {
    const members = [
      createMember({ id: "m1", status: "new", caregiverId: null }),
      createMember({ id: "m2", status: "in_progress", caregiverId: null }),
      createMember({ id: "m3", status: "consolidated", caregiverId: "cg-1" }),
      createMember({ id: "m4", status: "inactive", caregiverId: "cg-2" }),
    ];

    const distribution = buildMemberJourneyDistribution(members);
    expect(distribution).toEqual([
      { key: "novo", label: "Novo", count: 1 },
      { key: "acompanhamento", label: "Em acompanhamento", count: 1 },
      { key: "concluido", label: "Consolidado", count: 1 },
      { key: "inativo", label: "Inativo", count: 1 },
    ]);
    expect(distribution.reduce((sum, item) => sum + item.count, 0)).toBe(members.length);
  });

  it("separates operational alerts from journey status", () => {
    const members = [
      createMember({ id: "m1", status: "in_progress", caregiverId: null, isUrgent: true }),
      createMember({ id: "m2", status: "new", caregiverId: "cg-1" }),
    ];
    const seeds = [
      createSeed({ id: "s1", status: "new", caregiverId: null }),
      createSeed({ id: "s2", status: "contacted", caregiverId: "cg-2" }),
      createSeed({ id: "s3", status: "in_progress", caregiverId: null }),
    ];

    expect(countOperationalAlerts(members, seeds)).toEqual({
      totalOpenContacts: 2,
      membersWithoutCaregiver: 1,
      contactsWithoutCaregiver: 2,
      unassignedPeople: 3,
      urgentMembers: 1,
    });
  });

  it("maps member statuses to visual statuses without overlap", () => {
    expect(mapMemberStatusToVisualStatus("new")).toBe("novo");
    expect(mapMemberStatusToVisualStatus("in_progress")).toBe("acompanhamento");
    expect(mapMemberStatusToVisualStatus("consolidated")).toBe("concluido");
    expect(mapMemberStatusToVisualStatus("inactive")).toBe("inativo");
  });
});
