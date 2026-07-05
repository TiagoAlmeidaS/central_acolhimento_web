import {
  assertSessionCanAccessRecord,
  getDataScopeFromSession,
  resolveCaregiverId,
  resolveTenantId,
} from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { listFollowups, updateFollowup } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ followupId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    const { followupId } = await context.params;
    const currentFollowup = (await listFollowups(getDataScopeFromSession(session))).find((item) => item.id === followupId);
    if (!currentFollowup) {
      return Response.json({ error: "Acompanhamento nao encontrado." }, { status: 404 });
    }
    assertSessionCanAccessRecord(session, currentFollowup);
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
      return Response.json({ error: "Campos obrigatorios: tenantId, memberId, type." }, { status: 400 });
    }

    const followup = await updateFollowup(followupId, {
      tenantId: resolveTenantId(session, body.tenantId),
      memberId: body.memberId,
      caregiverId: resolveCaregiverId(session, body.caregiverId ?? null, { allowUnassignedForCoordinator: true }),
      type: body.type,
      occurredAt: body.occurredAt,
      notes: body.notes,
      nextActionAt: body.nextActionAt ?? null,
    });

    return Response.json(followup);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao editar acompanhamento." },
      { status: 500 }
    );
  }
}
