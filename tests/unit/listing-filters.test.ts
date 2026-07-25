import { describe, expect, it } from "vitest";
import { filterContacts, filterMembers, paginateItems } from "@/lib/listing-filters";
import type { Member, Seed } from "@/server/domain/mvp";

const contacts: Seed[] = [
  {
    id: "seed-1",
    tenantId: "1",
    caregiverId: "care-1",
    referenceName: "Ana Paula",
    age: 30,
    phone: "83999990001",
    city: "Sape",
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
    notes: "Contato feito pelo culto",
    firstContactAt: "2026-07-10",
    caregiver: "Maria",
    createdAt: "2026-07-10T10:00:00.000Z",
    latitude: null,
    longitude: null,
  },
  {
    id: "seed-2",
    tenantId: "2",
    caregiverId: null,
    referenceName: "Bruno Costa",
    age: null,
    phone: "",
    city: "Mamanguape",
    postalCode: "",
    openHouse: false,
    address: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "PB",
    houseFrontImageUrl: null,
    source: "",
    status: "contacted",
    notes: "Ligacao feita ontem",
    firstContactAt: "2026-07-12",
    caregiver: null,
    createdAt: "2026-07-12T10:00:00.000Z",
    latitude: null,
    longitude: null,
  },
];

const members: Member[] = [
  {
    id: "member-1",
    tenantId: "1",
    caregiverId: "care-1",
    seedId: null,
    name: "Carlos Lima",
    age: 42,
    phone: "83999990002",
    address: "",
    postalCode: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "PB",
    city: "Sape",
    birthDate: null,
    status: "in_progress",
    notes: "Precisa de retorno",
    caregiver: "Maria",
    lastContact: null,
    createdAt: "2026-07-09T10:00:00.000Z",
    latitude: null,
    longitude: null,
    spiritualTemperature: null,
  },
  {
    id: "member-2",
    tenantId: "2",
    caregiverId: null,
    seedId: null,
    name: "Daniela Rocha",
    age: 28,
    phone: "83999990003",
    address: "",
    postalCode: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "PB",
    city: "Mamanguape",
    birthDate: null,
    status: "new",
    notes: "Cadastro novo",
    caregiver: null,
    lastContact: null,
    createdAt: "2026-07-12T10:00:00.000Z",
    latitude: null,
    longitude: null,
    spiritualTemperature: null,
  },
];

describe("listing filters", () => {
  it("filters contacts by tenant, city and description", () => {
    const result = filterContacts(contacts, {
      tenantId: "2",
      city: "mamanguape",
      description: "ligacao",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("seed-2");
  });

  it("filters members by status and date range", () => {
    const result = filterMembers(members, {
      status: "new",
      dateFrom: "2026-07-11",
      dateTo: "2026-07-12",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("member-2");
  });

  it("paginates deterministically", () => {
    const result = paginateItems([1, 2, 3, 4, 5], 2, 2);
    expect(result.items).toEqual([3, 4]);
    expect(result.totalPages).toBe(3);
    expect(result.totalItems).toBe(5);
  });
});
