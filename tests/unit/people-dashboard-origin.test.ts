import { describe, expect, it } from "vitest";
import type { PeopleDashboardFilters, Seed, Tenant } from "@/server/domain/mvp";
import { buildPeopleCsv, summarizeContacts } from "@/server/domain/people-dashboard";

const REFERENCE_DATE = "2026-09-13";

const filters: PeopleDashboardFilters = {
  view: "contacts",
  period: "month",
  referenceDate: REFERENCE_DATE,
  state: "PB",
  city: null,
  tenantId: null,
  meetingTypeId: null,
};

const tenant: Tenant = {
  id: "tenant-1",
  name: "Sape",
  city: "Sapé",
  state: "PB",
  status: "active",
  coordinator: null,
};

function createSeed(overrides: Partial<Seed>): Seed {
  return {
    id: "seed-1",
    tenantId: "tenant-1",
    caregiverId: null,
    referenceName: "Contato",
    age: null,
    phone: "",
    city: "Sapé",
    postalCode: "",
    openHouse: false,
    address: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "PB",
    houseFrontImageUrl: null,
    source: "",
    status: "new",
    notes: "",
    firstContactAt: null,
    latitude: null,
    longitude: null,
    isUrgent: false,
    createdAt: `${REFERENCE_DATE}T12:00:00.000Z`,
    updatedAt: `${REFERENCE_DATE}T12:00:00.000Z`,
    ...overrides,
  };
}

function summarize(seeds: Seed[]) {
  return summarizeContacts(seeds, [], [tenant], [], filters);
}

describe("origem na lista de pessoas e na exportacao", () => {
  it("usa a taxonomia nova como fonte de verdade, com o detalhe quando houver", () => {
    const snapshot = summarize([
      createSeed({ id: "a", originChannel: "referral", originDetail: "Dona Maria", source: "" }),
      createSeed({ id: "b", originChannel: "church_service", originDetail: "", source: "" }),
    ]);

    const byId = new Map(snapshot.people.map((item) => [item.id, item.source]));
    expect(byId.get("a")).toBe("Indicação — Dona Maria");
    expect(byId.get("b")).toBe("Culto / Reunião");
  });

  it("nunca deixa a origem em branco quando o canal foi escolhido sem detalhe", () => {
    const snapshot = summarize([
      createSeed({ id: "a", originChannel: "whatsapp", originDetail: "", source: "" }),
    ]);

    expect(snapshot.people[0].source).toBe("WhatsApp");
    expect(buildPeopleCsv(snapshot).split("\n")[1]).toContain("WhatsApp");
  });

  it("cai no source legado so quando nao ha canal registrado", () => {
    const snapshot = summarize([
      createSeed({ id: "a", originChannel: "other", originDetail: "", source: "Saida Centro" }),
      createSeed({ id: "b", originDetail: "", source: "Cuidador" }),
      createSeed({ id: "c", originChannel: "other", originDetail: "", source: "" }),
    ]);

    const byId = new Map(snapshot.people.map((item) => [item.id, item.source]));
    expect(byId.get("a")).toBe("Saida Centro");
    expect(byId.get("b")).toBe("Cuidador");
    expect(byId.get("c")).toBe("Outro");
  });

  it("exporta a coluna origem com o rotulo da taxonomia", () => {
    const snapshot = summarize([
      createSeed({ id: "a", originChannel: "outing", originDetail: "Saída Centro", source: "" }),
    ]);
    const csv = buildPeopleCsv(snapshot);
    const header = csv.split("\n")[0].split(";");
    const row = csv.split("\n")[1].split(";");

    expect(row[header.indexOf("origem")]).toBe("Saída / Evangelismo — Saída Centro");
  });
});
