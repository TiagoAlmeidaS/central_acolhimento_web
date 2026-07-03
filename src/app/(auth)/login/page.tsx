import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-mesh flex min-h-screen items-center justify-center px-4 py-10 text-slate-900">
          <div className="rounded-3xl border border-white/60 bg-white/90 px-6 py-4 text-sm text-slate-500 shadow-panel">
            Carregando login...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
