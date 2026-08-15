export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { listCaregivers, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { listOutings, listOutingTypes } from "@/server/repositories/outing-repository";
import { OutingManager } from "@/ui/mvp/outing-manager";

export default async function OutingsPage() {
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const [outings, outingTypes, tenants, caregivers, members] = await Promise.all([
    listOutings({ tenantIds: accessibleTenantIds }),
    listOutingTypes({ tenantIds: accessibleTenantIds }, { includeInactive: true }),
    listTenants({ tenantIds: accessibleTenantIds }),
    listCaregivers({ tenantIds: accessibleTenantIds }),
    listMembers({ tenantIds: accessibleTenantIds }),
  ]);

  return <OutingManager outings={outings} outingTypes={outingTypes} tenants={tenants} caregivers={caregivers} members={members} />;
}
