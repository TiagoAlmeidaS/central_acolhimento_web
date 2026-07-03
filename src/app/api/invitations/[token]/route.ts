import { getCaregiverInvitationByToken } from "@/server/repositories/invitation-repository";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const invitation = await getCaregiverInvitationByToken(token);

    if (!invitation) {
      return Response.json({ error: "Convite nao encontrado." }, { status: 404 });
    }

    return Response.json(invitation);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar convite." },
      { status: 500 }
    );
  }
}
