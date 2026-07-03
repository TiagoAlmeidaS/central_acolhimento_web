import { createSeed, listSeeds } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const seeds = await listSeeds();
    return Response.json(seeds);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao listar sementes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const seed = await createSeed({
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

    return Response.json(seed, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar semente." },
      { status: 500 }
    );
  }
}
