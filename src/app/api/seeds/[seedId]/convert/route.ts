import { convertSeedToMember } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ seedId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { seedId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      caregiverId?: string | null;
      address?: string;
      birthDate?: string | null;
      notes?: string;
    };

    const member = await convertSeedToMember(seedId, {
      caregiverId: body.caregiverId ?? null,
      address: body.address,
      birthDate: body.birthDate ?? null,
      notes: body.notes,
    });

    return Response.json(member, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao converter novo contato em membro." },
      { status: 500 }
    );
  }
}
