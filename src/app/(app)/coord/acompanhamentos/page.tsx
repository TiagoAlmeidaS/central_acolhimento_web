export const dynamic = "force-dynamic";

import { listCaregivers, listFollowups, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { PageContainer } from "@/ui/atalaia";
import { FollowupManager } from "@/ui/mvp/followup-manager";

export default async function FollowupsPage(props: { searchParams: Promise<{ memberId?: string }> }) {
  const { memberId } = await props.searchParams;
  const session = await requireServerAuthSession("coordinator");
  const scope = getDataScopeFromSession(session);
  const [followups, tenants, members, caregivers] = await Promise.all([
    listFollowups(scope),
    listTenants(scope),
    listMembers(scope),
    listCaregivers(scope),
  ]);

  return (
    <PageContainer>
      <FollowupManager
        title="Acompanhamentos"
        subtitle="A linha do tempo pastoral de cada pessoa: o que foi feito e o que vem a seguir."
        followups={followups}
        tenants={tenants}
        members={members}
        caregivers={caregivers}
        initialMemberId={memberId}
      />
    </PageContainer>
  );
}
