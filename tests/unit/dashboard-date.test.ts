import { describe, expect, it } from "vitest";
import {
  addDays,
  buildRecentDayRange,
  dateOnlyInDashboardTimezone,
  todayDateOnly,
} from "@/server/domain/dashboard-date";

describe("dashboard date helpers", () => {
  it("usa o fuso do painel quando UTC ja virou o dia", () => {
    // 02:30Z de 01/01 ainda e 31/12 em Sao Paulo (UTC-3).
    const instant = new Date("2026-01-01T02:30:00.000Z");
    expect(instant.toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(todayDateOnly(instant)).toBe("2025-12-31");
    expect(dateOnlyInDashboardTimezone(instant)).toBe("2025-12-31");
  });

  it("mantem o mesmo dia quando UTC e Sao Paulo coincidem", () => {
    expect(todayDateOnly(new Date("2026-01-01T15:00:00.000Z"))).toBe("2026-01-01");
  });

  it("monta as faixas dos 7 dias terminando em hoje", () => {
    const range = buildRecentDayRange(7, new Date("2026-03-10T02:00:00.000Z"));
    expect(range).toEqual([
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
    ]);
  });

  it("atravessa a virada de mes ao somar dias", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("ignora valores invalidos ou vazios", () => {
    expect(dateOnlyInDashboardTimezone(null)).toBeNull();
    expect(dateOnlyInDashboardTimezone("")).toBeNull();
    expect(dateOnlyInDashboardTimezone("nao-e-data")).toBeNull();
  });
});
