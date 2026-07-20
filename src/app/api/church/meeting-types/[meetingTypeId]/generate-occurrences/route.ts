export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { generateChurchOccurrences } from "@/server/repositories/church-repository";

export async function POST(_request: Request, { params }: { params: Promise<{ meetingTypeId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { meetingTypeId } = await params;
    return Response.json(await generateChurchOccurrences(meetingTypeId, { tenantIds: await listAccessibleTenantIds(session) }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao gerar ocorrencias." }, { status: 500 });
  }
}
