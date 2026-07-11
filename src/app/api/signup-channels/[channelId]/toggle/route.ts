export const dynamic = "force-dynamic";

import { assertSessionRole } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { getCaregiverSignupChannelById, toggleCaregiverSignupChannel } from "@/server/repositories/signup-channel-repository";

type RouteContext = {
  params: Promise<{ channelId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const { channelId } = await context.params;
    const channel = await getCaregiverSignupChannelById(channelId);

    if (!channel || channel.tenantId !== session.membership.tenantId) {
      return Response.json({ error: "Canal global nao encontrado." }, { status: 404 });
    }

    const updated = await toggleCaregiverSignupChannel(channelId);
    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao alterar status do canal." },
      { status: 500 }
    );
  }
}
