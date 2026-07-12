export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { updateTciChamber } from "@/server/repositories/tci-repository";

export async function PUT(request: Request, { params }: { params: Promise<{ chamberId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { chamberId } = await params;
    const body = (await request.json()) as {
      tenantId?: string;
      name?: string;
      description?: string;
      capacity?: number | null;
      active?: boolean;
    };

    if (!body.tenantId || !body.name?.trim()) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const chamber = await updateTciChamber(
      chamberId,
      {
        tenantId: body.tenantId,
        name: body.name.trim(),
        description: body.description ?? "",
        capacity: body.capacity ?? null,
        active: body.active ?? true,
      },
      { tenantIds: await listAccessibleTenantIds(session) },
    );

    return Response.json(chamber);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar camara." }, { status: 500 });
  }
}
