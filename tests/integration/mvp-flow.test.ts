import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/server/auth/session";
import type { AuthSession } from "@/server/domain/mvp";
import { listFollowups, listMembers, listSeeds, resetLocalMvpStore } from "@/server/repositories/mvp-repository";
import { resetLocalAuthStore } from "@/server/repositories/auth-repository";
import { resetLocalOutingsStore } from "@/server/repositories/outing-repository";
import { resetLocalTciStore } from "@/server/repositories/tci-repository";

const cookieState = {
  value: "" as string,
};

const cookieStore = {
  get(name: string) {
    if (name !== "central-acolhimento-session" || !cookieState.value) {
      return undefined;
    }

    return { name, value: cookieState.value };
  },
  set(name: string, value: string) {
    if (name === "central-acolhimento-session") {
      cookieState.value = value;
    }
  },
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

function setSession(session: AuthSession) {
  cookieState.value = createSessionToken(session);
}

describe("MVP integration flow", () => {
  beforeEach(() => {
    delete process.env.POSTGRES_URL_NON_POOLING;
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    resetLocalMvpStore();
    resetLocalAuthStore();
    resetLocalOutingsStore();
    resetLocalTciStore();
    cookieState.value = "";
  });

  it("returns only the selected tenant on the tenant API", async () => {
    setSession({
      user: { id: "user-1", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "tenant-user-1",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const { GET: getTenants } = await import("@/app/api/tenants/route");
    const response = await getTenants();
    const tenants = (await response.json()) as Array<{ id: string }>;

    expect(response.status).toBe(200);
    expect(tenants).toHaveLength(1);
    expect(tenants[0]?.id).toBe("1");
  });

  it("registers a new contact and converts it into a member inside the caregiver scope", async () => {
    setSession({
      user: { id: "user-2", email: "maria@igreja.org", firstName: "Maria", lastName: "Oliveira" },
      membership: {
        tenantUserId: "tenant-user-2",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "caregiver",
        caregiverId: "1",
      },
      homePath: "/cuidador",
    });

    const { POST: createContactRoute } = await import("@/app/api/seeds/route");
    const createResponse = await createContactRoute(
      new Request("http://localhost/api/seeds", {
        method: "POST",
        body: JSON.stringify({
          tenantId: "999",
          caregiverId: "999",
          referenceName: "Ester Nascimento",
          age: 34,
          phone: "(83) 98888-7777",
          city: "Sape",
          postalCode: "58240000",
          openHouse: true,
          street: "Rua do Acolhimento",
          neighborhood: "Centro",
          addressNumber: "120",
          state: "PB",
          source: "Mensagem no WhatsApp",
          notes: "Pediu oracao e aceitou retorno.",
          status: "new",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(createResponse.status).toBe(201);
    const createdContact = (await createResponse.json()) as {
      id: string;
      referenceName: string;
      age: number | null;
      tenantId: string;
      caregiverId: string | null;
      openHouse: boolean;
      postalCode: string;
      address: string;
    };
    expect(createdContact.referenceName).toBe("Ester Nascimento");
    expect(createdContact.age).toBe(34);
    expect(createdContact.tenantId).toBe("1");
    expect(createdContact.caregiverId).toBe("1");
    expect(createdContact.openHouse).toBe(true);
    expect(createdContact.postalCode).toBe("58240000");
    expect(createdContact.address).toContain("Rua do Acolhimento, 120");
    expect(createdContact.address).toContain("CEP 58240000");

    const { POST: convertContactRoute } = await import("@/app/api/seeds/[seedId]/convert/route");
    const convertResponse = await convertContactRoute(
      new Request(`http://localhost/api/seeds/${createdContact.id}/convert`, {
        method: "POST",
        body: JSON.stringify({ caregiverId: "999" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ seedId: createdContact.id }) }
    );

    expect(convertResponse.status).toBe(201);
    const member = (await convertResponse.json()) as {
      name: string;
      age: number | null;
      seedId: string | null;
      caregiverId: string | null;
      address: string;
    };
    const contacts = await listSeeds({ tenantId: "1", caregiverId: "1" });
    const members = await listMembers({ tenantId: "1", caregiverId: "1" });

    expect(member.name).toBe("Ester Nascimento");
    expect(member.age).toBe(34);
    expect(member.seedId).toBe(createdContact.id);
    expect(member.caregiverId).toBe("1");
    expect(member.address).toBe(createdContact.address);
    expect(contacts.find((contact) => contact.id === createdContact.id)?.status).toBe("in_progress");
    expect(members.some((item) => item.name === "Ester Nascimento")).toBe(true);
  });

  it("allows the coordinator to register a contact for another tenant linked to the same account", async () => {
    setSession({
      user: { id: "local-app-user-tiago", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "local-tenant-user-tiago-sape",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const { POST: createContactRoute } = await import("@/app/api/seeds/route");
    const createResponse = await createContactRoute(
      new Request("http://localhost/api/seeds", {
        method: "POST",
        body: JSON.stringify({
          tenantId: "2",
          caregiverId: null,
          referenceName: "Ana Clara",
          age: 29,
          phone: "(83) 97777-2222",
          city: "Mari",
          postalCode: "58345000",
          source: "Culto de domingo",
          notes: "Contato aberto para acompanhamento.",
          status: "new",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(createResponse.status).toBe(201);
    const createdContact = (await createResponse.json()) as {
      tenantId: string;
      city: string;
      referenceName: string;
    };

    expect(createdContact.tenantId).toBe("2");
    expect(createdContact.city).toBe("Mari");
    expect(createdContact.referenceName).toBe("Ana Clara");

    const contactsOnSecondTenant = await listSeeds({ tenantId: "2" });
    expect(contactsOnSecondTenant.some((contact) => contact.referenceName === "Ana Clara")).toBe(true);
  });

  it("returns paginated contacts filtered by tenant and description on the seeds API", async () => {
    setSession({
      user: { id: "local-app-user-tiago", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "local-tenant-user-tiago-sape",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const { POST: createContactRoute, GET: getContactsRoute } = await import("@/app/api/seeds/route");
    await createContactRoute(
      new Request("http://localhost/api/seeds", {
        method: "POST",
        body: JSON.stringify({
          tenantId: "2",
          caregiverId: null,
          referenceName: "Contato filtrado",
          age: 41,
          phone: "(83) 96666-1111",
          city: "Mari",
          postalCode: "58345000",
          source: "Visita",
          notes: "descricao chave",
          status: "contacted",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );

    const response = await getContactsRoute(
      new Request("http://localhost/api/seeds?tenantId=2&description=chave&page=1&pageSize=10")
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      items: Array<{ tenantId: string; referenceName: string }>;
      totalItems: number;
      totalPages: number;
      page: number;
    };

    expect(payload.page).toBe(1);
    expect(payload.totalItems).toBe(1);
    expect(payload.totalPages).toBe(1);
    expect(payload.items[0]?.tenantId).toBe("2");
    expect(payload.items[0]?.referenceName).toBe("Contato filtrado");
  });

  it("lets the coordinator assign a caregiver and record a followup inside the current tenant", async () => {
    setSession({
      user: { id: "user-1", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "tenant-user-1",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const members = await listMembers({ tenantId: "1" });
    const targetMember = members[0];

    const { POST: assignCaregiverRoute } = await import("@/app/api/members/[memberId]/assign-caregiver/route");
    const assignResponse = await assignCaregiverRoute(
      new Request(`http://localhost/api/members/${targetMember.id}/assign-caregiver`, {
        method: "POST",
        body: JSON.stringify({ caregiverId: "1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ memberId: targetMember.id }) }
    );

    expect(assignResponse.status).toBe(200);
    const assignedMember = (await assignResponse.json()) as { caregiverId: string | null };
    expect(assignedMember.caregiverId).toBe("1");

    const { PATCH: updateStatusRoute } = await import("@/app/api/members/[memberId]/status/route");
    const updateStatusResponse = await updateStatusRoute(
      new Request(`http://localhost/api/members/${targetMember.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "consolidated" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ memberId: targetMember.id }) }
    );

    expect(updateStatusResponse.status).toBe(200);
    const updatedMember = (await updateStatusResponse.json()) as { status: string };
    expect(updatedMember.status).toBe("consolidated");

    const refreshedMembers = await listMembers({ tenantId: "1" });
    expect(refreshedMembers.find((item) => item.id === targetMember.id)?.status).toBe("consolidated");

    const { POST: createFollowupRoute } = await import("@/app/api/followups/route");
    const followupResponse = await createFollowupRoute(
      new Request("http://localhost/api/followups", {
        method: "POST",
        body: JSON.stringify({
          tenantId: "1",
          memberId: targetMember.id,
          caregiverId: "1",
          type: "call",
          notes: "Contato feito e proxima visita agendada.",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(followupResponse.status).toBe(201);
    const followup = (await followupResponse.json()) as { memberId: string; caregiverId: string | null; tenantId: string; type: string };
    expect(followup.memberId).toBe(targetMember.id);
    expect(followup.caregiverId).toBe("1");
    expect(followup.tenantId).toBe("1");
    expect(followup.type).toBe("call");
  });

  it("returns paginated members filtered by status on the members API", async () => {
    setSession({
      user: { id: "user-1", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "tenant-user-1",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const { GET: getMembersRoute } = await import("@/app/api/members/route");
    const response = await getMembersRoute(
      new Request("http://localhost/api/members?status=in_progress&page=1&pageSize=5")
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      items: Array<{ status: string }>;
      totalItems: number;
      totalPages: number;
      pageSize: number;
    };

    expect(payload.pageSize).toBe(5);
    expect(payload.totalItems).toBeGreaterThan(0);
    expect(payload.totalPages).toBeGreaterThan(0);
    expect(payload.items.every((item) => item.status === "in_progress")).toBe(true);
  });

  it("exports filtered members as CSV", async () => {
    setSession({
      user: { id: "user-1", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "tenant-user-1",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const { GET: exportMembersRoute } = await import("@/app/api/members/export/route");
    const response = await exportMembersRoute(
      new Request("http://localhost/api/members/export?status=in_progress&tenantId=1"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("membros-");

    const csv = await response.text();
    const lines = csv.trim().split("\n");

    expect(lines[0]).toContain("id;nome;idade;telefone;status");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.slice(1).every((line) => line.includes("in_progress"))).toBe(true);
  });

  it("deletes a contact inside the current tenant scope", async () => {
    setSession({
      user: { id: "user-1", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "tenant-user-1",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const contactsBefore = await listSeeds({ tenantId: "1" });
    const targetContact = contactsBefore[0];
    expect(targetContact).toBeDefined();

    const { DELETE: deleteSeedRoute } = await import("@/app/api/seeds/[seedId]/route");
    const response = await deleteSeedRoute(new Request(`http://localhost/api/seeds/${targetContact.id}`, {
      method: "DELETE",
    }), { params: Promise.resolve({ seedId: targetContact.id }) });

    expect(response.status).toBe(204);
    const contactsAfter = await listSeeds({ tenantId: "1" });
    expect(contactsAfter.some((item) => item.id === targetContact.id)).toBe(false);
  });

  it("deletes a member and removes related followups", async () => {
    setSession({
      user: { id: "user-1", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "tenant-user-1",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const membersBefore = await listMembers({ tenantId: "1" });
    const targetMember = membersBefore[0];
    expect(targetMember).toBeDefined();

    const { POST: createFollowupRoute } = await import("@/app/api/followups/route");
    const followupResponse = await createFollowupRoute(
      new Request("http://localhost/api/followups", {
        method: "POST",
        body: JSON.stringify({
          tenantId: "1",
          memberId: targetMember.id,
          caregiverId: targetMember.caregiverId,
          type: "call",
          notes: "Registro antes da exclusao.",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(followupResponse.status).toBe(201);

    const followupsBeforeDelete = await listFollowups({ tenantId: "1" });
    expect(followupsBeforeDelete.some((item) => item.memberId === targetMember.id)).toBe(true);

    const { DELETE: deleteMemberRoute } = await import("@/app/api/members/[memberId]/route");
    const deleteResponse = await deleteMemberRoute(
      new Request(`http://localhost/api/members/${targetMember.id}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ memberId: targetMember.id }) }
    );

    expect(deleteResponse.status).toBe(204);

    const membersAfter = await listMembers({ tenantId: "1" });
    const followupsAfter = await listFollowups({ tenantId: "1" });
    expect(membersAfter.some((item) => item.id === targetMember.id)).toBe(false);
    expect(followupsAfter.some((item) => item.memberId === targetMember.id)).toBe(false);
  });

  it("creates an outing, adds registered and guest participants, creates a couple constraint, generates and confirms groups", async () => {
    setSession({
      user: { id: "local-app-user-tiago", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "local-tenant-user-tiago-sape",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const members = await listMembers({ tenantId: "1" });
    const targetMembers = members.slice(0, 2);
    expect(targetMembers).toHaveLength(2);

    const { POST: createOutingTypeRoute } = await import("@/app/api/outings/types/route");
    const typeResponse = await createOutingTypeRoute(new Request("http://localhost/api/outings/types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: "1", name: "Adolescentes" }),
    }));
    expect(typeResponse.status).toBe(201);
    const outingType = (await typeResponse.json()) as { id: string };

    const { POST: createOutingRoute } = await import("@/app/api/outings/route");
    const createOutingResponse = await createOutingRoute(
      new Request("http://localhost/api/outings", {
        method: "POST",
        body: JSON.stringify({
          tenantId: "1",
          name: "Saida social de domingo",
          description: "Teste de distribuicao",
          targetGroupSize: 4,
          allowGroupsWithoutCar: false,
          outingTypeId: outingType.id,
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(createOutingResponse.status).toBe(201);
    const createdOuting = (await createOutingResponse.json()) as { id: string; status: string };
    expect(createdOuting.status).toBe("draft");

    const { POST: addParticipantsRoute } = await import("@/app/api/outings/[outingId]/participants/route");
    const caregiverParticipantResponse = await addParticipantsRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/participants`, {
        method: "POST",
        body: JSON.stringify({
          participantType: "caregiver",
          participantId: "1",
          hasCar: true,
          isDriver: true,
          carSeats: 3,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );
    expect(caregiverParticipantResponse.status).toBe(201);

    const memberParticipantAResponse = await addParticipantsRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/participants`, {
        method: "POST",
        body: JSON.stringify({
          participantType: "member",
          participantId: targetMembers[0]?.id,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );
    expect(memberParticipantAResponse.status).toBe(201);
    const outingMemberA = (await memberParticipantAResponse.json()) as { id: string };

    const memberParticipantBResponse = await addParticipantsRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/participants`, {
        method: "POST",
        body: JSON.stringify({
          participantType: "member",
          participantId: targetMembers[1]?.id,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );
    expect(memberParticipantBResponse.status).toBe(201);
    const outingMemberB = (await memberParticipantBResponse.json()) as { id: string };

    const guestParticipantResponse = await addParticipantsRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/participants`, {
        method: "POST",
        body: JSON.stringify({
          participantType: "guest",
          firstName: "Paulo",
          lastName: "Convidado",
          phone: "(83) 99999-1111",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );
    expect(guestParticipantResponse.status).toBe(201);

    const { POST: createConstraintRoute } = await import("@/app/api/outings/[outingId]/constraints/route");
    const createConstraintResponse = await createConstraintRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/constraints`, {
        method: "POST",
        body: JSON.stringify({
          label: "Casal prioritario",
          participantIds: [outingMemberA.id, outingMemberB.id],
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );
    expect(createConstraintResponse.status).toBe(201);

    const { POST: generateRoute } = await import("@/app/api/outings/[outingId]/generate/route");
    const generateResponse = await generateRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/generate`, { method: "POST" }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );

    expect(generateResponse.status).toBe(200);
    const generatedDetail = (await generateResponse.json()) as {
      outing: { status: string };
      groups: Array<{ name: string; driverParticipantId: string | null; participants: Array<{ id: string }> }>;
    };
    expect(generatedDetail.outing.status).toBe("generated");
    expect(generatedDetail.groups.length).toBeGreaterThan(0);
    const coupleGroup = generatedDetail.groups.find((group) => group.participants.some((participant) => participant.id === outingMemberA.id));
    expect(coupleGroup?.participants.some((participant) => participant.id === outingMemberB.id)).toBe(true);

    const { PUT: saveManualGroupsRoute } = await import("@/app/api/outings/[outingId]/groups/route");
    const manualGroups = generatedDetail.groups.map((group) => ({
      name: group.name,
      driverParticipantId: group.driverParticipantId,
      participantIds: group.participants.map((participant) => participant.id),
    }));
    const addFreeGroupResponse = await saveManualGroupsRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/groups`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: [...manualGroups, { name: "Grupo livre", driverParticipantId: null, participantIds: [] }] }),
      }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );
    expect(addFreeGroupResponse.status).toBe(200);
    expect(((await addFreeGroupResponse.json()) as { groups: unknown[] }).groups).toHaveLength(manualGroups.length + 1);

    const restoreManualGroupsResponse = await saveManualGroupsRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/groups`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: manualGroups }),
      }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );
    expect(restoreManualGroupsResponse.status).toBe(200);
    expect(((await restoreManualGroupsResponse.json()) as { groups: Array<{ assignedBy: string }> }).groups.every((group) => group.assignedBy === "manual")).toBe(true);

    const { POST: confirmRoute } = await import("@/app/api/outings/[outingId]/confirm/route");
    const confirmResponse = await confirmRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/confirm`, { method: "POST" }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );

    expect(confirmResponse.status).toBe(200);
    const confirmedDetail = (await confirmResponse.json()) as { outing: { status: string } };
    expect(confirmedDetail.outing.status).toBe("confirmed");

    const { POST: completeRoute } = await import("@/app/api/outings/[outingId]/complete/route");
    const completedResponse = await completeRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/complete`, { method: "POST" }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );
    expect(completedResponse.status).toBe(200);
    const completed = (await completedResponse.json()) as { completedAt: string };
    expect(completed.completedAt).toBeTruthy();

    const completedAgainResponse = await completeRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/complete`, { method: "POST" }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );
    expect((await completedAgainResponse.json() as { completedAt: string }).completedAt).toBe(completed.completedAt);

    const { POST: createSeedRoute } = await import("@/app/api/seeds/route");
    const seedResponse = await createSeedRoute(new Request("http://localhost/api/seeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: "1",
        referenceName: "Contato adolescente",
        age: 15,
        city: "Sape",
        openHouse: true,
        address: "Rua do Relatorio, 10",
        latitude: -7.09,
        longitude: -35.23,
        outingEventId: createdOuting.id,
      }),
    }));
    expect(seedResponse.status).toBe(201);

    const reportDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const { GET: reportRoute } = await import("@/app/api/reports/outings/daily/route");
    const reportResponse = await reportRoute(new Request(`http://localhost/api/reports/outings/daily?tenantId=1&date=${reportDate}`));
    expect(reportResponse.status).toBe(200);
    const report = (await reportResponse.json()) as { totals: { completedOutings: number; newContacts: number; adolescents: number; openHouses: number }; byType: Array<{ name: string }> };
    expect(report.totals).toMatchObject({ completedOutings: 1, newContacts: 1, adolescents: 1, openHouses: 1 });
    expect(report.byType[0]?.name).toBe("Adolescentes");
  });

  it("protects daily outing reports and execution against invalid state, role and tenant", async () => {
    const coordinatorSession: AuthSession = {
      user: { id: "isolated-coordinator", email: "isolated@igreja.org", firstName: "Coord", lastName: "Local" },
      membership: {
        tenantUserId: "isolated-tenant-user",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    };
    setSession(coordinatorSession);

    const { GET: reportRoute } = await import("@/app/api/reports/outings/daily/route");
    expect((await reportRoute(new Request("http://localhost/api/reports/outings/daily?tenantId=1&date=15-08-2026"))).status).toBe(400);
    expect((await reportRoute(new Request("http://localhost/api/reports/outings/daily?tenantId=2&date=2026-08-15"))).status).toBe(403);

    setSession({
      ...coordinatorSession,
      user: { id: "caregiver-user", email: "caregiver@igreja.org", firstName: "Care", lastName: "Giver" },
      membership: { ...coordinatorSession.membership, role: "caregiver", caregiverId: "1" },
      homePath: "/cuidador",
    });
    expect((await reportRoute(new Request("http://localhost/api/reports/outings/daily?tenantId=1&date=2026-08-15"))).status).toBe(403);

    setSession(coordinatorSession);
    const { POST: createType } = await import("@/app/api/outings/types/route");
    const typeResponse = await createType(new Request("http://localhost/api/outings/types", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: "1", name: "TCI" }),
    }));
    const outingType = (await typeResponse.json()) as { id: string };
    const { POST: createOuting } = await import("@/app/api/outings/route");
    const outingResponse = await createOuting(new Request("http://localhost/api/outings", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: "1", name: "Saida em rascunho", outingTypeId: outingType.id }),
    }));
    const outing = (await outingResponse.json()) as { id: string };
    const { POST: completeOuting } = await import("@/app/api/outings/[outingId]/complete/route");
    const invalidCompletion = await completeOuting(
      new Request(`http://localhost/api/outings/${outing.id}/complete`, { method: "POST" }),
      { params: Promise.resolve({ outingId: outing.id }) },
    );
    expect(invalidCompletion.status).toBe(400);
    expect(await invalidCompletion.json()).toMatchObject({ error: expect.stringMatching(/confirmada/i) });

    setSession({
      ...coordinatorSession,
      user: { id: "local-app-user-tiago", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Almeida" },
      membership: { ...coordinatorSession.membership, tenantUserId: "local-tenant-user-tiago-sape" },
    });
    const { POST: createSeedRoute } = await import("@/app/api/seeds/route");
    const crossTenantContact = await createSeedRoute(new Request("http://localhost/api/seeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: "2", referenceName: "Contato invalido", outingEventId: outing.id }),
    }));
    expect(crossTenantContact.status).toBe(403);
  });

  it("creates TCI chambers and sessions, lists the weekly agenda and blocks chamber conflicts", async () => {
    setSession({
      user: { id: "local-app-user-tiago", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Souza" },
      membership: {
        tenantUserId: "local-tenant-user-tiago-sape",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const { POST: createChamberRoute } = await import("@/app/api/tci/chambers/route");
    const chamberResponse = await createChamberRoute(
      new Request("http://localhost/api/tci/chambers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "1",
          name: "Camara Azul",
          description: "Principal",
          capacity: 8,
          active: true,
        }),
      }),
    );

    expect(chamberResponse.status).toBe(201);
    const chamber = (await chamberResponse.json()) as { id: string; name: string };
    expect(chamber.name).toBe("Camara Azul");

    const { POST: createSessionRoute, GET: listSessionsRoute } = await import("@/app/api/tci/sessions/route");
    const sessionResponse = await createSessionRoute(
      new Request("http://localhost/api/tci/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "1",
          title: "TCI Quarta",
          scheduledDate: "2026-07-13",
          startsAt: "09:00",
          endsAt: "10:00",
          chamberId: chamber.id,
          caregiverIds: ["1"],
          notes: "Sessao semanal",
          status: "scheduled",
        }),
      }),
    );

    expect(sessionResponse.status).toBe(201);
    const createdSession = (await sessionResponse.json()) as { id: string; title: string; caregivers: Array<{ caregiverId: string }> };
    expect(createdSession.title).toBe("TCI Quarta");
    expect(createdSession.caregivers[0]?.caregiverId).toBe("1");

    const listResponse = await listSessionsRoute(
      new Request("http://localhost/api/tci/sessions?weekStart=2026-07-13"),
    );
    expect(listResponse.status).toBe(200);
    const listedSessions = (await listResponse.json()) as Array<{ id: string }>;
    expect(listedSessions.some((item) => item.id === createdSession.id)).toBe(true);

    const conflictResponse = await createSessionRoute(
      new Request("http://localhost/api/tci/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "1",
          title: "TCI Conflitante",
          scheduledDate: "2026-07-13",
          startsAt: "09:30",
          endsAt: "10:30",
          chamberId: chamber.id,
          caregiverIds: ["1"],
        }),
      }),
    );

    expect(conflictResponse.status).toBe(500);
    const conflictPayload = (await conflictResponse.json()) as { error?: string };
    expect(conflictPayload.error).toMatch(/conflito/i);

    const { PATCH: updateStatusRoute } = await import("@/app/api/tci/sessions/[sessionId]/status/route");
    const statusResponse = await updateStatusRoute(
      new Request(`http://localhost/api/tci/sessions/${createdSession.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      }),
      { params: Promise.resolve({ sessionId: createdSession.id }) },
    );

    expect(statusResponse.status).toBe(200);
    const updatedSession = (await statusResponse.json()) as { status: string };
    expect(updatedSession.status).toBe("completed");
  });

  it("loads and updates the coordinator profile and refreshes the session cookie data", async () => {
    setSession({
      user: { id: "local-app-user-tiago", email: "tiago@igreja.org", firstName: "Tiago", lastName: "Almeida" },
      membership: {
        tenantUserId: "local-tenant-user-tiago-sape",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "coordinator",
        caregiverId: null,
      },
      homePath: "/coord",
    });

    const { GET: getProfileRoute, PUT: updateProfileRoute } = await import("@/app/api/profile/route");

    const getResponse = await getProfileRoute();
    expect(getResponse.status).toBe(200);
    const profile = (await getResponse.json()) as { firstName: string; role: string; tenantName: string };
    expect(profile.firstName).toBe("Tiago");
    expect(profile.role).toBe("coordinator");
    expect(profile.tenantName).toBe("Central Sape");

    const updateResponse = await updateProfileRoute(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Tiago",
          lastName: "Souza",
          phone: "(83) 98888-0001",
        }),
      }),
    );

    expect(updateResponse.status).toBe(200);
    const updatedProfile = (await updateResponse.json()) as { fullName: string; phone: string };
    expect(updatedProfile.fullName).toBe("Tiago Souza");
    expect(updatedProfile.phone).toBe("(83) 98888-0001");

    const { GET: getSessionRoute } = await import("@/app/api/auth/session/route");
    const sessionResponse = await getSessionRoute();
    const sessionPayload = (await sessionResponse.json()) as { session: AuthSession };
    expect(sessionPayload.session.user.lastName).toBe("Souza");
  });

  it("loads caregiver profile with operational block and allows password change", async () => {
    setSession({
      user: { id: "local-app-user-maria", email: "maria@igreja.org", firstName: "Maria", lastName: "Oliveira" },
      membership: {
        tenantUserId: "local-tenant-user-maria-sape",
        tenantId: "1",
        tenantName: "Central Sape",
        tenantCity: "Sape",
        tenantState: "PB",
        role: "caregiver",
        caregiverId: "1",
      },
      homePath: "/cuidador",
    });

    const { GET: getProfileRoute } = await import("@/app/api/profile/route");
    const profileResponse = await getProfileRoute();
    expect(profileResponse.status).toBe(200);
    const profile = (await profileResponse.json()) as { caregiver: { caregiverId: string; name: string } | null };
    expect(profile.caregiver?.caregiverId).toBe("1");
    expect(profile.caregiver?.name).toBeTruthy();

    const { PATCH: patchPasswordRoute } = await import("@/app/api/profile/password/route");
    const passwordResponse = await patchPasswordRoute(
      new Request("http://localhost/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "12345678",
          newPassword: "novaSenha123",
        }),
      }),
    );

    expect(passwordResponse.status).toBe(200);

    const invalidPasswordResponse = await patchPasswordRoute(
      new Request("http://localhost/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "senhaErrada",
          newPassword: "outraSenha123",
        }),
      }),
    );

    expect(invalidPasswordResponse.status).toBe(500);
    const invalidPayload = (await invalidPasswordResponse.json()) as { error?: string };
    expect(invalidPayload.error).toMatch(/senha atual invalida/i);
  });
});
