export const dynamic = "force-dynamic";

import { requireServerAuthSession } from "@/server/auth/session";
import { getUserProfile } from "@/server/repositories/profile-repository";
import { MobileShell } from "@/ui/navigation/mobile-shell";
import { CareProfile } from "@/ui/cuidador/care-profile";

export default async function CaregiverProfilePage() {
  const session = await requireServerAuthSession("caregiver");
  const profile = await getUserProfile(session);

  return (
    <MobileShell>
      <CareProfile initialProfile={profile} />
    </MobileShell>
  );
}
