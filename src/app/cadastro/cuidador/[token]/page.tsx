import { getCaregiverSignupChannelByToken } from "@/server/repositories/signup-channel-repository";
import { CaregiverLinkNotFound } from "@/ui/auth/caregiver-entry";
import { CaregiverSignupChannelRegisterForm } from "@/ui/mvp/caregiver-signup-channel-register-form";

export const metadata = {
  title: "Cadastro de cuidador — Atalaia",
  description: "Crie seu acesso de cuidador pelo link da coordenação da sua igreja.",
};

type SignupChannelPageProps = {
  params: Promise<{ token: string }>;
};

export default async function CaregiverSignupChannelPage({ params }: SignupChannelPageProps) {
  const { token } = await params;
  const channel = await getCaregiverSignupChannelByToken(token);

  if (!channel) {
    return <CaregiverLinkNotFound kind="canal" />;
  }

  return <CaregiverSignupChannelRegisterForm channel={channel} />;
}
