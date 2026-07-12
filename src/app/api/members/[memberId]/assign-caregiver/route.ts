import {
  assertSessionCanAccessRecord,
  assertSessionRole,
  getDataScopeFromSession,
  listAccessibleTenantIds,
} from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { assignCaregiverToMember, listMembers } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ memberId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const { memberId } = await context.params;
    const currentMember = session.membership.role === "coordinator"
      ? (await Promise.all((await listAccessibleTenantIds(session)).map((tenantId) => listMembers({ tenantId })))).flat().find((item) => item.id === memberId)
      : (await listMembers(getDataScopeFromSession(session))).find((item) => item.id === memberId);
    if (!currentMember) {
      return Response.json({ error: "Membro nao encontrado." }, { status: 404 });
    }
    assertSessionCanAccessRecord(session, currentMember);
    const body = (await request.json()) as { caregiverId?: string | null };

    const member = await assignCaregiverToMember(memberId, body.caregiverId ?? null);
    return Response.json(member);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao atribuir cuidador." },
      { status: 500 }
    );
  }
}
