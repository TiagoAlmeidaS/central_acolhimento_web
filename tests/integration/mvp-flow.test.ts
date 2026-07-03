import { beforeEach, describe, expect, it } from "vitest";
import { POST as createTenantRoute } from "@/app/api/tenants/route";
import { POST as createContactRoute } from "@/app/api/seeds/route";
import { POST as convertContactRoute } from "@/app/api/seeds/[seedId]/convert/route";
import { POST as assignCaregiverRoute } from "@/app/api/members/[memberId]/assign-caregiver/route";
import { POST as createFollowupRoute } from "@/app/api/followups/route";
import { listMembers, listSeeds, listTenants, resetLocalMvpStore } from "@/server/repositories/mvp-repository";

describe("MVP integration flow", () => {
  beforeEach(() => {
    delete process.env.POSTGRES_URL_NON_POOLING;
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    resetLocalMvpStore();
  });

  it("creates a tenant through the API", async () => {
    const response = await createTenantRoute(
      new Request("http://localhost/api/tenants", {
        method: "POST",
        body: JSON.stringify({
          name: "Central Cruz do Espirito Santo",
          city: "Cruz do Espirito Santo",
          state: "PB",
          status: "active",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(response.status).toBe(201);
    const payload = (await response.json()) as { name: string };
    const tenants = await listTenants();

    expect(payload.name).toBe("Central Cruz do Espirito Santo");
    expect(tenants.some((tenant) => tenant.name === "Central Cruz do Espirito Santo")).toBe(true);
  });

  it("registers a new contact and converts it into a member", async () => {
    const createResponse = await createContactRoute(
      new Request("http://localhost/api/seeds", {
        method: "POST",
        body: JSON.stringify({
          tenantId: "1",
          caregiverId: "1",
          referenceName: "Ester Nascimento",
          phone: "(83) 98888-7777",
          city: "Sape",
          source: "Mensagem no WhatsApp",
          notes: "Pediu oracao e aceitou retorno.",
          status: "new",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(createResponse.status).toBe(201);
    const createdContact = (await createResponse.json()) as { id: string; referenceName: string };
    expect(createdContact.referenceName).toBe("Ester Nascimento");

    const convertResponse = await convertContactRoute(
      new Request(`http://localhost/api/seeds/${createdContact.id}/convert`, {
        method: "POST",
        body: JSON.stringify({ caregiverId: "1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ seedId: createdContact.id }) }
    );

    expect(convertResponse.status).toBe(201);
    const member = (await convertResponse.json()) as { name: string; seedId: string | null };
    const contacts = await listSeeds();
    const members = await listMembers();

    expect(member.name).toBe("Ester Nascimento");
    expect(member.seedId).toBe(createdContact.id);
    expect(contacts.find((contact) => contact.id === createdContact.id)?.status).toBe("in_progress");
    expect(members.some((item) => item.name === "Ester Nascimento")).toBe(true);
  });

  it("assigns a caregiver and records a followup", async () => {
    const members = await listMembers();
    const targetMember = members[0];

    const assignResponse = await assignCaregiverRoute(
      new Request(`http://localhost/api/members/${targetMember.id}/assign-caregiver`, {
        method: "POST",
        body: JSON.stringify({ caregiverId: "2" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ memberId: targetMember.id }) }
    );

    expect(assignResponse.status).toBe(200);
    const assignedMember = (await assignResponse.json()) as { caregiverId: string | null };
    expect(assignedMember.caregiverId).toBe("2");

    const followupResponse = await createFollowupRoute(
      new Request("http://localhost/api/followups", {
        method: "POST",
        body: JSON.stringify({
          tenantId: targetMember.tenantId,
          memberId: targetMember.id,
          caregiverId: "2",
          type: "call",
          notes: "Contato feito e proxima visita agendada.",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(followupResponse.status).toBe(201);
    const followup = (await followupResponse.json()) as { memberId: string; caregiverId: string | null; type: string };
    expect(followup.memberId).toBe(targetMember.id);
    expect(followup.caregiverId).toBe("2");
    expect(followup.type).toBe("call");
  });
});
