import { describe, expect, it } from "vitest";
import {
  ESTADOS_BRASIL,
  CIDADES_POR_ESTADO,
  ALL_CIDADES,
  getCidadesByEstado,
} from "@/lib/br-locations";

// ---------------------------------------------------------------------------
// ESTADOS_BRASIL
// ---------------------------------------------------------------------------
describe("ESTADOS_BRASIL", () => {
  it("contém exatamente os 27 estados brasileiros", () => {
    expect(ESTADOS_BRASIL).toHaveLength(27);
  });

  it("inclui todas as UFs esperadas", () => {
    const esperados = [
      "AC", "AL", "AP", "AM", "BA", "CE", "DF",
      "ES", "GO", "MA", "MT", "MS", "MG", "PA",
      "PB", "PR", "PE", "PI", "RJ", "RN", "RS",
      "RO", "RR", "SC", "SP", "SE", "TO",
    ];
    for (const uf of esperados) {
      expect(ESTADOS_BRASIL).toContain(uf);
    }
  });

  it("não contém valores duplicados", () => {
    expect(new Set(ESTADOS_BRASIL).size).toBe(ESTADOS_BRASIL.length);
  });

  it("cada UF tem exatamente 2 caracteres maiúsculos", () => {
    for (const uf of ESTADOS_BRASIL) {
      expect(uf).toMatch(/^[A-Z]{2}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// CIDADES_POR_ESTADO
// ---------------------------------------------------------------------------
describe("CIDADES_POR_ESTADO", () => {
  it("possui entradas para todos os 27 estados", () => {
    for (const uf of ESTADOS_BRASIL) {
      expect(CIDADES_POR_ESTADO[uf]).toBeDefined();
      expect(CIDADES_POR_ESTADO[uf].length).toBeGreaterThan(0);
    }
  });

  it("PB contém as cidades operacionais da Central", () => {
    const cidadesPB = CIDADES_POR_ESTADO["PB"];
    const operacionais = ["Sapé", "Mari", "João Pessoa", "Campina Grande", "Guarabira"];
    for (const cidade of operacionais) {
      expect(cidadesPB).toContain(cidade);
    }
  });

  it("SP contém São Paulo e outras grandes cidades", () => {
    const cidadesSP = CIDADES_POR_ESTADO["SP"];
    expect(cidadesSP).toContain("São Paulo");
    expect(cidadesSP).toContain("Campinas");
    expect(cidadesSP).toContain("Guarulhos");
  });

  it("contém a capital de cada estado", () => {
    const capitais: Record<string, string> = {
      AC: "Rio Branco", AL: "Maceió", AP: "Macapá", AM: "Manaus",
      BA: "Salvador", CE: "Fortaleza", DF: "Brasília", ES: "Vitória",
      GO: "Goiânia", MA: "São Luís", MT: "Cuiabá", MS: "Campo Grande",
      MG: "Belo Horizonte", PA: "Belém", PB: "João Pessoa", PR: "Curitiba",
      PE: "Recife", PI: "Teresina", RJ: "Rio de Janeiro", RN: "Natal",
      RS: "Porto Alegre", RO: "Porto Velho", RR: "Boa Vista",
      SC: "Florianópolis", SP: "São Paulo", SE: "Aracaju", TO: "Palmas",
    };
    for (const [uf, capital] of Object.entries(capitais)) {
      expect(CIDADES_POR_ESTADO[uf]).toContain(capital);
    }
  });

  it("não possui cidades duplicadas dentro de um estado", () => {
    for (const [uf, cidades] of Object.entries(CIDADES_POR_ESTADO)) {
      const uniq = new Set(cidades);
      expect(uniq.size).toBe(cidades.length);
    }
  });
});

// ---------------------------------------------------------------------------
// ALL_CIDADES
// ---------------------------------------------------------------------------
describe("ALL_CIDADES", () => {
  it("contém todas as cidades de todos os estados", () => {
    const totalEsperado = Object.values(CIDADES_POR_ESTADO).flat().length;
    expect(ALL_CIDADES).toHaveLength(totalEsperado);
  });

  it("está ordenada alfabeticamente (pt-BR)", () => {
    const ordenada = [...ALL_CIDADES].sort((a, b) => a.localeCompare(b, "pt-BR"));
    expect(ALL_CIDADES).toEqual(ordenada);
  });

  it("contém João Pessoa e São Paulo", () => {
    expect(ALL_CIDADES).toContain("João Pessoa");
    expect(ALL_CIDADES).toContain("São Paulo");
  });
});

// ---------------------------------------------------------------------------
// getCidadesByEstado
// ---------------------------------------------------------------------------
describe("getCidadesByEstado", () => {
  it("retorna cidades do estado informado", () => {
    const cidades = getCidadesByEstado("PB");
    expect(cidades).toContain("João Pessoa");
    expect(cidades).toContain("Sapé");
  });

  it("retorna ALL_CIDADES quando estado está vazio", () => {
    expect(getCidadesByEstado("")).toBe(ALL_CIDADES);
  });

  it("retorna ALL_CIDADES quando estado não tem mapeamento", () => {
    expect(getCidadesByEstado("ZZ")).toBe(ALL_CIDADES);
  });

  it("filtra corretamente — cidades de SP não aparecem em PB", () => {
    const cidades = getCidadesByEstado("PB");
    expect(cidades).not.toContain("São Paulo");
    expect(cidades).not.toContain("Campinas");
  });

  it("funciona para todos os 27 estados sem lançar erro", () => {
    for (const uf of ESTADOS_BRASIL) {
      const cidades = getCidadesByEstado(uf);
      expect(Array.isArray(cidades)).toBe(true);
      expect(cidades.length).toBeGreaterThan(0);
    }
  });

  it("ao mudar de estado, a cidade anterior pode não estar disponível", () => {
    const cidadesSP = getCidadesByEstado("SP");
    const cidadesPB = getCidadesByEstado("PB");
    // São Paulo não é cidade da PB
    expect(cidadesPB).not.toContain("São Paulo");
    // Sapé não é cidade de SP
    expect(cidadesSP).not.toContain("Sapé");
  });
});
