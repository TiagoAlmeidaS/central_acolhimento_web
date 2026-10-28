import { describe, expect, it } from "vitest";
import type { Followup, Member, Seed } from "@/server/domain/mvp";
import {
  buildCarePeople,
  buildNeeds,
  buildUpcoming,
  calendarDaysBetween,
  relativeDay,
  whatsappUrl,
} from "@/ui/cuidador/care-utils";

const NOW = "2026-10-28T15:00:00.000Z";

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: "m1",
    tenantId: "t1",
    caregiverId: "c1",
    seedId: null,
    name: "Ana Souza",
    age: 30,
    phone: "(83) 99999-0000",
    address: "",
    postalCode: "",
    street: "",
    neighborhood: "Centro",
    addressNumber: "",
    state: "PB",
    city: "Sape",
    birthDate: null,
    status: "in_progress",
    notes: "",
    latitude: null,
    longitude: null,
    ...overrides,
  };
}

function seed(overrides: Partial<Seed> = {}): Seed {
  return {
    id: "s1",
    tenantId: "t1",
    caregiverId: "c1",
    referenceName: "Pedro Lima",
    age: null,
    phone: "",
    city: "Sape",
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
    firstContactAt: "2026-10-20T12:00:00.000Z",
    latitude: null,
    longitude: null,
    ...overrides,
  };
}

function followup(overrides: Partial<Followup> = {}): Followup {
  return {
    id: "f1",
    tenantId: "t1",
    memberId: "m1",
    caregiverId: "c1",
    type: "call",
    occurredAt: "2026-10-25T12:00:00.000Z",
    notes: "ok",
    nextActionAt: null,
    ...overrides,
  };
}

describe("care-utils", () => {
  it("conta dias de calendário no fuso do app", () => {
    expect(calendarDaysBetween("2026-10-28T15:00:00.000Z", "2026-10-29T12:00:00.000Z")).toBe(1);
    expect(calendarDaysBetween("2026-10-28T15:00:00.000Z", "2026-10-28T23:00:00.000Z")).toBe(0);
    expect(relativeDay("2026-10-30T12:00:00.000Z", NOW)).toBe("em 2 dias");
    expect(relativeDay("2026-10-27T12:00:00.000Z", NOW)).toBe("ontem");
  });

  it("monta o link do WhatsApp com DDI do Brasil", () => {
    expect(whatsappUrl("(83) 99999-0000")).toBe("https://wa.me/5583999990000");
    expect(whatsappUrl("5583999990000", "oi")).toBe("https://wa.me/5583999990000?text=oi");
  });

  it("não duplica contatos já convertidos em assistido", () => {
    const people = buildCarePeople(
      [member({ seedId: "s1" })],
      [seed({ id: "s1", status: "waiting_visit" }), seed({ id: "s2", status: "in_progress" }), seed({ id: "s3" })],
      [],
    );
    expect(people.map((person) => person.id)).toEqual(["m1", "s3"]);
  });

  it("usa o acompanhamento mais recente como próxima ação", () => {
    const [person] = buildCarePeople(
      [member()],
      [],
      [
        followup({ id: "old", occurredAt: "2026-10-20T12:00:00.000Z", nextActionAt: "2026-10-22T12:00:00.000Z" }),
        followup({ id: "new", occurredAt: "2026-10-26T12:00:00.000Z", nextActionAt: "2026-11-02T12:00:00.000Z" }),
      ],
    );
    expect(person.nextActionAt).toBe("2026-11-02T12:00:00.000Z");
    expect(person.followups[0].id).toBe("new");
  });

  it("ordena 'Precisa de você' por urgência e ignora consolidados e inativos", () => {
    const people = buildCarePeople(
      [
        member({ id: "late", name: "Atrasada", status: "in_progress" }),
        member({ id: "urgent", name: "Urgente", isUrgent: true }),
        member({ id: "done", name: "Consolidada", status: "consolidated", isUrgent: true }),
      ],
      [seed({ id: "wait", referenceName: "Visita", status: "waiting_visit" }), seed({ id: "fresh", referenceName: "Novo" })],
      [followup({ memberId: "late", nextActionAt: "2026-10-20T12:00:00.000Z" })],
    );
    const needs = buildNeeds(people, NOW);
    expect(needs.map((need) => need.person.id)).toEqual(["urgent", "late", "wait", "fresh"]);
    expect(needs.find((need) => need.person.id === "late")?.reason).toContain("atrasada");
    expect(needs.find((need) => need.person.id === "done")).toBeUndefined();
  });

  it("lista só compromissos de hoje em diante, do mais próximo ao mais distante", () => {
    const people = buildCarePeople(
      [member({ id: "a", name: "A" }), member({ id: "b", name: "B" }), member({ id: "c", name: "C" })],
      [],
      [
        followup({ id: "1", memberId: "a", nextActionAt: "2026-11-05T12:00:00.000Z" }),
        followup({ id: "2", memberId: "b", nextActionAt: "2026-10-29T12:00:00.000Z" }),
        followup({ id: "3", memberId: "c", nextActionAt: "2026-10-01T12:00:00.000Z" }),
      ],
    );
    expect(buildUpcoming(people, NOW).map((item) => item.person.id)).toEqual(["b", "a"]);
  });
});
