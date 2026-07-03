import { createFollowup, listFollowups } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const followups = await listFollowups();
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
      tenantId: body.tenantId,
      memberId: body.memberId,
      caregiverId: body.caregiverId ?? null,
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
