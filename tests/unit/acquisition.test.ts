import { describe, expect, it } from "vitest";
import type { Seed } from "@/server/domain/mvp";
import {
  ACQUISITION_UNKNOWN_REGISTRAR_KEY,
  summarizeAcquisition,
} from "@/server/domain/acquisition";

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

describe("summarizeAcquisition", () => {
  it("devolve resumo vazio quando o periodo nao tem contatos", () => {
    const summary = summarizeAcquisition([]);

    expect(summary.total).toBe(0);
    expect(summary.channels).toEqual([]);
    expect(summary.topChannel).toBeNull();
    expect(summary.registrars).toEqual([]);
    expect(summary.withoutOriginChannel).toBe(0);
    expect(summary.withoutCaregiver).toBe(0);
    expect(summary.firstContactCount).toBe(0);
    expect(summary.firstContactRate).toBeNull();
  });

  it("agrupa por canal, ordena por volume e usa os rotulos da taxonomia", () => {
    const summary = summarizeAcquisition([
      createSeed({ id: "a", originChannel: "outing" }),
      createSeed({ id: "b", originChannel: "outing" }),
      createSeed({ id: "c", originChannel: "referral" }),
      createSeed({ id: "d", originChannel: "church_service" }),
    ]);

    expect(summary.total).toBe(4);
    expect(summary.channels.map((item) => item.channel)).toEqual(["outing", "referral", "church_service"]);
    expect(summary.channels[0]).toMatchObject({ count: 2, label: "Saída / Evangelismo" });
    expect(summary.topChannel?.channel).toBe("outing");
    expect(summary.topChannel?.count).toBe(2);
  });

  it("calcula o percentual de cada canal sobre o total do recorte", () => {
    const summary = summarizeAcquisition([
      createSeed({ id: "a", originChannel: "outing" }),
      createSeed({ id: "b", originChannel: "outing" }),
      createSeed({ id: "c", originChannel: "whatsapp" }),
      createSeed({ id: "d", originChannel: "whatsapp" }),
      createSeed({ id: "e", originChannel: "referral" }),
    ]);

    expect(summary.channels.map((item) => item.percent)).toEqual([40, 40, 20]);
  });

  it("conta como fila de reclassificacao tanto o canal 'other' quanto o canal ausente", () => {
    const summary = summarizeAcquisition([
      createSeed({ id: "a", originChannel: "other" }),
      createSeed({ id: "b" }),
      createSeed({ id: "c", originChannel: "outing" }),
    ]);

    expect(summary.withoutOriginChannel).toBe(2);
    expect(summary.channels.find((item) => item.channel === "other")?.count).toBe(2);
    expect(summary.topChannel?.channel).toBe("other");
  });

  it("mede o primeiro contato e a fila sem cuidador entre os novos", () => {
    const summary = summarizeAcquisition([
      createSeed({ id: "a", firstContactAt: "2026-09-10T12:00:00.000Z", caregiverId: "care-1" }),
      createSeed({ id: "b", firstContactAt: "2026-09-11T12:00:00.000Z" }),
      createSeed({ id: "c" }),
      createSeed({ id: "d" }),
    ]);

    expect(summary.firstContactCount).toBe(2);
    expect(summary.firstContactRate).toBe(50);
    expect(summary.withoutCaregiver).toBe(3);
  });

  it("mantem visivel o grupo sem autoria registrada em vez de esconder a linha", () => {
    const summary = summarizeAcquisition([
      createSeed({ id: "a", registeredByTenantUserId: "user-1" }),
      createSeed({ id: "b", registeredByTenantUserId: "user-1" }),
      createSeed({ id: "c", registeredByTenantUserId: null }),
      createSeed({ id: "d" }),
      createSeed({ id: "e" }),
      createSeed({ id: "f" }),
    ]);

    expect(summary.registrars).toEqual([
      { key: ACQUISITION_UNKNOWN_REGISTRAR_KEY, tenantUserId: null, count: 4, percent: 67 },
      { key: "user-1", tenantUserId: "user-1", count: 2, percent: 33 },
    ]);
  });
});
