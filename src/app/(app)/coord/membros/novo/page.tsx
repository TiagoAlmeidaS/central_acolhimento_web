export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireServerAuthSession } from "@/server/auth/session";

/** O cadastro agora abre num drawer da lista; este endereço continua valendo. */
export default async function NewMemberPage() {
  await requireServerAuthSession("coordinator");
  redirect("/coord/membros?novo=1");
}
