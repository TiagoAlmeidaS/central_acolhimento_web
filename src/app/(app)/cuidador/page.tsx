export const dynamic = "force-dynamic";

import { listFollowups, listMembers, listSeeds } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { MobileShell } from "@/ui/navigation/mobile-shell";
import { CaregiverDashboardClient } from "./caregiver-dashboard-client";

export default async function CaregiverDashboardPage() {
  const session = await requireServerAuthSession("caregiver");
  const scope = getDataScopeFromSession(session);

  const [members, contacts, followups] = await Promise.all([
    listMembers(scope),
    listSeeds(scope),
    listFollowups(scope),
  ]);

  return (
    <MobileShell>
      <CaregiverDashboardClient
        initialMembers={members}
        initialSeeds={contacts}
        initialFollowups={followups}
        session={session}
        nowIso={new Date().toISOString()}
      />
    </MobileShell>
  );
}
