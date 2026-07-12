import type { Member, Seed } from "@/server/domain/mvp";

export type ContactListingFilters = {
  name?: string;
  city?: string;
  tenantId?: string;
  caregiverId?: string;
  dateFrom?: string;
  dateTo?: string;
  description?: string;
  status?: Seed["status"] | "";
};

export type MemberListingFilters = {
  name?: string;
  city?: string;
  tenantId?: string;
  caregiverId?: string;
  dateFrom?: string;
  dateTo?: string;
  description?: string;
  status?: Member["status"] | "";
};

export function normalizePage(value: string | undefined, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function normalizePageSize(value: string | undefined, fallback = 10, max = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function includesNormalized(source: string | null | undefined, query: string | undefined) {
  if (!query) return true;
  return (source ?? "").toLowerCase().includes(query.trim().toLowerCase());
}

function isDateInRange(value: string | null | undefined, dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return true;
  if (!value) return false;

  const current = new Date(value);
  if (Number.isNaN(current.getTime())) {
    return false;
  }

  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`);
    if (!Number.isNaN(from.getTime()) && current < from) {
      return false;
    }
  }

  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`);
    if (!Number.isNaN(to.getTime()) && current > to) {
      return false;
    }
  }

  return true;
}

export function filterContacts(items: Seed[], filters: ContactListingFilters) {
  return items.filter((item) => {
    if (filters.tenantId && item.tenantId !== filters.tenantId) return false;
    if (filters.caregiverId && item.caregiverId !== filters.caregiverId) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (!includesNormalized(item.referenceName, filters.name)) return false;
    if (!includesNormalized(item.city, filters.city)) return false;
    if (!includesNormalized(item.notes, filters.description)) return false;
    if (!isDateInRange(item.firstContactAt ?? item.createdAt ?? null, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });
}

export function filterMembers(items: Member[], filters: MemberListingFilters) {
  return items.filter((item) => {
    if (filters.tenantId && item.tenantId !== filters.tenantId) return false;
    if (filters.caregiverId && item.caregiverId !== filters.caregiverId) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (!includesNormalized(item.name, filters.name)) return false;
    if (!includesNormalized(item.city, filters.city)) return false;
    if (!includesNormalized(item.notes, filters.description)) return false;
    if (!isDateInRange(item.createdAt ?? null, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    page: currentPage,
    pageSize,
    totalItems,
    totalPages,
  };
}
