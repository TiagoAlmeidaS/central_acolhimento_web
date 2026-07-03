"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CaregiverInvitation } from "@/server/domain/mvp";

export function CaregiverInvitationAcceptForm({
  invitation,
}: Readonly<{
  invitation: CaregiverInvitation;
}>) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: invitation.email ?? "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isUnavailable = invitation.status !== "pending" || isExpired;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setSubmitting(true);

    const response = await fetch(`/api/invitations/${invitation.token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel concluir o cadastro.");
      setSubmitting(false);
      return;
    }

    router.replace(`/login?email=${encodeURIComponent(form.email)}&invited=1`);
  }

  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center px-4 py-10 text-slate-900">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-panel backdrop-blur md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Convite</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Cadastro de cuidador</h1>
        <p className="mt-3 text-sm text-slate-500">
          Finalize seu acesso para entrar na Central de Acolhimento e acompanhar suas pessoas.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            Status: <span className="font-semibold text-slate-900">{invitation.status}</span>
          </p>
          <p className="mt-1">
            Expira em:{" "}
            <span className="font-semibold text-slate-900">
              {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}
            </span>
          </p>
          {invitation.email && (
            <p className="mt-1">
              E-mail vinculado: <span className="font-semibold text-slate-900">{invitation.email}</span>
            </p>
          )}
        </div>

        {isUnavailable ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Este convite nao esta mais disponivel. Peça ao coordenador para gerar um novo link.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Nome</span>
                <input
                  required
                  value={form.firstName}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Sobrenome</span>
                <input
                  required
                  value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>
            </div>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">E-mail</span>
              <input
                type="email"
                required
                value={form.email}
                disabled={Boolean(invitation.email)}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary disabled:bg-slate-100"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">WhatsApp</span>
              <input
                required
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Senha</span>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Confirmar senha</span>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Finalizando..." : "Criar meu acesso"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-semibold text-primary">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
