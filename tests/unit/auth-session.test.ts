import { describe, expect, it } from "vitest";
import { createSessionToken, parseSessionToken } from "@/server/auth/session";
import type { AuthSession } from "@/server/domain/mvp";

const session: AuthSession = {
  user: {
    id: "user-1",
    email: "tiago@igreja.org",
    firstName: "Tiago",
    lastName: "Almeida",
  },
  membership: {
    tenantUserId: "tenant-user-1",
    tenantId: "tenant-1",
    tenantName: "Central Sape",
    tenantCity: "Sape",
    tenantState: "PB",
    role: "coordinator",
    caregiverId: null,
  },
  homePath: "/coord",
};

describe("auth session token", () => {
  it("serializes and parses a valid session token", () => {
    const token = createSessionToken(session);
    const parsed = parseSessionToken(token);

    expect(parsed).toEqual(session);
  });

  it("rejects a tampered session token", () => {
    const token = createSessionToken(session);
    const tampered = `${token}tampered`;

    expect(parseSessionToken(tampered)).toBeNull();
  });
});
