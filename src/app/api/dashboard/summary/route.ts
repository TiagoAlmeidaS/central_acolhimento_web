export const dynamic = "force-dynamic";

import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { getDashboardSummary } from "@/server/repositories/mvp-repository";

export async function GET() {
  try {
    const session = await requireServerAuthSession();
    const cards = await getDashboardSummary(getDataScopeFromSession(session));
    return Response.json(cards);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar dashboard." },
      { status: 500 }
    );
  }
}
