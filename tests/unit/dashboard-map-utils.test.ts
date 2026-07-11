import { describe, expect, it } from "vitest";
import { buildMapPopupContent, formatBirthDateLabel } from "@/ui/mvp/dashboard-map-utils";

describe("dashboard map utils", () => {
  it("formats birth dates in pt-BR", () => {
    expect(formatBirthDateLabel("2026-07-10")).toBe("10/07/2026");
    expect(formatBirthDateLabel(null)).toBeNull();
  });

  it("includes age and birth date in popup content when available", () => {
    const content = buildMapPopupContent(
      {
        id: "member-1",
        name: "Maria Souza",
        city: "Sape",
        address: "Rua A, 10",
        status: "acompanhamento",
        caregiver: "Ana",
        lastContact: "09/07/2026",
        latitude: -7.1,
        longitude: -34.8,
        age: 34,
        birthDate: "1992-02-14",
      },
      { color: "#2563EB", statusLabel: "Em acompanhamento" }
    );

    expect(content).toContain("Maria Souza");
    expect(content).toContain("34 anos");
    expect(content).toContain("14/02/1992");
    expect(content).toContain("Rua A, 10");
  });
});
