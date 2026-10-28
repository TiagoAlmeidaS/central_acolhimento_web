export const dynamic = "force-dynamic";

import type { Member, SpiritualTemperature } from "@/server/domain/mvp";
import { listCaregivers, listFollowups, listMembers, listTenants } from "@/server/repositories/mvp-repository";
import { listChurchAttendance, listChurchOccurrences } from "@/server/repositories/church-repository";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { PageContainer } from "@/ui/atalaia";
import { MemberList, type MemberDrawerRequest } from "@/ui/mvp/member-list";
import {
  filterMembers,
  normalizePage,
  normalizePageSize,
  paginateItems,
  type MemberListingFilters,
} from "@/lib/listing-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildExportHref(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(searchParams)) {
    const value = firstValue(rawValue);
    if (!value || ["page", "novo", "editar", "ver", "needs"].includes(key)) continue;
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `/api/members/export?${query}` : "/api/members/export";
}

const MEMBER_STATUSES: Member["status"][] = ["new", "in_progress", "consolidated", "inactive"];

/**
 * Assistidos que faltaram nas 3 últimas reuniões com chamada fechada da sua localidade.
 * Se a chamada não estiver disponível, devolve vazio: o chip "Precisa de alguém" segue com os outros motivos.
 */
async function findMembersAbsentLastThree(tenantIds: string[]) {
  const absent = new Set<string>();
  try {
    const occurrences = await listChurchOccurrences({ tenantIds });
    for (const tenantId of tenantIds) {
      const closed = occurrences
        .filter((item) => item.tenantId === tenantId && item.status !== "cancelled" && item.attendanceClosedAt)
        .sort((a, b) => b.occursOn.localeCompare(a.occursOn))
        .slice(0, 3);
      if (closed.length < 3) continue;

      const records = await Promise.all(closed.map((occurrence) => listChurchAttendance(occurrence.id, { tenantId })));
      const sets = records.map(
        (list) => new Set(list.filter((record) => record.status === "absent").map((record) => record.memberId)),
      );
      for (const memberId of sets[0]) {
        if (sets.every((set) => set.has(memberId))) absent.add(memberId);
      }
    }
  } catch (error) {
    console.error("members_absent_last_three_failed", error);
  }
  return absent;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const page = normalizePage(firstValue(resolvedSearchParams.page), 1);
  const pageSize = normalizePageSize(firstValue(resolvedSearchParams.pageSize), 10, 50);
  const [allTenants, allCaregivers] = await Promise.all([
    listTenants({ tenantIds: accessibleTenantIds }),
    listCaregivers({ tenantIds: accessibleTenantIds }),
  ]);

  const tenants = allTenants.filter((tenant) => accessibleTenantIds.includes(tenant.id));
  const caregivers = allCaregivers.filter((caregiver) => accessibleTenantIds.includes(caregiver.tenantId));

  const filters: MemberListingFilters = {
    name: firstValue(resolvedSearchParams.name),
    city: firstValue(resolvedSearchParams.city),
    tenantId: firstValue(resolvedSearchParams.tenantId),
    caregiverId: firstValue(resolvedSearchParams.caregiverId),
    dateFrom: firstValue(resolvedSearchParams.dateFrom),
    dateTo: firstValue(resolvedSearchParams.dateTo),
    description: firstValue(resolvedSearchParams.description),
    status: (firstValue(resolvedSearchParams.status) as Member["status"] | "") ?? "",
    spiritualTemperature: (firstValue(resolvedSearchParams.spiritualTemperature) as SpiritualTemperature | "") ?? "",
  };
  const needsOnly = firstValue(resolvedSearchParams.needs) === "1";

  const effectiveScope = filters.tenantId ? { tenantId: filters.tenantId } : { tenantIds: accessibleTenantIds };
  const [members, followups] = await Promise.all([
    listMembers(effectiveScope),
    listFollowups({ tenantIds: accessibleTenantIds }),
  ]);

  const filtered = filterMembers(members, filters);
  const withoutStatus = filterMembers(members, { ...filters, status: "" });
  const statusCounts = Object.fromEntries(
    MEMBER_STATUSES.map((status) => [status, withoutStatus.filter((m) => m.status === status).length]),
  ) as Record<Member["status"], number>;

  // "Precisa de alguém": urgente, sem cuidador, ação atrasada ou faltou às 3 últimas reuniões.
  const absentLastThree = await findMembersAbsentLastThree(
    filters.tenantId ? [filters.tenantId] : accessibleTenantIds,
  );
  const latestFollowup = new Map<string, (typeof followups)[number]>();
  for (const followup of followups) {
    const current = latestFollowup.get(followup.memberId);
    if (!current || new Date(followup.occurredAt) > new Date(current.occurredAt)) {
      latestFollowup.set(followup.memberId, followup);
    }
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const needsReasons: Record<string, string[]> = {};
  for (const member of filtered) {
    if (member.status === "inactive") continue;
    const reasons: string[] = [];
    if (member.isUrgent) reasons.push("Urgente");
    if (!member.caregiverId) reasons.push("Sem cuidador");
    const nextAction = latestFollowup.get(member.id)?.nextActionAt;
    if (nextAction && new Date(nextAction) < startOfToday) reasons.push("Ação atrasada");
    if (absentLastThree.has(member.id)) reasons.push("Faltou 3 reuniões");
    if (reasons.length > 0) needsReasons[member.id] = reasons;
  }

  const listed = (needsOnly ? filtered.filter((member) => needsReasons[member.id]) : filtered).sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  );
  const paginated = paginateItems(listed, page, pageSize);

  // Gaveta aberta por link: /coord/membros?novo=1 | ?editar=ID | ?ver=ID
  const editId = firstValue(resolvedSearchParams.editar);
  const viewId = firstValue(resolvedSearchParams.ver);
  const focusId = editId ?? viewId;
  const focusMember = focusId ? (members.find((member) => member.id === focusId) ?? null) : null;
  let initialDrawer: MemberDrawerRequest | null = null;
  if (editId && focusMember) initialDrawer = { kind: "edit", memberId: focusMember.id };
  else if (viewId && focusMember) initialDrawer = { kind: "view", memberId: focusMember.id };
  else if (firstValue(resolvedSearchParams.novo)) initialDrawer = { kind: "new" };

  const visibleIds = new Set(paginated.items.map((member) => member.id));
  if (focusMember) visibleIds.add(focusMember.id);

  return (
    <PageContainer>
      <MemberList
        members={paginated.items}
        focusMember={focusMember}
        tenants={tenants}
        caregivers={caregivers}
        followups={followups.filter((followup) => visibleIds.has(followup.memberId))}
        filters={filters}
        statusCounts={statusCounts}
        needsReasons={needsReasons}
        needsOnly={needsOnly}
        pagination={{
          page: paginated.page,
          totalPages: paginated.totalPages,
          totalItems: paginated.totalItems,
          pageSize: paginated.pageSize,
        }}
        exportHref={buildExportHref(resolvedSearchParams)}
        initialDrawer={initialDrawer}
      />
    </PageContainer>
  );
}
