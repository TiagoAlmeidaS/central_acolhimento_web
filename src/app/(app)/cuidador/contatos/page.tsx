export const dynamic = "force-dynamic";

import { listFollowups, listMembers, listSeeds } from "@/server/repositories/mvp-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { MobileShell } from "@/ui/navigation/mobile-shell";
import { CareWorkspace } from "@/ui/cuidador/care-workspace";
import type { ContactFilter } from "@/ui/cuidador/care-contacts";

const FILTERS: ContactFilter[] = ["ativos", "precisa", "novos", "visita", "acompanhando", "concluidos", "inativos"];

export default async function CaregiverContactsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ filtro?: string }> }>) {
  const session = await requireServerAuthSession("caregiver");
  const scope = getDataScopeFromSession(session);
  const { filtro } = await searchParams;
  const [members, seeds, followups] = await Promise.all([
    listMembers(scope),
    listSeeds(scope),
    listFollowups(scope),
  ]);

  return (
    <MobileShell>
      <CareWorkspace
        view="contatos"
        members={members}
        seeds={seeds}
        followups={followups}
        session={session}
        nowIso={new Date().toISOString()}
        initialFilter={FILTERS.find((item) => item === filtro)}
      />
    </MobileShell>
  );
}
