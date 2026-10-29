import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ contactId: string }>;
};

/** A edicao agora abre num drawer em /coord/contatos; esta rota continua valendo para links antigos. */
export default async function EditContactPage({ params }: PageProps) {
  const { contactId } = await params;
  redirect(`/coord/contatos?editar=${encodeURIComponent(contactId)}`);
}
