import type { Metadata } from "next";
import { Landing } from "@/ui/landing";

export const metadata: Metadata = {
  title: "Atalaia: acolhimento e cuidado, sem ninguém esquecido",
  description:
    "Do primeiro culto à célula: cada pessoa nova tem um cuidador, uma próxima visita marcada e uma coordenação que vê a igreja inteira.",
};

/** Landing pública. Continua visível mesmo com sessão ativa: quem já entrou usa "Entrar" e segue para o painel. */
export default function HomePage() {
  return <Landing />;
}
