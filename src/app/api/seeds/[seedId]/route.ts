import { updateSeed } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ seedId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { seedId } = await context.params;
    const body = (await request.json()) as {
      tenantId?: string;
      caregiverId?: string | null;
      referenceName?: string;
      phone?: string;
      city?: string;
      source?: string;
      status?: "new" | "contacted" | "in_progress" | "consolidated" | "inactive";
      notes?: string;
      firstContactAt?: string | null;
    };

    if (!body.tenantId || !body.referenceName) {
      return Response.json(
        { error: "Campos obrigatorios: tenantId, referenceName." },
        { status: 400 }
      );
    }

    const seed = await updateSeed(seedId, {
      tenantId: body.tenantId,
      caregiverId: body.caregiverId ?? null,
      referenceName: body.referenceName,
      phone: body.phone,
      city: body.city,
      source: body.source,
      status: body.status,
      notes: body.notes,
      firstContactAt: body.firstContactAt ?? null,
    });

    return Response.json(seed);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao editar novo contato." },
      { status: 500 }
    );
  }
}
