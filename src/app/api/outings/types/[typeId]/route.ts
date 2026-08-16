import { resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { updateOutingType } from "@/server/repositories/outing-repository";

export async function PUT(request: Request, { params }: { params: Promise<{ typeId: string }> }) {
  try {
    const session = await requireServerAuthSession();
    if (session.membership.role !== "coordinator") return Response.json({ error: "Perfil sem permissao para administrar tipos de saida." }, { status: 403 });
    const { typeId } = await params;
    const body = (await request.json()) as { tenantId?: string; name?: string; description?: string; active?: boolean };
    if (!body.tenantId || !body.name?.trim()) return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    const tenantId = await resolveTenantIdForUserAccess(session, body.tenantId);
    return Response.json(await updateOutingType(typeId, { tenantId, name: body.name, description: body.description, active: body.active }, { tenantId }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar tipo de saida." }, { status: 500 });
  }
}
