import { describe, expect, it } from "vitest";
import { filterSessionsByWeek, sessionsOverlap, validateTciSessionWindow } from "@/server/domain/tci-scheduling";
import type { TciSession } from "@/server/domain/mvp";

function session(overrides: Partial<TciSession> & Pick<TciSession, "id" | "scheduledDate" | "startsAt" | "endsAt">): TciSession {
  const { id, scheduledDate, startsAt, endsAt, ...rest } = overrides;
  return {
    id,
    tenantId: "1",
    title: "Sessao TCI",
    description: "",
    scheduledDate,
    startsAt,
    endsAt,
    chamberId: "c1",
    chamberName: "Camara 1",
    status: "scheduled",
    notes: "",
    createdByTenantUserId: null,
    caregivers: [],
    ...rest,
  };
}

describe("tci scheduling utils", () => {
  it("detecta sobreposicao de horarios", () => {
    expect(sessionsOverlap("09:00", "10:00", "09:30", "10:30")).toBe(true);
    expect(sessionsOverlap("09:00", "10:00", "10:00", "11:00")).toBe(false);
  });

  it("valida janela de horario", () => {
    expect(() => validateTciSessionWindow("10:00", "09:00")).toThrow(/horario final/i);
  });

  it("filtra sessoes pela semana base", () => {
    const items = [
      session({ id: "1", scheduledDate: "2026-07-13", startsAt: "09:00", endsAt: "10:00" }),
      session({ id: "2", scheduledDate: "2026-07-15", startsAt: "09:00", endsAt: "10:00" }),
      session({ id: "3", scheduledDate: "2026-07-22", startsAt: "09:00", endsAt: "10:00" }),
    ];

    const filtered = filterSessionsByWeek(items, "2026-07-13");
    expect(filtered.map((item) => item.id)).toEqual(["1", "2"]);
  });
});
