import { createMember, listMembers } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const members = await listMembers();
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
    const body = (await request.json()) as {
      tenantId?: string;
      caregiverId?: string | null;
      seedId?: string | null;
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      birthDate?: string | null;
      status?: "new" | "in_progress" | "consolidated" | "inactive";
      notes?: string;
    };

    if (!body.tenantId || !body.name) {
      return Response.json(
        { error: "Campos obrigatorios: tenantId, name." },
        { status: 400 }
      );
    }

    const member = await createMember({
      tenantId: body.tenantId,
      caregiverId: body.caregiverId ?? null,
      seedId: body.seedId ?? null,
      name: body.name,
      phone: body.phone,
      address: body.address,
      city: body.city,
      birthDate: body.birthDate ?? null,
      status: body.status,
      notes: body.notes,
    });

    return Response.json(member, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar membro." },
      { status: 500 }
    );
  }
}
