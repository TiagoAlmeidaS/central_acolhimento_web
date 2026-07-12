export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createOutingConstraint } from "@/server/repositories/outing-repository";

export async function POST(request: Request, { params }: { params: Promise<{ outingId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { outingId } = await params;
    const body = (await request.json()) as { label?: string; participantIds?: string[] };

    if (!body.label?.trim() || !Array.isArray(body.participantIds)) {
      return Response.json({ error: "Campos obrigatorios: label, participantIds." }, { status: 400 });
    }

    const constraint = await createOutingConstraint(
      {
        outingEventId: outingId,
        label: body.label.trim(),
        participantIds: body.participantIds,
      },
      { tenantIds: await listAccessibleTenantIds(session) },
    );

    return Response.json(constraint, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao criar vinculo." }, { status: 500 });
  }
}
