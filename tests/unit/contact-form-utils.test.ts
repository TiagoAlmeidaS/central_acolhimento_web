import { describe, expect, it } from "vitest";
import { composeAddress, formatPhone, formatPostalCode, normalizePhone, normalizePostalCode } from "@/ui/mvp/contact-form-utils";

describe("contact form utils", () => {
  it("applies phone and postal code masks", () => {
    expect(normalizePhone("(83) 98888-7777")).toBe("83988887777");
    expect(formatPhone("83988887777")).toBe("(83) 98888-7777");
    expect(normalizePostalCode("58.000-123")).toBe("58000123");
    expect(formatPostalCode("58000123")).toBe("58000-123");
  });

  it("composes the full address when house visit is enabled", () => {
    expect(
      composeAddress({
        city: "João Pessoa",
        postalCode: "58000123",
        openHouse: true,
        street: "Rua das Flores",
        neighborhood: "Centro",
        addressNumber: "45",
        state: "PB",
      })
    ).toBe("Rua das Flores, 45 · Centro · João Pessoa · PB · CEP 58000-123");
  });

  it("returns an empty address when house visit is disabled", () => {
    expect(
      composeAddress({
        city: "João Pessoa",
        postalCode: "58000123",
        openHouse: false,
        street: "Rua das Flores",
        neighborhood: "Centro",
        addressNumber: "45",
        state: "PB",
      })
    ).toBe("");
  });
});
