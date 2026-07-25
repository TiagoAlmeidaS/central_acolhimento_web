export const dynamic = "force-dynamic";

import { getDataScopeFromSession, listAccessibleTenantIds, resolveCaregiverId, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createMember, listMembersPage } from "@/server/repositories/mvp-repository";
import { normalizePage, normalizePageSize, type MemberListingFilters } from "@/lib/listing-filters";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession();
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;
    const accessibleTenantIds = session.membership.role === "coordinator"
      ? await listAccessibleTenantIds(session)
      : [session.membership.tenantId];

    const scope = requestedTenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, requestedTenantId), caregiverId: session.membership.role === "caregiver" ? session.membership.caregiverId : undefined }
      : session.membership.role === "coordinator"
        ? { tenantIds: accessibleTenantIds }
        : getDataScopeFromSession(session);

    const filters: MemberListingFilters = {
      name: searchParams.get("name") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      tenantId: requestedTenantId ?? "",
      caregiverId: searchParams.get("caregiverId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      description: searchParams.get("description") ?? undefined,
      status: (searchParams.get("status") as MemberListingFilters["status"]) ?? "",
    };

    const members = await listMembersPage(scope, filters, {
      page: normalizePage(searchParams.get("page") ?? undefined, 1),
      pageSize: normalizePageSize(searchParams.get("pageSize") ?? undefined, 10, 50),
    });
    return Response.json(members);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao listar membros." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession();
    const body = (await request.json()) as {
      tenantId?: string;
      caregiverId?: string | null;
      seedId?: string | null;
      name?: string;
      age?: number | null;
      phone?: string;
      address?: string;
      postalCode?: string;
      street?: string;
      neighborhood?: string;
      addressNumber?: string;
      state?: string;
      city?: string;
      birthDate?: string | null;
      status?: "new" | "in_progress" | "consolidated" | "inactive";
      spiritualTemperature?: "cold" | "warm" | "hot" | null;
      notes?: string;
      latitude?: number | null;
      longitude?: number | null;
      isUrgent?: boolean;
    };

    if (!body.tenantId || !body.name) {
      return Response.json(
        { error: "Campos obrigatorios: tenantId, name." },
        { status: 400 }
      );
    }

    const member = await createMember({
      tenantId: await resolveTenantIdForUserAccess(session, body.tenantId),
      caregiverId: resolveCaregiverId(session, body.caregiverId ?? null, { allowUnassignedForCoordinator: true }),
      seedId: body.seedId ?? null,
      name: body.name,
      age: body.age ?? null,
      phone: body.phone,
      address: body.address,
      postalCode: body.postalCode,
      street: body.street,
      neighborhood: body.neighborhood,
      addressNumber: body.addressNumber,
      state: body.state,
      city: body.city,
      birthDate: body.birthDate ?? null,
      status: body.status,
      spiritualTemperature: body.spiritualTemperature ?? null,
      notes: body.notes,
      latitude: body.latitude,
      longitude: body.longitude,
      isUrgent: body.isUrgent,
    });

    return Response.json(member, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar membro." },
      { status: 500 }
    );
  }
}
