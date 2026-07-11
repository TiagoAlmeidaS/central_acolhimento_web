import { Suspense } from "react";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export const metadata = {
  title: "Redefinir senha — Central de Acolhimento",
  description: "Crie uma nova senha para sua conta na Central de Acolhimento.",
};

export default function RedefinirSenhaPage() {
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
      <RedefinirSenhaForm />
    </Suspense>
  );
}
