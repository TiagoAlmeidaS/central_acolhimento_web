"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Caregiver,
  CaregiverInvitation,
  CaregiverSignupChannel,
  CaregiverSignupChannelUse,
  Member,
  Seed,
  Tenant,
} from "@/server/domain/mvp";
import { Button, Card, CardHeader, PageContainer, PageHeader, Stat, Tabs, useToast } from "@/ui/atalaia";
import { CaregiverManager } from "@/ui/mvp/caregiver-manager";
import { CaregiverInvitationManager } from "@/ui/mvp/caregiver-invitation-manager";
import { CaregiverSignupChannelManager } from "@/ui/mvp/caregiver-signup-channel-manager";
import { plural } from "@/ui/coord/seed-utils";

export type CaregiversTab = "equipe" | "convites" | "canais";

type Props = {
  caregivers: Caregiver[];
  tenants: Tenant[];
  members: Member[];
  seeds: Seed[];
  invitations: CaregiverInvitation[];
  channels: CaregiverSignupChannel[];
  uses: CaregiverSignupChannelUse[];
  initialTab?: CaregiversTab;
};

function PendingApprovals({
  items,
}: {
  items: Array<{ channel: CaregiverSignupChannel; use: CaregiverSignupChannelUse }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function approve(channelId: string, useId: string, name: string) {
    setBusyId(useId);
    const response = await fetch(`/api/signup-channels/${channelId}/uses/${useId}/approve`, { method: "POST" });
    setBusyId(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast(payload.error ?? "Não foi possível aprovar o cadastro.", { tone: "error" });
      return;
    }
    toast(`${name} aprovado(a). Já pode entrar.`);
    startTransition(() => router.refresh());
  }

  return (
    <Card aria-labelledby="pending-heading">
      <CardHeader
        id="pending-heading"
        title="Aguardando aprovação"
        meta={<span role="status">{plural(items.length, "pedido", "pedidos")}</span>}
      />
      <ul className="pb-1 pt-2">
        {items.map(({ channel, use }) => (
          <li
            key={use.id}
            className="grid grid-cols-[8px_1fr_auto] items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0 max-[700px]:grid-cols-[8px_1fr]"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-warning" />
            <div className="min-w-0">
              <b className="block truncate font-semibold">
                {use.firstName} {use.lastName}
              </b>
              <small className="text-xs text-muted">
                {use.email} · {use.phone} · pelo canal {channel.name}
              </small>
            </div>
            <div className="max-[700px]:col-start-2">
              <Button
                size="sm"
                icon="check"
                loading={busyId === use.id}
                onClick={() => approve(channel.id, use.id, `${use.firstName} ${use.lastName}`)}
              >
                Aprovar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Gestão da equipe: cuidadores, convites por link e canais de cadastro, com os pedidos pendentes à frente. */
export function CaregiversWorkspace({ caregivers, tenants, members, seeds, invitations, channels, uses, initialTab = "equipe" }: Props) {
  const [tab, setTab] = useState<CaregiversTab>(initialTab);

  const activeCount = caregivers.filter((caregiver) => caregiver.active).length;
  const activeMembers = members.filter((member) => member.status !== "inactive");
  const unassigned =
    members.filter((member) => !member.caregiverId && member.status !== "inactive").length +
    seeds.filter((seed) => !seed.caregiverId && (seed.status === "new" || seed.status === "contacted" || seed.status === "waiting_visit")).length;

  const channelsById = new Map(channels.map((channel) => [channel.id, channel]));
  const pending = uses
    .filter((use) => use.status === "submitted")
    .flatMap((use) => {
      const channel = channelsById.get(use.channelId);
      return channel && channel.requireApproval ? [{ channel, use }] : [];
    });
  const pendingInvites = invitations.filter((invitation) => invitation.status === "pending").length;

  return (
    <PageContainer>
      <PageHeader
        title="Cuidadores"
        subtitle="Quem acompanha as pessoas, quanto cada um carrega e como a equipe cresce."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
        <Stat label="Cuidadores" value={caregivers.length} note={`${activeCount} ativos`} />
        <Stat label="Assistidos ativos" value={activeMembers.length} note="em acompanhamento" />
        <Stat label="Sem cuidador" value={unassigned} note="esperando atribuição" tone={unassigned > 0 ? "alert" : "default"} />
        <Stat label="Aguardando aprovação" value={pending.length} note="cadastros" tone={pending.length > 0 ? "alert" : "default"} />
      </div>

      <Tabs<CaregiversTab>
        label="Seções da equipe"
        idPrefix="team"
        value={tab}
        onChange={setTab}
        className="mb-4 pb-px"
        tabs={[
          { value: "equipe", label: "Equipe", count: caregivers.length },
          { value: "convites", label: "Convites", count: pendingInvites },
          { value: "canais", label: "Canais de cadastro", count: channels.length },
        ]}
      />

      <div role="tabpanel" id={`team-panel-${tab}`} aria-labelledby={`team-tab-${tab}`} className="grid gap-4">
        {tab === "equipe" ? (
          <>
            {pending.length > 0 ? <PendingApprovals items={pending} /> : null}
            <CaregiverManager caregivers={caregivers} tenants={tenants} members={members} seeds={seeds} />
          </>
        ) : null}
        {tab === "convites" ? <CaregiverInvitationManager tenants={tenants} invitations={invitations} /> : null}
        {tab === "canais" ? <CaregiverSignupChannelManager tenants={tenants} channels={channels} uses={uses} /> : null}
      </div>
    </PageContainer>
  );
}
