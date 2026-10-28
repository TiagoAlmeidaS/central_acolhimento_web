export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCaregiverInvitationByToken } from "@/server/repositories/invitation-repository";
import { listTenants } from "@/server/repositories/mvp-repository";
import { CaregiverInvitationAcceptForm } from "@/ui/mvp/caregiver-invitation-accept-form";

export const metadata = {
  title: "Convite de cuidador — Atalaia",
  description: "Aceite o convite da sua igreja e crie seu acesso de cuidador.",
};

type InvitationPageProps = {
  params: Promise<{ token: string }>;
};

/** Nome e local da igreja que convidou. Se a consulta falhar, o convite segue sem eles. */
async function loadInviter(tenantId: string) {
  try {
    const tenant = (await listTenants({ tenantId }))[0];
    if (!tenant) return { name: null, location: null };
    return {
      name: tenant.name,
      location: tenant.city && tenant.state ? `${tenant.city} - ${tenant.state}` : null,
    };
  } catch {
    return { name: null, location: null };
  }
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const invitation = await getCaregiverInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  const inviter = await loadInviter(invitation.tenantId);

  return (
    <CaregiverInvitationAcceptForm
      invitation={invitation}
      tenantName={inviter.name}
      tenantLocation={inviter.location}
    />
  );
}
