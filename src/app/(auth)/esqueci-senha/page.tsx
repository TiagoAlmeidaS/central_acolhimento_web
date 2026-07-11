import { Suspense } from "react";
import { EsqueciSenhaForm } from "./esqueci-senha-form";

export const metadata = {
  title: "Esqueci minha senha — Central de Acolhimento",
  description: "Recupere o acesso à sua conta informando o e-mail cadastrado.",
};

export default function EsqueciSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-mesh flex min-h-screen items-center justify-center px-4 py-10 text-slate-900">
          <div className="rounded-3xl border border-white/60 bg-white/90 px-6 py-4 text-sm text-slate-500 shadow-panel">
            Carregando...
          </div>
        </div>
      }
    >
      <EsqueciSenhaForm />
    </Suspense>
  );
}
