import { Suspense } from "react";
import { AuthLoading } from "@/ui/auth";
import { EsqueciSenhaForm } from "./esqueci-senha-form";

export const metadata = {
  title: "Esqueci minha senha — Atalaia",
  description: "Recupere o acesso à sua conta informando o e-mail cadastrado.",
};

export default function EsqueciSenhaPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <EsqueciSenhaForm />
    </Suspense>
  );
}
