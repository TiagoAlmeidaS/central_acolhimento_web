import { describe, expect, it } from "vitest";
import type { Followup, Member, Seed } from "@/server/domain/mvp";
import {
  buildMemberJourneyDistribution,
  countOperationalAlerts,
  countPeopleWithOverdueNextAction,
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

function createFollowup(overrides: Partial<Followup>): Followup {
  return {
    id: "followup-1",
    tenantId: "tenant-1",
    memberId: "member-1",
    caregiverId: null,
    type: "visit",
    occurredAt: "2026-01-01T12:00:00.000Z",
    notes: "",
    nextActionAt: null,
    ...overrides,
  };
}

describe("countPeopleWithOverdueNextAction", () => {
  const now = new Date("2026-03-10T12:00:00.000Z");

  it("nao conta pessoa sem followup", () => {
    expect(countPeopleWithOverdueNextAction([], now)).toBe(0);
  });

  it("nao conta pessoa com proxima acao futura", () => {
    const followups = [createFollowup({ id: "f1", memberId: "m1", occurredAt: "2026-03-01T12:00:00.000Z", nextActionAt: "2026-03-20T12:00:00.000Z" })];
    expect(countPeopleWithOverdueNextAction(followups, now)).toBe(0);
  });

  it("conta pessoa com proxima acao vencida", () => {
    const followups = [createFollowup({ id: "f1", memberId: "m1", occurredAt: "2026-03-01T12:00:00.000Z", nextActionAt: "2026-03-05T12:00:00.000Z" })];
    expect(countPeopleWithOverdueNextAction(followups, now)).toBe(1);
  });

  it("conta a pessoa uma vez mesmo com varios followups vencidos", () => {
    const followups = [
      createFollowup({ id: "f1", memberId: "m1", occurredAt: "2026-02-01T12:00:00.000Z", nextActionAt: "2026-02-05T12:00:00.000Z" }),
      createFollowup({ id: "f2", memberId: "m1", occurredAt: "2026-02-10T12:00:00.000Z", nextActionAt: "2026-02-15T12:00:00.000Z" }),
      createFollowup({ id: "f3", memberId: "m1", occurredAt: "2026-03-01T12:00:00.000Z", nextActionAt: "2026-03-05T12:00:00.000Z" }),
    ];
    expect(countPeopleWithOverdueNextAction(followups, now)).toBe(1);
  });

  it("encerra a pendencia quando o followup mais novo nao tem proxima acao", () => {
    const followups = [
      createFollowup({ id: "f1", memberId: "m1", occurredAt: "2026-02-01T12:00:00.000Z", nextActionAt: "2026-02-05T12:00:00.000Z" }),
      createFollowup({ id: "f2", memberId: "m1", occurredAt: "2026-03-02T12:00:00.000Z", nextActionAt: null }),
    ];
    expect(countPeopleWithOverdueNextAction(followups, now)).toBe(0);
  });

  it("conta pessoas distintas separadamente", () => {
    const followups = [
      createFollowup({ id: "f1", memberId: "m1", occurredAt: "2026-03-01T12:00:00.000Z", nextActionAt: "2026-03-05T12:00:00.000Z" }),
      createFollowup({ id: "f2", memberId: "m2", occurredAt: "2026-03-02T12:00:00.000Z", nextActionAt: "2026-03-06T12:00:00.000Z" }),
      createFollowup({ id: "f3", memberId: "m3", occurredAt: "2026-03-02T12:00:00.000Z", nextActionAt: "2026-03-30T12:00:00.000Z" }),
    ];
    expect(countPeopleWithOverdueNextAction(followups, now)).toBe(2);
  });
});

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
      createSeed({ id: "s4", status: "waiting_visit", caregiverId: null }),
    ];

    expect(countOperationalAlerts(members, seeds)).toEqual({
      totalOpenContacts: 3,
      membersWithoutCaregiver: 1,
      contactsWithoutCaregiver: 3,
      unassignedPeople: 4,
      urgentMembers: 1,
      waitingVisits: 1,
    });
  });

  it("maps member statuses to visual statuses without overlap", () => {
    expect(mapMemberStatusToVisualStatus("new")).toBe("novo");
    expect(mapMemberStatusToVisualStatus("in_progress")).toBe("acompanhamento");
    expect(mapMemberStatusToVisualStatus("consolidated")).toBe("concluido");
    expect(mapMemberStatusToVisualStatus("inactive")).toBe("inativo");
  });
});
