"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/auth/auth-context";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/coord";
  const invited = searchParams.get("invited") === "1";
  const prefilledEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signInWithPassword, signInWithGoogle, isConfigured } = useAuth();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isConfigured) {
      router.replace(next);
      return;
    }

    setLoading(true);
    const { error: authError } = await signInWithPassword(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : authError.message);
      return;
    }

    router.replace(next);
  }

  async function handleGoogleLogin() {
    setError(null);

    if (!isConfigured) {
      router.replace(next);
      return;
    }

    setLoading(true);
    const { error: authError } = await signInWithGoogle();
    setLoading(false);

    if (authError) {
      setError(authError.message);
    }
  }

  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center px-4 py-10 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-4xl">hub</span>
          </div>
          <h1 className="text-center text-3xl font-black tracking-tight">Central de Acolhimento</h1>
          <p className="mt-2 text-center text-sm text-slate-500">Monólito em Next.js para coordenação e cuidado.</p>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-panel backdrop-blur">
          {invited && (
            <div className="mb-5 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-emerald-700">
              Cadastro concluido. Entre com o e-mail e a senha que voce acabou de criar.
            </div>
          )}

          <div className="mb-5 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-amber-700">
            Autenticacao externa desativada. O sistema esta em modo de acesso local para a fase de migracao.
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-danger/15 bg-danger/10 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@igreja.org"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                  Senha
                </label>
                <button type="button" className="text-xs font-semibold text-primary">
                  Esqueci minha senha
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar em modo local"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span>ou</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg text-primary">login</span>
            Google desativado
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>A serviço do Reino.</span>
          <Link className="font-semibold text-primary" href="/coord">
            Ver estrutura do MVP
          </Link>
        </div>
      </div>
    </div>
  );
}
