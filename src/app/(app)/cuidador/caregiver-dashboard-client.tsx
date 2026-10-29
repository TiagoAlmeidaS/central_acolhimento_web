"use client";

import type { AuthSession, Followup, Member, Seed } from "@/server/domain/mvp";
import { CareWorkspace } from "@/ui/cuidador/care-workspace";

/**
 * Painel do cuidador (`/cuidador`). A tela inteira (precisa de você, ações rápidas, meus contatos,
 * próximos compromissos e os drawers) vive em `src/ui/cuidador`; aqui só entram os dados.
 */
export function CaregiverDashboardClient({
  initialMembers,
  initialSeeds,
  initialFollowups,
  session,
  nowIso,
}: Readonly<{
  initialMembers: Member[];
  initialSeeds: Seed[];
  initialFollowups: Followup[];
  session: AuthSession;
  nowIso: string;
}>) {
  return (
    <CareWorkspace
      view="painel"
      members={initialMembers}
      seeds={initialSeeds}
      followups={initialFollowups}
      session={session}
      nowIso={nowIso}
    />
  );
}
