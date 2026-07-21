import { assertSessionCanAccessRecord, assertSessionRole, getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { resetExistingCaregiverPassword } from "@/server/repositories/auth-repository";
import { listCaregivers } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ caregiverId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const { caregiverId } = await context.params;
    const caregiver = (await listCaregivers(getDataScopeFromSession(session))).find((item) => item.id === caregiverId);

    if (!caregiver) {
      return Response.json({ error: "Cuidador nao encontrado." }, { status: 404 });
    }

    assertSessionCanAccessRecord(session, caregiver);

    if (!caregiver.tenantUserId) {
      return Response.json({ error: "Este cuidador ainda nao possui acesso vinculado." }, { status: 409 });
    }

    const body = (await request.json()) as {
      password?: string;
    };
    const password = body.password ?? "";

    if (!password) {
      return Response.json({ error: "Campo obrigatorio: password." }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const result = await resetExistingCaregiverPassword({
      caregiverId: caregiver.id,
      tenantId: caregiver.tenantId,
      tenantUserId: caregiver.tenantUserId,
      newPassword: password,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao redefinir senha do cuidador." },
      { status: 500 },
    );
  }
}
