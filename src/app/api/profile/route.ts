export const dynamic = "force-dynamic";

import { requireServerAuthSession, setServerAuthSession } from "@/server/auth/session";
import { getUserProfile, updateUserProfile } from "@/server/repositories/profile-repository";

export async function GET() {
  try {
    const session = await requireServerAuthSession();
    return Response.json(await getUserProfile(session));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao carregar perfil." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireServerAuthSession();
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.phone?.trim()) {
      return Response.json({ error: "Campos obrigatorios: firstName, lastName, phone." }, { status: 400 });
    }

    const profile = await updateUserProfile(session, {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      phone: body.phone.trim(),
    });

    await setServerAuthSession({
      ...session,
      user: {
        ...session.user,
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
    });

    return Response.json(profile);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar perfil." }, { status: 500 });
  }
}
