export const dynamic = "force-dynamic";

import { assertSessionRole, getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createTenant, listTenants } from "@/server/repositories/mvp-repository";
import { listUserMemberships, appendLocalUserMembership } from "@/server/repositories/auth-repository";
import { getDbPool, isDatabaseConfigured } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireServerAuthSession("coordinator");
    const [memberships, allTenants] = await Promise.all([
      listUserMemberships(session.user.id),
      listTenants(),
    ]);
    const activeTenantId = session.membership.tenantId;
    const tenants = allTenants.filter(
      (t) => t.id === activeTenantId || memberships.some((m) => m.tenantId === t.id)
    );
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

    // Automatically link the new tenant to the creator's user account as coordinator
    if (isDatabaseConfigured()) {
      const db = getDbPool();
      if (db) {
        const fullName = `${session.user.firstName} ${session.user.lastName}`.trim();
        await db.query(
          `insert into tenant_users (tenant_id, auth_user_id, app_user_id, name, email, role, active)
           values ($1, $2, $3, $4, $5, 'coordinator', true)`,
          [tenant.id, session.user.id, session.user.id, fullName, session.user.email]
        );
      }
    } else {
      appendLocalUserMembership(session.user.email, {
        tenantUserId: crypto.randomUUID(),
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantCity: tenant.city,
        tenantState: tenant.state,
        role: "coordinator",
        caregiverId: null,
      });
    }

    return Response.json(tenant, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar cidade." },
      { status: 500 }
    );
  }
}
