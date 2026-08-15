import { describe, expect, it } from "vitest";
import { classifyDailyOutingAge, isValidDateOnly, saoPauloDayUtcRange } from "@/server/domain/daily-outing-report";
import { buildDailyOutingReport } from "@/server/repositories/daily-outing-report-repository";
import type { OutingDetail, Seed, Tenant } from "@/server/domain/mvp";

describe("daily outing report", () => {
  it("classifies adolescent boundaries and unknown ages", () => {
    expect(classifyDailyOutingAge(11)).toBe("other_known");
    expect(classifyDailyOutingAge(12)).toBe("adolescent");
    expect(classifyDailyOutingAge(17)).toBe("adolescent");
    expect(classifyDailyOutingAge(18)).toBe("other_known");
    expect(classifyDailyOutingAge(null)).toBe("unknown");
  });

  it("builds the Sao Paulo daily UTC window", () => {
    expect(isValidDateOnly("2026-08-15")).toBe(true);
    expect(isValidDateOnly("2026-02-30")).toBe(false);
    expect(saoPauloDayUtcRange("2026-08-15")).toEqual({
      start: "2026-08-15T03:00:00.000Z",
      end: "2026-08-16T03:00:00.000Z",
    });
  });

  it("aggregates only completed outings and linked contacts in the selected day", () => {
    const tenant: Tenant = { id: "t1", name: "Central", city: "Sape", state: "PB", status: "active", coordinator: null };
    const detail = {
      outing: {
        id: "o1", tenantId: "t1", name: "Saida", description: "", scheduledFor: null, targetGroupSize: 4,
        allowGroupsWithoutCar: true, status: "confirmed", outingTypeId: "type1", outingTypeName: "Adolescentes",
        completedAt: "2026-08-15T12:00:00.000Z", completedByTenantUserId: "u1", createdByTenantUserId: "u1",
      },
      participants: [{ id: "p1" }, { id: "p2" }], constraints: [], groups: [],
    } as unknown as OutingDetail;
    const seeds = [
      { id: "s1", tenantId: "t1", referenceName: "Ana", age: 12, openHouse: true, address: "Rua A", city: "Sape", latitude: -7, longitude: -35, outingEventId: "o1", createdAt: "2026-08-15T13:00:00.000Z" },
      { id: "s2", tenantId: "t1", referenceName: "Bia", age: null, openHouse: true, address: "Rua B", city: "Sape", latitude: null, longitude: null, outingEventId: "o1", createdAt: "2026-08-15T14:00:00.000Z" },
      { id: "s3", tenantId: "t1", referenceName: "Outro dia", age: 17, openHouse: false, address: "", city: "Sape", latitude: null, longitude: null, outingEventId: "o1", createdAt: "2026-08-16T04:00:00.000Z" },
    ] as Seed[];
    const report = buildDailyOutingReport({ tenant, date: "2026-08-15", outingDetails: [detail], seeds, generatedAt: "2026-08-15T18:00:00.000Z" });
    expect(report.totals).toEqual({ completedOutings: 1, participations: 2, newContacts: 2, adolescents: 1, otherKnownAges: 0, unknownAges: 1, openHouses: 2, openHousesWithoutCoordinates: 1 });
    expect(report.byType[0]).toMatchObject({ name: "Adolescentes", outings: 1, participations: 2, newContacts: 2, adolescents: 1, openHouses: 2 });
  });
});
