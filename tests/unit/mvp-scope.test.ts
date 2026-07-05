import { beforeEach, describe, expect, it } from "vitest";
import {
  getDashboardSummary,
  listCaregivers,
  listFollowups,
  listMembers,
  listSeeds,
  listTenants,
  resetLocalMvpStore,
} from "@/server/repositories/mvp-repository";

describe("mvp repository scope", () => {
  beforeEach(() => {
    delete process.env.POSTGRES_URL_NON_POOLING;
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    resetLocalMvpStore();
  });

  it("filters coordinator data by tenant", async () => {
    const scope = { tenantId: "1" };
    const [tenants, caregivers, seeds, members, followups, cards] = await Promise.all([
      listTenants(scope),
      listCaregivers(scope),
      listSeeds(scope),
      listMembers(scope),
      listFollowups(scope),
      getDashboardSummary(scope),
    ]);

    expect(tenants).toHaveLength(1);
    expect(caregivers.every((item) => item.tenantId === "1")).toBe(true);
    expect(seeds.every((item) => item.tenantId === "1")).toBe(true);
    expect(members.every((item) => item.tenantId === "1")).toBe(true);
    expect(followups.every((item) => item.tenantId === "1")).toBe(true);
    expect(cards.find((item) => item.label === "Novos contatos")?.value).toBe("1");
  });

  it("filters caregiver data by tenant and caregiver", async () => {
    const scope = { tenantId: "1", caregiverId: "1" };
    const [caregivers, seeds, members, followups] = await Promise.all([
      listCaregivers(scope),
      listSeeds(scope),
      listMembers(scope),
      listFollowups(scope),
    ]);

    expect(caregivers).toHaveLength(1);
    expect(caregivers[0]?.id).toBe("1");
    expect(seeds.every((item) => item.caregiverId === "1")).toBe(true);
    expect(members.every((item) => item.caregiverId === "1")).toBe(true);
    expect(followups.every((item) => item.caregiverId === "1")).toBe(true);
  });
});
