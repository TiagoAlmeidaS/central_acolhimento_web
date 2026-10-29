export const dynamic = "force-dynamic";

import { listCaregiverInvitations } from "@/server/repositories/invitation-repository";
import { listTenants } from "@/server/repositories/mvp-repository";
import { requireServerAuthSession } from "@/server/auth/session";
import { PageContainer, PageHeader } from "@/ui/atalaia";
import { SettingsLayout } from "@/ui/gestao";
import { CaregiverInvitationManager } from "@/ui/mvp/caregiver-invitation-manager";
import { CaregiverSignupChannelManager } from "@/ui/mvp/caregiver-signup-channel-manager";
import { TenantManager } from "@/ui/mvp/tenant-manager";

import { listUserMemberships } from "@/server/repositories/auth-repository";
import {
  listCaregiverSignupChannels,
  listCaregiverSignupChannelUses,
} from "@/server/repositories/signup-channel-repository";

export default async function CitiesPage() {
  const session = await requireServerAuthSession("coordinator");
  const [memberships, allTenants, invitations, channels] = await Promise.all([
    listUserMemberships(session.user.id),
    listTenants(),
    listCaregiverInvitations(session.membership.tenantId),
    listCaregiverSignupChannels(session.membership.tenantId),
  ]);
  const activeTenantId = session.membership.tenantId;
  const tenants = allTenants.filter(
    (t) => t.id === activeTenantId || memberships.some((m) => m.tenantId === t.id)
  );
  const channelUses = (await Promise.all(channels.map((channel) => listCaregiverSignupChannelUses(channel.id)))).flat();

  return (
    <PageContainer>
      <PageHeader
        title="Cidades e rede"
        subtitle="As igrejas da rede e como novos cuidadores entram. As mudanças valem na hora."
      />
      <SettingsLayout
        label="Cidades e rede"
        sections={[
          { id: "rede", label: "Igrejas da rede", content: <TenantManager tenants={tenants} /> },
          {
            id: "convites",
            label: "Convites de cuidadores",
            content: <CaregiverInvitationManager tenants={tenants} invitations={invitations} />,
          },
          {
            id: "qrcode",
            label: "Cadastro por QR code",
            content: <CaregiverSignupChannelManager tenants={tenants} channels={channels} uses={channelUses} />,
          },
        ]}
      />
    </PageContainer>
  );
}
