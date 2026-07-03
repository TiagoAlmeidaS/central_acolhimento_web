import { createCaregiverInvitation, listCaregiverInvitations } from "@/server/repositories/invitation-repository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") ?? undefined;
    const invitations = await listCaregiverInvitations(tenantId);
    return Response.json(invitations);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao listar convites." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      tenantId?: string;
      email?: string | null;
      expiresInDays?: number;
    };

    if (!body.tenantId) {
      return Response.json({ error: "Campo obrigatorio: tenantId." }, { status: 400 });
    }

    const invitation = await createCaregiverInvitation({
      tenantId: body.tenantId,
      email: body.email ?? null,
      expiresInDays: body.expiresInDays,
    });

    return Response.json(invitation, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar convite." },
      { status: 500 }
    );
  }
}
