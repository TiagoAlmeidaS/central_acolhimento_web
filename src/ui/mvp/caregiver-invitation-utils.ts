import type { CaregiverInvitation } from "@/server/domain/mvp";

function toTimestamp(value: unknown) {
  if (typeof value === "string" || value instanceof Date || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export function sortInvitationsByCreatedAt(invitations: CaregiverInvitation[]) {
  return [...invitations].sort(
    (left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt)
  );
}
