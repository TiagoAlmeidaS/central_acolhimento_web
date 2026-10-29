export const dynamic = "force-dynamic";

import type { Seed } from "@/server/domain/mvp";
import { listCaregivers, listMembers, listSeeds, listTenants } from "@/server/repositories/mvp-repository";
import { listOutings } from "@/server/repositories/outing-repository";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { filterContacts, type ContactListingFilters } from "@/lib/listing-filters";
import { ContactsWorkspace } from "@/ui/coord/contacts-workspace";
import { activeMemberCount, chipFromParam } from "@/ui/coord/seed-utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const VIEWS = ["quadro", "lista", "mapa"] as const;

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const scope = { tenantIds: accessibleTenantIds };

  const filters: ContactListingFilters = {
    name: firstValue(params.name),
    city: firstValue(params.city),
    tenantId: firstValue(params.tenantId),
    caregiverId: firstValue(params.caregiverId),
    dateFrom: firstValue(params.dateFrom),
    dateTo: firstValue(params.dateTo),
    description: firstValue(params.description),
    status: (firstValue(params.status) as Seed["status"] | "") ?? "",
  };

  const effectiveScope = filters.tenantId ? { tenantId: filters.tenantId } : scope;
  const [allTenants, allCaregivers, members, outings, seeds] = await Promise.all([
    listTenants(scope),
    listCaregivers(scope),
    listMembers(scope),
    listOutings(scope),
    listSeeds(effectiveScope).then((items) => filterContacts(items, filters)),
  ]);

  const tenants = allTenants.filter((tenant) => accessibleTenantIds.includes(tenant.id));
  const caregivers = allCaregivers.filter((caregiver) => accessibleTenantIds.includes(caregiver.tenantId));
  const loadByCaregiver: Record<string, number> = {};
  for (const caregiver of caregivers) loadByCaregiver[caregiver.id] = activeMemberCount(caregiver.id, members);

  const requestedView = firstValue(params.visao);
  const view = VIEWS.find((item) => item === requestedView);

  return (
    <ContactsWorkspace
      seeds={seeds}
      tenants={tenants}
      caregivers={caregivers}
      outings={outings.filter((outing) => outing.status === "confirmed" || Boolean(outing.completedAt))}
      loadByCaregiver={loadByCaregiver}
      filters={filters}
      initial={{
        contactId: firstValue(params.contato),
        editId: firstValue(params.editar),
        openNew: firstValue(params.novo) === "1",
        chip: chipFromParam(firstValue(params.filtro)),
        view,
      }}
    />
  );
}
