export const dynamic = "force-dynamic";

import { getDataScopeFromSession, resolveCaregiverId, resolveTenantId } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createFollowup, listFollowups } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const session = await requireServerAuthSession();
    const followups = await listFollowups(getDataScopeFromSession(session));
    return Response.json(followups);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao listar acompanhamentos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession();
    const body = (await request.json()) as {
      tenantId?: string;
      memberId?: string;
      caregiverId?: string | null;
      type?: "visit" | "call" | "message" | "prayer" | "other";
      occurredAt?: string;
      notes?: string;
      nextActionAt?: string | null;
    };

    if (!body.tenantId || !body.memberId || !body.type) {
      return Response.json(
        { error: "Campos obrigatorios: tenantId, memberId, type." },
        { status: 400 }
      );
    }

    const followup = await createFollowup({
      tenantId: resolveTenantId(session, body.tenantId),
      memberId: body.memberId,
      caregiverId: resolveCaregiverId(session, body.caregiverId ?? null, { allowUnassignedForCoordinator: true }),
      type: body.type,
      occurredAt: body.occurredAt,
      notes: body.notes,
      nextActionAt: body.nextActionAt ?? null,
    });

    return Response.json(followup, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar acompanhamento." },
      { status: 500 }
    );
  }
}
