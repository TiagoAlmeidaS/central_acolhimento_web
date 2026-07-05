import { beforeEach, describe, expect, it } from "vitest";
import { authenticateLogin, resetLocalAuthStore } from "@/server/repositories/auth-repository";

describe("authenticateLogin", () => {
  beforeEach(() => {
    delete process.env.POSTGRES_URL_NON_POOLING;
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    resetLocalAuthStore();
  });

  it("asks tenant selection when the same coordinator has more than one tenant", async () => {
    const result = await authenticateLogin({
      email: "tiago@igreja.org",
      password: "12345678",
    });

    expect(result?.type).toBe("select-membership");
    if (result?.type === "select-membership") {
      expect(result.memberships).toHaveLength(2);
      expect(result.user.email).toBe("tiago@igreja.org");
    }
  });

  it("logs a caregiver directly into the caregiver experience", async () => {
    const result = await authenticateLogin({
      email: "maria@igreja.org",
      password: "12345678",
    });

    expect(result?.type).toBe("authenticated");
    if (result?.type === "authenticated") {
      expect(result.session.membership.role).toBe("caregiver");
      expect(result.session.homePath).toBe("/cuidador");
    }
  });
});
