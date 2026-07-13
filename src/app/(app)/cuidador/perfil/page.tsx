export const dynamic = "force-dynamic";

import { requireServerAuthSession } from "@/server/auth/session";
import { getUserProfile } from "@/server/repositories/profile-repository";
import { MobileShell } from "@/ui/navigation/mobile-shell";
import { ProfileManager } from "@/ui/mvp/profile-manager";

export default async function CaregiverProfilePage() {
  const session = await requireServerAuthSession("caregiver");
  const profile = await getUserProfile(session);

  return (
    <MobileShell>
      <ProfileManager initialProfile={profile} homePath="/cuidador" />
    </MobileShell>
  );
}
