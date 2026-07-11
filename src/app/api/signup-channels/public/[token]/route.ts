export const dynamic = "force-dynamic";

import { getCaregiverSignupChannelByToken } from "@/server/repositories/signup-channel-repository";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const channel = await getCaregiverSignupChannelByToken(token);

    if (!channel) {
      return Response.json({ error: "Canal global nao encontrado." }, { status: 404 });
    }

    return Response.json(channel);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar canal global." },
      { status: 500 }
    );
  }
}
