import { assertSessionCanAccessRecord, getDataScopeFromSession, resolveCaregiverId } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { convertSeedToMember, listSeeds } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ seedId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireServerAuthSession();
    const { seedId } = await context.params;
    const seed = (await listSeeds(getDataScopeFromSession(session))).find((item) => item.id === seedId);
    if (!seed) {
      return Response.json({ error: "Novo contato nao encontrado." }, { status: 404 });
    }
    assertSessionCanAccessRecord(session, seed);
    const body = (await request.json().catch(() => ({}))) as {
      caregiverId?: string | null;
      address?: string;
      birthDate?: string | null;
      notes?: string;
    };

    const member = await convertSeedToMember(seedId, {
      caregiverId: resolveCaregiverId(session, body.caregiverId ?? seed.caregiverId ?? null, {
        allowUnassignedForCoordinator: true,
      }),
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
