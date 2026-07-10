export const dynamic = "force-dynamic";

import { getDataScopeFromSession, resolveCaregiverId, resolveTenantId } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { createMember, listMembers } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const session = await requireServerAuthSession();
    const members = await listMembers(getDataScopeFromSession(session));
    return Response.json(members);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao listar membros." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerAuthSession();
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
      return Response.json(
        { error: "Campos obrigatorios: tenantId, name." },
        { status: 400 }
      );
    }

    const member = await createMember({
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

    return Response.json(member, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar membro." },
      { status: 500 }
    );
  }
}
