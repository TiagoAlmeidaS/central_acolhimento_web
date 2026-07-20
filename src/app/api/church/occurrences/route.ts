export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createChurchOccurrence, listChurchOccurrences } from "@/server/repositories/church-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const scope = tenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, tenantId) }
      : { tenantIds: await listAccessibleTenantIds(session) };
    return Response.json(await listChurchOccurrences(scope));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao listar ocorrencias." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const body = (await request.json()) as { tenantId?: string; meetingTypeId?: string; occursOn?: string; startsAt?: string | null; endsAt?: string | null; notes?: string };
    if (!body.tenantId || !body.meetingTypeId || !body.occursOn) {
      return Response.json({ error: "Campos obrigatorios: tenantId, meetingTypeId, occursOn." }, { status: 400 });
    }
    return Response.json(
      await createChurchOccurrence({
        tenantId: await resolveTenantIdForUserAccess(session, body.tenantId),
        meetingTypeId: body.meetingTypeId,
        occursOn: body.occursOn,
        startsAt: body.startsAt ?? null,
        endsAt: body.endsAt ?? null,
        notes: body.notes ?? "",
      }),
      { status: 201 },
    );
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao criar ocorrencia." }, { status: 500 });
  }
}
