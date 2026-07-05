export const dynamic = "force-dynamic";

import { getDataScopeFromSession, resolveCaregiverId, resolveTenantId } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createSeed, listSeeds } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const session = await requireServerAuthSession();
    const seeds = await listSeeds(getDataScopeFromSession(session));
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
      phone?: string;
      city?: string;
      source?: string;
      status?: "new" | "contacted" | "in_progress" | "consolidated" | "inactive";
      notes?: string;
      firstContactAt?: string | null;
    };

    if (!body.tenantId || !body.referenceName) {
      return Response.json(
        { error: "Campos obrigatorios: tenantId, referenceName." },
        { status: 400 }
      );
    }

    const seed = await createSeed({
      tenantId: resolveTenantId(session, body.tenantId),
      caregiverId: resolveCaregiverId(session, body.caregiverId ?? null, { allowUnassignedForCoordinator: true }),
      referenceName: body.referenceName,
      phone: body.phone,
      city: body.city,
      source: body.source,
      status: body.status,
      notes: body.notes,
      firstContactAt: body.firstContactAt ?? null,
    });

    return Response.json(seed, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar semente." },
      { status: 500 }
    );
  }
}
