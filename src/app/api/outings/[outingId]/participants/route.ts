export const dynamic = "force-dynamic";

import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { addOutingParticipant } from "@/server/repositories/outing-repository";

export async function POST(request: Request, { params }: { params: Promise<{ outingId: string }> }) {
  try {
    const session = await requireServerAuthSession("coordinator");
    const { outingId } = await params;
    const body = (await request.json()) as {
      participantType?: "caregiver" | "member" | "guest";
      participantId?: string | null;
      displayName?: string;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      email?: string | null;
      hasCar?: boolean;
      carSeats?: number;
      isDriver?: boolean;
      notes?: string;
    };

    if (!body.participantType) {
      return Response.json({ error: "Campo obrigatorio: participantType." }, { status: 400 });
    }

    const participant = await addOutingParticipant(
      {
        outingEventId: outingId,
        participantType: body.participantType,
        participantId: body.participantId ?? null,
        displayName: body.displayName,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        hasCar: body.hasCar,
        carSeats: body.carSeats,
        isDriver: body.isDriver,
        notes: body.notes,
      },
      { tenantIds: await listAccessibleTenantIds(session) },
    );

    return Response.json(participant, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao adicionar participante." }, { status: 500 });
  }
}
