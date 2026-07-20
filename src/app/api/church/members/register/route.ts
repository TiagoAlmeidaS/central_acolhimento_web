export const dynamic = "force-dynamic";

import { resolveCaregiverId, resolveTenantIdForUserAccess } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { registerChurchMember } from "@/server/repositories/church-repository";

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const body = (await request.json()) as {
      tenantId?: string;
      caregiverId?: string | null;
      name?: string;
      age?: number | null;
      phone?: string;
      city?: string;
      birthDate?: string | null;
      notes?: string;
      churchStartedAt?: string | null;
      churchNotes?: string;
    };

    if (!body.tenantId || !body.name?.trim()) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const tenantId = await resolveTenantIdForUserAccess(session, body.tenantId);
    const membership = await registerChurchMember({
      tenantId,
      caregiverId: resolveCaregiverId(session, body.caregiverId ?? null, { allowUnassignedForCoordinator: true }),
      name: body.name.trim(),
      age: body.age ?? null,
      phone: body.phone ?? "",
      city: body.city ?? "",
      birthDate: body.birthDate ?? null,
      status: "in_progress",
      notes: body.notes ?? "",
      createdByTenantUserId: session.membership.tenantUserId,
      churchStartedAt: body.churchStartedAt ?? null,
      churchNotes: body.churchNotes ?? "",
    });

    return Response.json(membership, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao cadastrar membro da Igreja." }, { status: 500 });
  }
}
