export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { listChurchMeetingTypes, listChurchMemberships, listChurchOccurrences } from "@/server/repositories/church-repository";
import { ChurchManager } from "@/ui/mvp/church-manager";

export default async function ChurchPage() {
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const scope = { tenantIds: accessibleTenantIds };

  const [tenants, members, churchMembers, meetingTypes, occurrences] = await Promise.all([
    listTenants(scope),
    listMembers(scope),
    listChurchMemberships(scope),
    listChurchMeetingTypes(scope),
    listChurchOccurrences(scope),
  ]);

  return (
    <ChurchManager
      tenants={tenants}
      members={members}
      churchMembers={churchMembers}
      meetingTypes={meetingTypes}
      occurrences={occurrences}
    />
  );
}
