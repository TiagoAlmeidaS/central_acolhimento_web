export const dynamic = "force-dynamic";

import { listAccessibleTenantIds, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createChurchMeetingType, listChurchMeetingTypes } from "@/server/repositories/church-repository";

export async function GET(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const scope = tenantId
      ? { tenantId: await resolveTenantIdForUserAccess(session, tenantId) }
      : { tenantIds: await listAccessibleTenantIds(session) };
    return Response.json(await listChurchMeetingTypes(scope));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao listar tipos de reuniao." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const body = (await request.json()) as {
      tenantId?: string;
      name?: string;
      description?: string;
      color?: string;
      active?: boolean;
      recurrenceKind?: "none" | "weekly";
      weekday?: number | null;
      startsAt?: string | null;
      endsAt?: string | null;
      recurrenceStartsOn?: string | null;
      recurrenceEndsOn?: string | null;
      notes?: string;
    };
    if (!body.tenantId || !body.name?.trim()) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const meetingType = await createChurchMeetingType({
      tenantId: await resolveTenantIdForUserAccess(session, body.tenantId),
      name: body.name.trim(),
      description: body.description ?? "",
      color: body.color ?? "#2D7FF9",
      active: body.active ?? true,
      recurrenceKind: body.recurrenceKind ?? "none",
      weekday: body.weekday ?? null,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      recurrenceStartsOn: body.recurrenceStartsOn ?? null,
      recurrenceEndsOn: body.recurrenceEndsOn ?? null,
      notes: body.notes ?? "",
      createdByTenantUserId: session.membership.tenantUserId,
    });

    return Response.json(meetingType, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao criar tipo de reuniao." }, { status: 500 });
  }
}
