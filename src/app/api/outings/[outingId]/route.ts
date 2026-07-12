export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { getOutingDetail, updateOuting } from "@/server/repositories/outing-repository";

export async function GET(_: Request, { params }: { params: Promise<{ outingId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { outingId } = await params;
    const detail = await getOutingDetail(outingId, { tenantIds: await listAccessibleTenantIds(session) });
    return Response.json(detail);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao carregar saida." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ outingId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { outingId } = await params;
    const body = (await request.json()) as {
      tenantId?: string;
      name?: string;
      description?: string;
      scheduledFor?: string | null;
      targetGroupSize?: number;
      allowGroupsWithoutCar?: boolean;
    };

    if (!body.tenantId || !body.name?.trim()) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const outing = await updateOuting(
      outingId,
      {
        tenantId: body.tenantId,
        name: body.name.trim(),
        description: body.description ?? "",
        scheduledFor: body.scheduledFor ?? null,
        targetGroupSize: body.targetGroupSize,
        allowGroupsWithoutCar: body.allowGroupsWithoutCar,
      },
      { tenantIds: await listAccessibleTenantIds(session) },
    );

    return Response.json(outing);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar saida." }, { status: 500 });
  }
}
