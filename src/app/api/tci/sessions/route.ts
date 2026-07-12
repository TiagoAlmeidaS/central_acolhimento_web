export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createTciSession, listTciSessions } from "@/server/repositories/tci-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;
    const scope = requestedTenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, requestedTenantId) }
      : { tenantIds: await listAccessibleTenantIds(session) };

    const weekStart = searchParams.get("weekStart") ?? undefined;
    const caregiverId = searchParams.get("caregiverId") ?? undefined;
    const chamberId = searchParams.get("chamberId") ?? undefined;
    const status = (searchParams.get("status") as "draft" | "scheduled" | "confirmed" | "completed" | "cancelled" | "") ?? "";

    return Response.json(await listTciSessions(scope, { weekStart, caregiverId, chamberId, status }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao listar sessoes TCI." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const body = (await request.json()) as {
      tenantId?: string;
      title?: string;
      description?: string;
      scheduledDate?: string;
      startsAt?: string;
      endsAt?: string;
      chamberId?: string;
      caregiverIds?: string[];
      caregiverRoles?: Array<{ caregiverId: string; role?: string | null }>;
      status?: "draft" | "scheduled" | "confirmed" | "completed" | "cancelled";
      notes?: string;
    };

    if (!body.tenantId || !body.title?.trim() || !body.scheduledDate || !body.startsAt || !body.endsAt || !body.chamberId) {
      return Response.json({ error: "Campos obrigatorios: tenantId, title, scheduledDate, startsAt, endsAt, chamberId." }, { status: 400 });
    }

    const created = await createTciSession(
      {
        tenantId: await resolveTenantIdForUserAccess(session, body.tenantId),
        title: body.title.trim(),
        description: body.description ?? "",
        scheduledDate: body.scheduledDate,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        chamberId: body.chamberId,
        caregiverIds: Array.isArray(body.caregiverIds) ? body.caregiverIds : [],
        caregiverRoles: body.caregiverRoles,
        status: body.status,
        notes: body.notes ?? "",
        createdByTenantUserId: session.membership.tenantUserId,
      },
      { tenantIds: await listAccessibleTenantIds(session) },
    );

    return Response.json(created, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao criar sessao TCI." }, { status: 500 });
  }
}
