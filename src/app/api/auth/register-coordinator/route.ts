export const dynamic = "force-dynamic";

import { registerCoordinatorAccount } from "@/server/repositories/auth-repository";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      tenantName?: string;
      city?: string;
      state?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    if (
      !body.tenantName ||
      !body.city ||
      !body.state ||
      !body.firstName ||
      !body.lastName ||
      !body.email ||
      !body.phone ||
      !body.password
    ) {
      return Response.json(
        {
          error:
            "Campos obrigatorios: tenantName, city, state, firstName, lastName, email, phone, password.",
        },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return Response.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const result = await registerCoordinatorAccount({
      tenantName: body.tenantName,
      city: body.city,
      state: body.state,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      password: body.password,
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao criar acesso de coordenacao." },
      { status: 500 }
    );
  }
}
