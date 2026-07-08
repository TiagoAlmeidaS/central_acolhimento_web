import { beforeEach, describe, expect, it, vi } from "vitest";
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
});
