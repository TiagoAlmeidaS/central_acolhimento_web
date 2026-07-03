import { assignCaregiverToMember } from "@/server/repositories/mvp-repository";

type RouteContext = {
  params: Promise<{ memberId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { memberId } = await context.params;
    const body = (await request.json()) as { caregiverId?: string | null };

    const member = await assignCaregiverToMember(memberId, body.caregiverId ?? null);
    return Response.json(member);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao atribuir cuidador." },
      { status: 500 }
    );
  }
}
