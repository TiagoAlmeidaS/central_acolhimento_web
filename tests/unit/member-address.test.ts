import { describe, expect, it } from "vitest";
import {
  buildMemberAddress,
  composeAddress,
  formatPostalCode,
  normalizePostalCode,
} from "@/ui/mvp/contact-form-utils";

// ---------------------------------------------------------------------------
// buildMemberAddress
// ---------------------------------------------------------------------------
describe("buildMemberAddress", () => {
  it("monta endereço completo com todos os campos preenchidos", () => {
    expect(
      buildMemberAddress({
        street: "Rua das Flores",
        addressNumber: "45",
        neighborhood: "Centro",
        city: "João Pessoa",
        state: "PB",
        postalCode: "58000123",
      })
    ).toBe("Rua das Flores, 45 · Centro · João Pessoa · PB · CEP 58000-123");
  });

  it("monta endereço sem número quando ausente", () => {
    expect(
      buildMemberAddress({
        street: "Rua das Flores",
        addressNumber: "",
        neighborhood: "Centro",
        city: "Sapé",
        state: "PB",
        postalCode: "58200000",
      })
    ).toBe("Rua das Flores · Centro · Sapé · PB · CEP 58200-000");
  });

  it("retorna string vazia quando nenhum campo está preenchido", () => {
    expect(
      buildMemberAddress({
        street: "",
        addressNumber: "",
        neighborhood: "",
        city: "",
        state: "",
        postalCode: "",
      })
    ).toBe("");
  });

  it("omite CEP quando não fornecido", () => {
    expect(
      buildMemberAddress({
        street: "Av. Epitácio Pessoa",
        addressNumber: "100",
        neighborhood: "Tambaú",
        city: "João Pessoa",
        state: "PB",
        postalCode: "",
      })
    ).toBe("Av. Epitácio Pessoa, 100 · Tambaú · João Pessoa · PB");
  });

  it("ignora espaços extras nos campos", () => {
    expect(
      buildMemberAddress({
        street: "  Rua da Paz  ",
        addressNumber: "  12  ",
        neighborhood: "  Jardim  ",
        city: "  Recife  ",
        state: "  PE  ",
        postalCode: "50000000",
      })
    ).toBe("Rua da Paz, 12 · Jardim · Recife · PE · CEP 50000-000");
  });

  it("monta endereço sem bairro quando ausente", () => {
    expect(
      buildMemberAddress({
        street: "Rua XV de Novembro",
        addressNumber: "200",
        neighborhood: "",
        city: "Curitiba",
        state: "PR",
        postalCode: "80020310",
      })
    ).toBe("Rua XV de Novembro, 200 · Curitiba · PR · CEP 80020-310");
  });
});

// ---------------------------------------------------------------------------
// composeAddress (verifica que a alteração não quebrou o comportamento
// existente usado pelo ContactManager / seeds)
// ---------------------------------------------------------------------------
describe("composeAddress (regressão)", () => {
  it("retorna vazio quando openHouse é false", () => {
    expect(
      composeAddress({
        openHouse: false,
        street: "Rua das Flores",
        addressNumber: "45",
        neighborhood: "Centro",
        city: "João Pessoa",
        state: "PB",
        postalCode: "58000123",
      })
    ).toBe("");
  });

  it("monta endereço completo quando openHouse é true", () => {
    expect(
      composeAddress({
        openHouse: true,
        street: "Rua das Flores",
        addressNumber: "45",
        neighborhood: "Centro",
        city: "João Pessoa",
        state: "PB",
        postalCode: "58000123",
      })
    ).toBe("Rua das Flores, 45 · Centro · João Pessoa · PB · CEP 58000-123");
  });
});

// ---------------------------------------------------------------------------
// normalizePostalCode / formatPostalCode (regressão)
// ---------------------------------------------------------------------------
describe("postal code utils", () => {
  it("normaliza CEP removendo traço e pontos", () => {
    expect(normalizePostalCode("58.000-123")).toBe("58000123");
    expect(normalizePostalCode("58000-123")).toBe("58000123");
    expect(normalizePostalCode("58000123")).toBe("58000123");
  });

  it("formata CEP com 8 dígitos corretamente", () => {
    expect(formatPostalCode("58000123")).toBe("58000-123");
  });

  it("formata CEP parcial sem adicionar traço prematuro", () => {
    expect(formatPostalCode("5800")).toBe("5800");
    expect(formatPostalCode("58000")).toBe("58000");
  });
});
