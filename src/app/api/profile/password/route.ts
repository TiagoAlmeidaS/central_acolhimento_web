export const dynamic = "force-dynamic";

import { requireServerAuthSession } from "@/server/auth/session";
import { changeUserPassword } from "@/server/repositories/profile-repository";

export async function PATCH(request: Request) {
  try {
    const session = await requireServerAuthSession();
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!body.currentPassword || !body.newPassword) {
      return Response.json({ error: "Campos obrigatorios: currentPassword, newPassword." }, { status: 400 });
    }

    await changeUserPassword(session, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar senha." }, { status: 500 });
  }
}
