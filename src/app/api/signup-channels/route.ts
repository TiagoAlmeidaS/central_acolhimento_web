export const dynamic = "force-dynamic";

import { assertSessionRole, resolveTenantId } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import {
  createCaregiverSignupChannel,
  listCaregiverSignupChannels,
} from "@/server/repositories/signup-channel-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;
    const tenantId = resolveTenantId(session, requestedTenantId);
    const channels = await listCaregiverSignupChannels(tenantId);
    return Response.json(channels);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao listar canais globais." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const body = (await request.json()) as {
      tenantId?: string;
      name?: string;
      expiresInDays?: number | null;
      maxUses?: number | null;
      role?: "coordinator" | "caregiver";
      requireApproval?: boolean;
      allowedEmailDomain?: string | null;
    };

    if (!body.tenantId || !body.name) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const channel = await createCaregiverSignupChannel({
      tenantId: resolveTenantId(session, body.tenantId),
      name: body.name,
      expiresInDays: body.expiresInDays ?? null,
      maxUses: body.maxUses ?? null,
      createdByTenantUserId: session.membership.tenantUserId,
      role: body.role,
      requireApproval: body.requireApproval,
      allowedEmailDomain: body.allowedEmailDomain ?? null,
    });

    return Response.json(channel, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar canal global." },
      { status: 500 }
    );
  }
}
