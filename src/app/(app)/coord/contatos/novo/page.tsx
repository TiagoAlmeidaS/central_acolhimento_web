import { redirect } from "next/navigation";

/** O cadastro agora abre num drawer em /coord/contatos; esta rota continua valendo para links antigos. */
export default function NewContactPage() {
  redirect("/coord/contatos?novo=1");
}
