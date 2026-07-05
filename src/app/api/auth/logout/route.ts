export const dynamic = "force-dynamic";

import { clearServerAuthSession } from "@/server/auth/session";

export async function POST() {
  try {
    await clearServerAuthSession();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao encerrar sessao." },
      { status: 500 }
    );
  }
}
