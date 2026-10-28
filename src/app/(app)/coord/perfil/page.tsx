export const dynamic = "force-dynamic";

import { requireServerAuthSession } from "@/server/auth/session";
import { getUserProfile } from "@/server/repositories/profile-repository";
import { PageContainer } from "@/ui/atalaia";
import { ProfileManager } from "@/ui/mvp/profile-manager";

export default async function CoordinatorProfilePage() {
  const session = await requireServerAuthSession("coordinator");
  const profile = await getUserProfile(session);
  return (
    <PageContainer>
      <ProfileManager initialProfile={profile} homePath="/coord" contained={false} />
    </PageContainer>
  );
}
