import { authenticateAppUser } from "@/server/repositories/auth-repository";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return Response.json({ error: "Campos obrigatorios: email, password." }, { status: 400 });
    }

    const user = await authenticateAppUser({
      email: body.email,
      password: body.password,
    });

    if (!user) {
      return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    return Response.json({ user });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao autenticar." },
      { status: 500 }
    );
  }
}
