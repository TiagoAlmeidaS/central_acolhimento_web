import { describe, expect, it } from "vitest";
import type { CaregiverInvitation } from "@/server/domain/mvp";
import { sortInvitationsByCreatedAt } from "@/ui/mvp/caregiver-invitation-utils";

describe("sortInvitationsByCreatedAt", () => {
  it("sorts invitations by newest createdAt first", () => {
    const invitations = [
      {
        id: "1",
        tenantId: "tenant-1",
        role: "caregiver",
        email: "old@igreja.org",
        token: "old",
        status: "pending",
        expiresAt: "2026-07-20T00:00:00.000Z",
        acceptedAt: null,
        inviteUrl: "/convite/old",
        createdAt: "2026-07-01T10:00:00.000Z",
      },
      {
        id: "2",
        tenantId: "tenant-1",
        role: "caregiver",
        email: "new@igreja.org",
        token: "new",
        status: "pending",
        expiresAt: "2026-07-20T00:00:00.000Z",
        acceptedAt: null,
        inviteUrl: "/convite/new",
        createdAt: "2026-07-08T10:00:00.000Z",
      },
    ] satisfies CaregiverInvitation[];

    const sorted = sortInvitationsByCreatedAt(invitations);

    expect(sorted.map((item) => item.id)).toEqual(["2", "1"]);
  });

  it("handles non-string createdAt values without throwing", () => {
    const invitations = [
      {
        id: "1",
        tenantId: "tenant-1",
        role: "caregiver",
        email: "date@igreja.org",
        token: "date",
        status: "pending",
        expiresAt: "2026-07-20T00:00:00.000Z",
        acceptedAt: null,
        inviteUrl: "/convite/date",
        createdAt: new Date("2026-07-07T10:00:00.000Z") as unknown as string,
      },
      {
        id: "2",
        tenantId: "tenant-1",
        role: "caregiver",
        email: "missing@igreja.org",
        token: "missing",
        status: "pending",
        expiresAt: "2026-07-20T00:00:00.000Z",
        acceptedAt: null,
        inviteUrl: "/convite/missing",
        createdAt: undefined,
      },
    ] satisfies CaregiverInvitation[];

    const sorted = sortInvitationsByCreatedAt(invitations);

    expect(sorted[0]?.id).toBe("1");
    expect(sorted[1]?.id).toBe("2");
  });
});
