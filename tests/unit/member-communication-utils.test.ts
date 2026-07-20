import { describe, expect, it } from "vitest";
import type { Caregiver, Member } from "@/server/domain/mvp";
import {
  buildCaregiverContactMessage,
  groupSelectedMembersByCaregiver,
} from "@/ui/mvp/member-communication-utils";

function makeCaregiver(overrides: Partial<Caregiver>): Caregiver {
  return {
    id: "caregiver-1",
    tenantId: "tenant-1",
    tenantUserId: null,
    name: "Marta",
    phone: "(83) 99999-0000",
    email: null,
    active: true,
    notes: "",
    ...overrides,
  };
}

function makeMember(overrides: Partial<Member>): Member {
  return {
    id: "member-1",
    tenantId: "tenant-1",
    caregiverId: "caregiver-1",
    seedId: null,
    name: "Ana Souza",
    age: null,
    phone: "(83) 99999-1111",
    address: "",
    postalCode: "",
    street: "",
    neighborhood: "",
    addressNumber: "",
    state: "",
    city: "Sape",
    birthDate: null,
    status: "in_progress",
    notes: "",
    latitude: null,
    longitude: null,
    ...overrides,
  };
}

describe("member communication utils", () => {
  it("builds a caregiver contact message with selected member names and phones", () => {
    const message = buildCaregiverContactMessage("Marta", [
      makeMember({ id: "member-1", name: "Ana Souza", phone: "(83) 99999-1111" }),
      makeMember({ id: "member-2", name: "Carlos Lima", phone: "(83) 99999-2222" }),
    ]);

    expect(message).toContain("Ola, Marta! Tudo bem?");
    expect(message).toContain("Seguem os contatos das pessoas que estao sob o seu cuidado:");
    expect(message).toContain("- Ana Souza - (83) 99999-1111");
    expect(message).toContain("- Carlos Lima - (83) 99999-2222");
  });

  it("groups selected members by caregiver and excludes members without caregiver", () => {
    const caregivers = [
      makeCaregiver({ id: "caregiver-1", name: "Marta" }),
      makeCaregiver({ id: "caregiver-2", name: "Rute" }),
    ];
    const members = [
      makeMember({ id: "member-1", caregiverId: "caregiver-1", name: "Ana" }),
      makeMember({ id: "member-2", caregiverId: "caregiver-2", name: "Bia" }),
      makeMember({ id: "member-3", caregiverId: null, name: "Caio" }),
    ];

    const result = groupSelectedMembersByCaregiver(members, caregivers, ["member-1", "member-2", "member-3"]);

    expect(result.groups).toHaveLength(2);
    expect(result.groups.map((group) => group.caregiver.name)).toEqual(["Marta", "Rute"]);
    expect(result.membersWithoutCaregiver.map((member) => member.name)).toEqual(["Caio"]);
  });

  it("keeps members without phone in the message and returns a warning", () => {
    const result = groupSelectedMembersByCaregiver(
      [makeMember({ id: "member-1", phone: "" })],
      [makeCaregiver({ id: "caregiver-1" })],
      ["member-1"],
    );

    expect(result.groups[0]?.message).toContain("- Ana Souza - telefone nao informado");
    expect(result.groups[0]?.warnings).toContain("1 membro selecionado esta sem telefone.");
  });
});
