import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/server/auth/session";
import type { AuthSession } from "@/server/domain/mvp";
import { resetLocalMvpStore } from "@/server/repositories/mvp-repository";

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

describe("auth route integration", () => {
  beforeEach(() => {
    delete process.env.POSTGRES_URL_NON_POOLING;
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    cookieState.value = "";
    resetLocalMvpStore();
    vi.resetModules();
  });

  it("returns tenant selection for a multi-tenant coordinator", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tiago@igreja.org",
          password: "12345678",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { type: string; memberships: unknown[] };
    expect(payload.type).toBe("select-membership");
    expect(payload.memberships).toHaveLength(2);
  });

  it("creates a real session cookie for a caregiver login and exposes it via session route", async () => {
    const { POST: login } = await import("@/app/api/auth/login/route");
    const loginResponse = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maria@igreja.org",
          password: "12345678",
        }),
      })
    );

    expect(loginResponse.status).toBe(200);
    expect(cookieState.value).not.toBe("");

    const loginPayload = (await loginResponse.json()) as { type: string; session: AuthSession };
    expect(loginPayload.type).toBe("authenticated");
    expect(loginPayload.session.membership.role).toBe("caregiver");

    const { GET: getSession } = await import("@/app/api/auth/session/route");
    const sessionResponse = await getSession();
    const sessionPayload = (await sessionResponse.json()) as { session: AuthSession | null };

    expect(sessionPayload.session?.user.email).toBe("maria@igreja.org");
    expect(sessionPayload.session?.membership.tenantName).toBe("Central Sape");
  });

  it("clears the session cookie on logout", async () => {
    cookieState.value = "some-session";
    const { POST: logout } = await import("@/app/api/auth/logout/route");

    const response = await logout();
    const payload = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(cookieState.value).toBe("");
  });

  it("registers a coordinator account and creates its first tenant", async () => {
    const { POST: registerCoordinator } = await import("@/app/api/auth/register-coordinator/route");

    const registerResponse = await registerCoordinator(
      new Request("http://localhost/api/auth/register-coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantName: "Central Guarabira",
          city: "Guarabira",
          state: "PB",
          firstName: "Priscila",
          lastName: "Costa",
          email: "priscila@igreja.org",
          phone: "(83) 99999-4444",
          password: "12345678",
        }),
      })
    );

    expect(registerResponse.status).toBe(201);

    const { listTenants } = await import("@/server/repositories/mvp-repository");
    const tenants = await listTenants();
    expect(tenants.some((tenant) => tenant.name === "Central Guarabira")).toBe(true);

    const { POST: login } = await import("@/app/api/auth/login/route");
    const loginResponse = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "priscila@igreja.org",
          password: "12345678",
        }),
      })
    );

    expect(loginResponse.status).toBe(200);
    const loginPayload = (await loginResponse.json()) as { type: string; session: AuthSession };
    expect(loginPayload.type).toBe("authenticated");
    expect(loginPayload.session.membership.role).toBe("coordinator");
    expect(loginPayload.session.membership.tenantName).toBe("Central Guarabira");
  });

  it("accepts a caregiver invitation and allows the invited user to log in", async () => {
    const { createCaregiverInvitation } = await import("@/server/repositories/invitation-repository");

    const invitation = await createCaregiverInvitation({
      tenantId: "1",
      email: "debora@igreja.org",
      createdByTenantUserId: "local-tenant-user-tiago-sape",
    });

    const { POST: acceptInvitation } = await import("@/app/api/invitations/[token]/accept/route");
    const acceptResponse = await acceptInvitation(
      new Request(`http://localhost/api/invitations/${invitation.token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Debora",
          lastName: "Lima",
          email: "debora@igreja.org",
          phone: "(83) 98888-1111",
          password: "12345678",
        }),
      }),
      { params: Promise.resolve({ token: invitation.token }) }
    );

    expect(acceptResponse.status).toBe(201);

    const { POST: login } = await import("@/app/api/auth/login/route");
    const loginResponse = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "debora@igreja.org",
          password: "12345678",
        }),
      })
    );

    expect(loginResponse.status).toBe(200);
    const loginPayload = (await loginResponse.json()) as { type: string; session: AuthSession };
    expect(loginPayload.type).toBe("authenticated");
    expect(loginPayload.session.membership.role).toBe("caregiver");
    expect(loginPayload.session.membership.tenantName).toBe("Central Sapé");
  });
  it("creates access for an existing caregiver without duplicating the caregiver assignment", async () => {
    const coordinatorSession = createSessionToken({
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
    cookieState.value = coordinatorSession;

    const { POST: createCaregiverAccess } = await import("@/app/api/caregivers/[caregiverId]/access/route");
    const accessResponse = await createCaregiverAccess(
      new Request("http://localhost/api/caregivers/1/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "betania@igreja.org",
          password: "Central@123",
        }),
      }),
      { params: Promise.resolve({ caregiverId: "1" }) }
    );

    expect(accessResponse.status).toBe(201);
    cookieState.value = "";

    const { POST: login } = await import("@/app/api/auth/login/route");
    const loginResponse = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "betania@igreja.org",
          password: "Central@123",
        }),
      })
    );

    expect(loginResponse.status).toBe(200);
    const loginPayload = (await loginResponse.json()) as { type: string; session: AuthSession };
    expect(loginPayload.type).toBe("authenticated");
    expect(loginPayload.session.membership.role).toBe("caregiver");
    expect(loginPayload.session.membership.caregiverId).toBe("1");

    cookieState.value = coordinatorSession;
    const { POST: resetCaregiverPassword } = await import("@/app/api/caregivers/[caregiverId]/password/route");
    const resetResponse = await resetCaregiverPassword(
      new Request("http://localhost/api/caregivers/1/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: "Central@456",
        }),
      }),
      { params: Promise.resolve({ caregiverId: "1" }) }
    );

    expect(resetResponse.status).toBe(200);
    cookieState.value = "";

    const oldPasswordLoginResponse = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "betania@igreja.org",
          password: "Central@123",
        }),
      })
    );
    expect(oldPasswordLoginResponse.status).toBe(401);

    const newPasswordLoginResponse = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "betania@igreja.org",
          password: "Central@456",
        }),
      })
    );
    expect(newPasswordLoginResponse.status).toBe(200);
    const newPasswordLoginPayload = (await newPasswordLoginResponse.json()) as { type: string; session: AuthSession };
    expect(newPasswordLoginPayload.session.membership.caregiverId).toBe("1");
  });

  it("registers multiple caregivers through the same global signup channel", async () => {
    const coordinatorSession = createSessionToken({
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
    cookieState.value = coordinatorSession;

    const { POST: createChannel } = await import("@/app/api/signup-channels/route");
    const channelResponse = await createChannel(
      new Request("http://localhost/api/signup-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "1",
          name: "QRCode geral",
          requireApproval: false,
        }),
      })
    );

    expect(channelResponse.status).toBe(201);
    const channel = (await channelResponse.json()) as { token: string };
    cookieState.value = "";

    const { POST: registerByChannel } = await import("@/app/api/signup-channels/public/[token]/register/route");
    const firstResponse = await registerByChannel(
      new Request(`http://localhost/api/signup-channels/public/${channel.token}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Rebeca",
          lastName: "Santos",
          email: "rebeca@igreja.org",
          phone: "(83) 98888-2222",
          password: "12345678",
        }),
      }),
      { params: Promise.resolve({ token: channel.token }) }
    );
    const secondResponse = await registerByChannel(
      new Request(`http://localhost/api/signup-channels/public/${channel.token}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Livia",
          lastName: "Ferreira",
          email: "livia@igreja.org",
          phone: "(83) 98888-3333",
          password: "12345678",
        }),
      }),
      { params: Promise.resolve({ token: channel.token }) }
    );

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);

    const firstPayload = (await firstResponse.json()) as { status: string };
    const secondPayload = (await secondResponse.json()) as { status: string };
    expect(firstPayload.status).toBe("approved");
    expect(secondPayload.status).toBe("approved");

    const { POST: login } = await import("@/app/api/auth/login/route");
    const loginResponse = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "rebeca@igreja.org",
          password: "12345678",
        }),
      })
    );

    expect(loginResponse.status).toBe(200);
    const loginPayload = (await loginResponse.json()) as { type: string; session: AuthSession };
    expect(loginPayload.type).toBe("authenticated");
    expect(loginPayload.session.membership.role).toBe("caregiver");
  });

  it("keeps channel registrations pending until the coordinator approves them", async () => {
    const coordinatorSession = createSessionToken({
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
    cookieState.value = coordinatorSession;

    const { POST: createChannel } = await import("@/app/api/signup-channels/route");
    const channelResponse = await createChannel(
      new Request("http://localhost/api/signup-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "1",
          name: "QRCode com aprovacao",
          requireApproval: true,
        }),
      })
    );

    expect(channelResponse.status).toBe(201);
    const channel = (await channelResponse.json()) as { id: string; token: string };
    cookieState.value = "";

    const { POST: registerByChannel } = await import("@/app/api/signup-channels/public/[token]/register/route");
    const registerResponse = await registerByChannel(
      new Request(`http://localhost/api/signup-channels/public/${channel.token}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Noemi",
          lastName: "Silva",
          email: "noemi@igreja.org",
          phone: "(83) 98888-4444",
          password: "12345678",
        }),
      }),
      { params: Promise.resolve({ token: channel.token }) }
    );

    expect(registerResponse.status).toBe(201);
    const registerPayload = (await registerResponse.json()) as { status: string; use: { id: string } };
    expect(registerPayload.status).toBe("submitted");

    const { POST: login } = await import("@/app/api/auth/login/route");
    const loginBeforeApproval = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "noemi@igreja.org",
          password: "12345678",
        }),
      })
    );

    expect(loginBeforeApproval.status).toBe(401);

    cookieState.value = coordinatorSession;
    const { POST: approveUse } = await import("@/app/api/signup-channels/[channelId]/uses/[useId]/approve/route");
    const approveResponse = await approveUse(
      new Request(`http://localhost/api/signup-channels/${channel.id}/uses/${registerPayload.use.id}/approve`, {
        method: "POST",
      }),
      { params: Promise.resolve({ channelId: channel.id, useId: registerPayload.use.id }) }
    );

    expect(approveResponse.status).toBe(201);
    cookieState.value = "";

    const loginAfterApproval = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "noemi@igreja.org",
          password: "12345678",
        }),
      })
    );

    expect(loginAfterApproval.status).toBe(200);
    const loginPayload = (await loginAfterApproval.json()) as { type: string; session: AuthSession };
    expect(loginPayload.type).toBe("authenticated");
    expect(loginPayload.session.membership.role).toBe("caregiver");
  });
});
