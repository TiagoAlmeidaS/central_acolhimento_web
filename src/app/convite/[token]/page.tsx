export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCaregiverInvitationByToken } from "@/server/repositories/invitation-repository";
import { CaregiverInvitationAcceptForm } from "@/ui/mvp/caregiver-invitation-accept-form";

type InvitationPageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const invitation = await getCaregiverInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  return <CaregiverInvitationAcceptForm invitation={invitation} />;
}
