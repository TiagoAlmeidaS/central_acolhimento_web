import { updateFollowup } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ followupId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { followupId } = await context.params;
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
      tenantId: body.tenantId,
      memberId: body.memberId,
      caregiverId: body.caregiverId ?? null,
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
