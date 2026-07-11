export const dynamic = "force-dynamic";

import { assertSessionRole } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import {
  approveCaregiverSignupChannelUse,
  getCaregiverSignupChannelById,
} from "@/server/repositories/signup-channel-repository";

type RouteContext = {
  params: Promise<{ channelId: string; useId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const { channelId, useId } = await context.params;
    const channel = await getCaregiverSignupChannelById(channelId);

    if (!channel || channel.tenantId !== session.membership.tenantId) {
      return Response.json({ error: "Canal global nao encontrado." }, { status: 404 });
    }

    const result = await approveCaregiverSignupChannelUse(channelId, useId, session.membership.tenantUserId);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao aprovar cadastro pelo canal global." },
      { status: 500 }
    );
  }
}
