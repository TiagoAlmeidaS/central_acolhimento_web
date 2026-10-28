import { Suspense } from "react";
import { AuthLoading } from "@/ui/auth";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar — Atalaia",
  description: "Entre no Atalaia com o e-mail e a senha da sua conta.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading label="Carregando o acesso…" />}>
      <LoginForm />
    </Suspense>
  );
}
