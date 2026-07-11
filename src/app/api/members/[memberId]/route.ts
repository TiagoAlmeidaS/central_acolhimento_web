import {
  assertSessionCanAccessRecord,
  getDataScopeFromSession,
  resolveCaregiverId,
  resolveTenantId,
} from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { deleteMember, listMembers, updateMember } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ memberId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    const { memberId } = await context.params;
    const currentMember = (await listMembers(getDataScopeFromSession(session))).find((item) => item.id === memberId);
    if (!currentMember) {
      return Response.json({ error: "Membro nao encontrado." }, { status: 404 });
    }
    assertSessionCanAccessRecord(session, currentMember);
    const body = (await request.json()) as {
      tenantId?: string;
      caregiverId?: string | null;
      seedId?: string | null;
      name?: string;
      age?: number | null;
      phone?: string;
      address?: string;
      postalCode?: string;
      street?: string;
      neighborhood?: string;
      addressNumber?: string;
      state?: string;
      city?: string;
      birthDate?: string | null;
      status?: "new" | "in_progress" | "consolidated" | "inactive";
      notes?: string;
      latitude?: number | null;
      longitude?: number | null;
      isUrgent?: boolean;
    };

    if (!body.tenantId || !body.name) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const member = await updateMember(memberId, {
      tenantId: resolveTenantId(session, body.tenantId),
      caregiverId: resolveCaregiverId(session, body.caregiverId ?? null, { allowUnassignedForCoordinator: true }),
      seedId: body.seedId ?? null,
      name: body.name,
      age: body.age ?? null,
      phone: body.phone,
      address: body.address,
      postalCode: body.postalCode,
      street: body.street,
      neighborhood: body.neighborhood,
      addressNumber: body.addressNumber,
      state: body.state,
      city: body.city,
      birthDate: body.birthDate ?? null,
      status: body.status,
      notes: body.notes,
      latitude: body.latitude,
      longitude: body.longitude,
      isUrgent: body.isUrgent,
    });

    return Response.json(member);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao editar membro." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    const { memberId } = await context.params;
    const currentMember = (await listMembers(getDataScopeFromSession(session))).find((item) => item.id === memberId);
    if (!currentMember) {
      return Response.json({ error: "Membro nao encontrado." }, { status: 404 });
    }

    assertSessionCanAccessRecord(session, currentMember);
    await deleteMember(memberId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir membro." },
      { status: 500 }
    );
  }
}
