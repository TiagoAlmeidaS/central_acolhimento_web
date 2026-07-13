import { describe, expect, it } from "vitest";
import { formatParticipantAvailabilityMessage } from "@/ui/mvp/outing-manager-utils";

const tenant = {
  id: "1",
  name: "Central Sape",
  city: "Sape",
  state: "PB",
  status: "active" as const,
  coordinator: "Tiago",
};

describe("formatParticipantAvailabilityMessage", () => {
  it("returns an empty-state message for members", () => {
    expect(
      formatParticipantAvailabilityMessage({
        tenant,
        selectedType: "member",
        members: [],
        caregivers: [],
      }),
    ).toMatch(/Nenhum membro encontrado em Central Sape/i);
  });

  it("returns an empty-state message for caregivers", () => {
    expect(
      formatParticipantAvailabilityMessage({
        tenant,
        selectedType: "caregiver",
        members: [],
        caregivers: [],
      }),
    ).toMatch(/Nenhum cuidador encontrado em Central Sape/i);
  });

  it("returns a count message when members are available", () => {
    expect(
      formatParticipantAvailabilityMessage({
        tenant,
        selectedType: "member",
        members: [
          {
            id: "m-1",
            tenantId: "1",
            caregiverId: null,
            seedId: null,
            name: "Ana",
            age: null,
            phone: "",
            address: "",
            postalCode: "",
            street: "",
            neighborhood: "",
            addressNumber: "",
            state: "",
            city: "Sape",
            birthDate: null,
            status: "new",
            notes: "",
            latitude: null,
            longitude: null,
          },
        ],
        caregivers: [],
      }),
    ).toMatch(/1 membro\(s\) disponivel\(is\)/i);
  });
});
