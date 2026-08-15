export const dynamic = "force-dynamic";

import { getDataScopeFromSession, listAccessibleTenantIds, resolveCaregiverId, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { validateHouseFrontImageDataUrl } from "@/lib/house-front-image";
import { createSeed, listSeedsPage } from "@/server/repositories/mvp-repository";
import { normalizePage, normalizePageSize, type ContactListingFilters } from "@/lib/listing-filters";
import { getOutingDetail } from "@/server/repositories/outing-repository";

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

    const filters: ContactListingFilters = {
      name: searchParams.get("name") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      tenantId: requestedTenantId ?? "",
      caregiverId: searchParams.get("caregiverId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      description: searchParams.get("description") ?? undefined,
      status: (searchParams.get("status") as ContactListingFilters["status"]) ?? "",
    };

    const seeds = await listSeedsPage(scope, filters, {
      page: normalizePage(searchParams.get("page") ?? undefined, 1),
      pageSize: normalizePageSize(searchParams.get("pageSize") ?? undefined, 10, 50),
    });
    return Response.json(seeds);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao listar sementes." },
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
      referenceName?: string;
      age?: number | null;
      phone?: string;
      city?: string;
      postalCode?: string;
      openHouse?: boolean;
      address?: string;
      street?: string;
      neighborhood?: string;
      addressNumber?: string;
      state?: string;
      houseFrontImageUrl?: string | null;
      source?: string;
      status?: "new" | "contacted" | "waiting_visit" | "in_progress" | "consolidated" | "inactive";
      notes?: string;
      firstContactAt?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      outingEventId?: string | null;
    };

    if (!body.tenantId || !body.referenceName) {
      return Response.json(
        { error: "Campos obrigatorios: tenantId, referenceName." },
        { status: 400 }
      );
    }

    const imageValidationError = validateHouseFrontImageDataUrl(body.houseFrontImageUrl ?? null);
    if (imageValidationError) {
      return Response.json({ error: imageValidationError }, { status: 400 });
    }

    const tenantId = await resolveTenantIdForUserAccess(session, body.tenantId);
    if (body.outingEventId) {
      if (session.membership.role !== "coordinator") {
        return Response.json({ error: "Apenas a coordenacao pode vincular uma saida." }, { status: 403 });
      }
      await getOutingDetail(body.outingEventId, { tenantId });
    }
    const seed = await createSeed({
      tenantId,
      caregiverId: resolveCaregiverId(session, body.caregiverId ?? null, { allowUnassignedForCoordinator: true }),
      referenceName: body.referenceName,
      age: body.age ?? null,
      phone: body.phone,
      city: body.city,
      postalCode: body.postalCode,
      openHouse: body.openHouse,
      address: body.address,
      street: body.street,
      neighborhood: body.neighborhood,
      addressNumber: body.addressNumber,
      state: body.state,
      houseFrontImageUrl: body.houseFrontImageUrl ?? null,
      source: body.source,
      status: body.status,
      notes: body.notes,
      firstContactAt: body.firstContactAt ?? null,
      latitude: body.latitude,
      longitude: body.longitude,
      outingEventId: body.outingEventId ?? null,
    });

    return Response.json(seed, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar semente.";
    const status = message.includes("Acesso negado") || message.includes("Apenas a coordenacao") ? 403 : message.includes("nao encontrad") ? 404 : 500;
    return Response.json(
      { error: message },
      { status }
    );
  }
}
