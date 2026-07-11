export const dynamic = "force-dynamic";

import { consumePasswordResetToken, updateAppUserPassword } from "@/server/repositories/auth-repository";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string; newPassword?: string };

    const token = body.token?.trim() ?? "";
    const newPassword = body.newPassword ?? "";

    if (!token) {
      return Response.json({ error: "Token inválido." }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 8) {
      return Response.json(
        { error: "A nova senha deve ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    // Valida token e obtém o appUserId (lança erro se inválido/expirado)
    const appUserId = await consumePasswordResetToken(token);

    // Atualiza a senha com novo hash scrypt
    await updateAppUserPassword(appUserId, newPassword);

    return Response.json({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível redefinir a senha.";
    return Response.json({ error: message }, { status: 400 });
  }
}
