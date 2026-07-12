import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/server/auth/session";
import type { AuthSession } from "@/server/domain/mvp";
import { listFollowups, listMembers, listSeeds, resetLocalMvpStore } from "@/server/repositories/mvp-repository";
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
      groups: Array<{ participants: Array<{ id: string }> }>;
    };
    expect(generatedDetail.outing.status).toBe("generated");
    expect(generatedDetail.groups.length).toBeGreaterThan(0);
    const coupleGroup = generatedDetail.groups.find((group) => group.participants.some((participant) => participant.id === outingMemberA.id));
    expect(coupleGroup?.participants.some((participant) => participant.id === outingMemberB.id)).toBe(true);

    const { POST: confirmRoute } = await import("@/app/api/outings/[outingId]/confirm/route");
    const confirmResponse = await confirmRoute(
      new Request(`http://localhost/api/outings/${createdOuting.id}/confirm`, { method: "POST" }),
      { params: Promise.resolve({ outingId: createdOuting.id }) },
    );

    expect(confirmResponse.status).toBe(200);
    const confirmedDetail = (await confirmResponse.json()) as { outing: { status: string } };
    expect(confirmedDetail.outing.status).toBe("confirmed");
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
});
