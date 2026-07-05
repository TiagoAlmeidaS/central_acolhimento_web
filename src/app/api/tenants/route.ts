export const dynamic = "force-dynamic";

import { assertSessionRole, getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createTenant, listTenants } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const session = await requireServerAuthSession("coordinator");
    const tenants = await listTenants(getDataScopeFromSession(session));
    return Response.json(tenants);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao listar cidades." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession();
    assertSessionRole(session, "coordinator");
    const body = (await request.json()) as {
      name?: string;
      city?: string;
      state?: string;
      status?: "active" | "inactive";
      coordinator?: string | null;
    };

    if (!body.name || !body.city || !body.state) {
      return Response.json(
        { error: "Campos obrigatorios: name, city, state." },
        { status: 400 }
      );
    }

    const tenant = await createTenant({
      name: body.name,
      city: body.city,
      state: body.state,
      status: body.status,
      coordinator: body.coordinator ?? null,
    });

    return Response.json(tenant, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar cidade." },
      { status: 500 }
    );
  }
}
