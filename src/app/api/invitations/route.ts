export const dynamic = "force-dynamic";

import { assertSessionRole, getDataScopeFromSession, resolveTenantId } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createCaregiverInvitation, listCaregiverInvitations } from "@/server/repositories/invitation-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;
    const tenantId = resolveTenantId(session, requestedTenantId);
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
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const body = (await request.json()) as {
      tenantId?: string;
      email?: string | null;
      expiresInDays?: number;
      role?: "coordinator" | "caregiver";
    };

    if (!body.tenantId) {
      return Response.json({ error: "Campo obrigatorio: tenantId." }, { status: 400 });
    }

    const invitation = await createCaregiverInvitation({
      tenantId: resolveTenantId(session, body.tenantId),
      email: body.email ?? null,
      expiresInDays: body.expiresInDays,
      createdByTenantUserId: session.membership.tenantUserId,
      role: body.role,
    });

    return Response.json(invitation, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar convite." },
      { status: 500 }
    );
  }
}
