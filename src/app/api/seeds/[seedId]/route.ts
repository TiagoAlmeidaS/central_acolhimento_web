import {
  assertSessionCanAccessRecord,
  getDataScopeFromSession,
  listAccessibleTenantIds,
  resolveCaregiverId,
  resolveTenantIdForUserAccess,
} from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { validateHouseFrontImageDataUrl } from "@/lib/house-front-image";
import { deleteSeed, listSeeds, updateSeed } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ seedId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    const { seedId } = await context.params;
    const currentSeed = session.membership.role === "coordinator"
      ? (await Promise.all((await listAccessibleTenantIds(session)).map((tenantId) => listSeeds({ tenantId })))).flat().find((item) => item.id === seedId)
      : (await listSeeds(getDataScopeFromSession(session))).find((item) => item.id === seedId);
    if (!currentSeed) {
      return Response.json({ error: "Novo contato nao encontrado." }, { status: 404 });
    }
    assertSessionCanAccessRecord(session, currentSeed);
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
      status?: "new" | "contacted" | "in_progress" | "consolidated" | "inactive";
      notes?: string;
      firstContactAt?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      isUrgent?: boolean;
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

    const seed = await updateSeed(seedId, {
      tenantId: await resolveTenantIdForUserAccess(session, body.tenantId),
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
      isUrgent: body.isUrgent,
    });

    return Response.json(seed);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao editar novo contato." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    const { seedId } = await context.params;
    const currentSeed = session.membership.role === "coordinator"
      ? (await Promise.all((await listAccessibleTenantIds(session)).map((tenantId) => listSeeds({ tenantId })))).flat().find((item) => item.id === seedId)
      : (await listSeeds(getDataScopeFromSession(session))).find((item) => item.id === seedId);
    if (!currentSeed) {
      return Response.json({ error: "Novo contato nao encontrado." }, { status: 404 });
    }

    assertSessionCanAccessRecord(session, currentSeed);
    await deleteSeed(seedId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir novo contato." },
      { status: 500 }
    );
  }
}
