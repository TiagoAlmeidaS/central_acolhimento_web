export const dynamic = "force-dynamic";

import { listCaregivers, listMembers, listSeeds, listTenants } from "@/server/repositories/mvp-repository";
import { listCaregiverInvitations } from "@/server/repositories/invitation-repository";
import {
  listCaregiverSignupChannels,
  listCaregiverSignupChannelUses,
} from "@/server/repositories/signup-channel-repository";
import { getDataScopeFromSession } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";
import { CaregiversWorkspace, type CaregiversTab } from "@/ui/coord/caregivers-workspace";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TABS: CaregiversTab[] = ["equipe", "convites", "canais"];

export default async function CaregiversPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await requireServerAuthSession("coordinator");
  const scope = getDataScopeFromSession(session);
  const [caregivers, tenants, members, seeds, invitations, channels] = await Promise.all([
    listCaregivers(scope),
    listTenants(scope),
    listMembers(scope),
    listSeeds(scope),
    listCaregiverInvitations(session.membership.tenantId),
    listCaregiverSignupChannels(session.membership.tenantId),
  ]);
  const uses = (await Promise.all(channels.map((channel) => listCaregiverSignupChannelUses(channel.id)))).flat();

  const rawTab = Array.isArray(params.aba) ? params.aba[0] : params.aba;
  const initialTab = TABS.find((tab) => tab === rawTab);

  return (
    <CaregiversWorkspace
      caregivers={caregivers}
      tenants={tenants}
      members={members}
      // A foto da casa nao e usada aqui; evita carregar dezenas de KB por contato no cliente.
      seeds={seeds.map((seed) => ({ ...seed, houseFrontImageUrl: null }))}
      invitations={invitations}
      channels={channels}
      uses={uses}
      initialTab={initialTab}
    />
  );
}
