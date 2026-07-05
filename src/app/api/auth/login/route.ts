export const dynamic = "force-dynamic";

import { setServerAuthSession } from "@/server/auth/session";
import { authenticateLogin } from "@/server/repositories/auth-repository";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      tenantUserId?: string | null;
    };

    if (!body.email || !body.password) {
      return Response.json({ error: "Campos obrigatorios: email, password." }, { status: 400 });
    }

    const result = await authenticateLogin({
      email: body.email,
      password: body.password,
      tenantUserId: body.tenantUserId ?? null,
    });

    if (!result) {
      return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    if (result.type === "select-membership") {
      return Response.json(result);
    }

    await setServerAuthSession(result.session);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao autenticar." },
      { status: 500 }
    );
  }
}
