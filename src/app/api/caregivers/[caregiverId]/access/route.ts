import { assertSessionCanAccessRecord, assertSessionRole, getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createAccessForExistingCaregiver } from "@/server/repositories/auth-repository";
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

    if (caregiver.tenantUserId) {
      return Response.json({ error: "Este cuidador ja possui acesso vinculado." }, { status: 409 });
    }

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return Response.json({ error: "Campos obrigatorios: email, password." }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const result = await createAccessForExistingCaregiver({
      caregiverId: caregiver.id,
      tenantId: caregiver.tenantId,
      caregiverName: caregiver.name,
      phone: caregiver.phone,
      email,
      password,
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar acesso do cuidador." },
      { status: 500 },
    );
  }
}
