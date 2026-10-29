import { Suspense } from "react";
import { AuthLoading } from "@/ui/auth";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export const metadata = {
  title: "Redefinir senha — Atalaia",
  description: "Crie uma nova senha para sua conta no Atalaia.",
};

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
