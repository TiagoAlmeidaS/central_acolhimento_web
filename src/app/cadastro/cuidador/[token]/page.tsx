import { getCaregiverSignupChannelByToken } from "@/server/repositories/signup-channel-repository";
import { CaregiverSignupChannelRegisterForm } from "@/ui/mvp/caregiver-signup-channel-register-form";

type SignupChannelPageProps = {
  params: Promise<{ token: string }>;
};

export default async function CaregiverSignupChannelPage({ params }: SignupChannelPageProps) {
  const { token } = await params;
  const channel = await getCaregiverSignupChannelByToken(token);

  if (!channel) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center", color: "var(--text-2)" }}>
          Canal de cadastro nao encontrado.
        </div>
      </div>
    );
  }

  return <CaregiverSignupChannelRegisterForm channel={channel} />;
}
