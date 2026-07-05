export const dynamic = "force-dynamic";

import {
  assertSessionRole,
  getDataScopeFromSession,
  resolveCaregiverId,
  resolveTenantId,
} from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createCaregiver, listCaregivers } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const session = await requireServerAuthSession("coordinator");
    const caregivers = await listCaregivers(getDataScopeFromSession(session));
    return Response.json(caregivers);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao listar cuidadores." },
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
      tenantUserId?: string | null;
      name?: string;
      phone?: string;
      email?: string | null;
      active?: boolean;
      notes?: string;
    };

    if (!body.tenantId || !body.name) {
      return Response.json(
        { error: "Campos obrigatorios: tenantId, name." },
        { status: 400 }
      );
    }

    const caregiver = await createCaregiver({
      tenantId: resolveTenantId(session, body.tenantId),
      tenantUserId: body.tenantUserId ?? null,
      name: body.name,
      phone: body.phone,
      email: body.email ?? null,
      active: body.active,
      notes: body.notes,
    });

    return Response.json(caregiver, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar cuidador." },
      { status: 500 }
    );
  }
}
