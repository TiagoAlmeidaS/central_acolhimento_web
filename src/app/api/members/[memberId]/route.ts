import { updateMember } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ memberId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { memberId } = await context.params;
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
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const member = await updateMember(memberId, {
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

    return Response.json(member);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao editar membro." },
      { status: 500 }
    );
  }
}
