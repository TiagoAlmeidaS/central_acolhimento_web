export const dynamic = "force-dynamic";

import { getServerAuthSession } from "@/server/auth/session";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    return Response.json({ session });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar sessao." },
      { status: 500 }
    );
  }
}
