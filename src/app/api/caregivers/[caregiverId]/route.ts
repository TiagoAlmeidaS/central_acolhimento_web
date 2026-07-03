import { updateCaregiver } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ caregiverId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { caregiverId } = await context.params;
    const body = (await request.json()) as {
      tenantId?: string;
      tenantUserId?: string | null;
      name?: string;
      phone?: string;
      email?: string | null;
      active?: boolean;
      notes?: string;
    };

    if (!body.tenantId || !body.name) {
      return Response.json({ error: "Campos obrigatorios: tenantId, name." }, { status: 400 });
    }

    const caregiver = await updateCaregiver(caregiverId, {
      tenantId: body.tenantId,
      tenantUserId: body.tenantUserId ?? null,
      name: body.name,
      phone: body.phone,
      email: body.email ?? null,
      active: body.active,
      notes: body.notes,
    });

    return Response.json(caregiver);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao editar cuidador." },
      { status: 500 }
    );
  }
}
