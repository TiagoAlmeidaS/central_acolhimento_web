export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { listMembers } from "@/server/repositories/mvp-repository";
import { listAccessibleTenantIds } from "@/server/auth/access-scope";
import { requireServerAuthSession } from "@/server/auth/session";

type PageProps = {
  params: Promise<{ memberId: string }>;
};

/** A edição agora abre num drawer da lista; este endereço continua valendo. */
export default async function EditMemberPage({ params }: PageProps) {
  const { memberId } = await params;
  const session = await requireServerAuthSession("coordinator");
  const accessibleTenantIds = await listAccessibleTenantIds(session);
  const members = await listMembers({ tenantIds: accessibleTenantIds });

  if (!members.some((item) => item.id === memberId)) {
    notFound();
  }

  redirect(`/coord/membros?editar=${encodeURIComponent(memberId)}`);
}
