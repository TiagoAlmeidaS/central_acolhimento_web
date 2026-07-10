import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/server/auth/session";
import type { AuthSession } from "@/server/domain/mvp";
import { listMembers, listSeeds, resetLocalMvpStore } from "@/server/repositories/mvp-repository";

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
});
