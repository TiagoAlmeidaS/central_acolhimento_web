export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { listCaregivers, listTenants } from "@/server/repositories/mvp-repository";
import { listTciChambers, listTciSessions } from "@/server/repositories/tci-repository";
import { TciManager } from "@/ui/mvp/tci-manager";

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  return now.toISOString().slice(0, 10);
}

export default async function TciPage() {
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const weekStart = getCurrentWeekStart();

  const [tenants, caregivers, chambers, sessions] = await Promise.all([
    listTenants({ tenantIds: accessibleTenantIds }),
    listCaregivers({ tenantIds: accessibleTenantIds }),
    listTciChambers({ tenantIds: accessibleTenantIds }),
    listTciSessions({ tenantIds: accessibleTenantIds }, { weekStart }),
  ]);

  return <TciManager tenants={tenants} caregivers={caregivers} chambers={chambers} sessions={sessions} initialWeekStart={weekStart} />;
}
