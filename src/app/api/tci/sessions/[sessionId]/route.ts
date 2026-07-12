export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { getTciSession, updateTciSession } from "@/server/repositories/tci-repository";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { sessionId } = await params;
    return Response.json(await getTciSession(sessionId, { tenantIds: await listAccessibleTenantIds(session) }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao carregar sessao TCI." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { sessionId } = await params;
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

    const updated = await updateTciSession(
      sessionId,
      {
        tenantId: body.tenantId,
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
      },
      { tenantIds: await listAccessibleTenantIds(session) },
    );

    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar sessao TCI." }, { status: 500 });
  }
}
