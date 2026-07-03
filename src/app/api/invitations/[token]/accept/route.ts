import { acceptCaregiverInvitation } from "@/server/repositories/invitation-repository";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.password) {
      return Response.json(
        { error: "Campos obrigatorios: firstName, lastName, email, phone, password." },
        { status: 400 }
      );
    }

    const result = await acceptCaregiverInvitation(token, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      password: body.password,
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro ao aceitar convite." },
      { status: 500 }
    );
  }
}
