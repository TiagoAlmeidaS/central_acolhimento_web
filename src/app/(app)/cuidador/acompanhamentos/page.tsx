export const dynamic = "force-dynamic";

import { listFollowups, listMembers, listSeeds } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { MobileShell } from "@/ui/navigation/mobile-shell";
import { CareWorkspace } from "@/ui/cuidador/care-workspace";

export default async function CaregiverFollowupsPage() {
  const session = await requireServerAuthSession("caregiver");
  const scope = getDataScopeFromSession(session);
  const [followups, members, seeds] = await Promise.all([
    listFollowups(scope),
    listMembers(scope),
    listSeeds(scope),
  ]);

  return (
    <MobileShell>
      <CareWorkspace
        view="acompanhamentos"
        members={members}
        seeds={seeds}
        followups={followups}
        session={session}
        nowIso={new Date().toISOString()}
      />
    </MobileShell>
  );
}
