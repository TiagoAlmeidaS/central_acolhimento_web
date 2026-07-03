"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaregiverInvitation, Tenant } from "@/server/domain/mvp";
import { PanelShell } from "@/ui/mvp/panel-shell";

const defaultExpiresInDays = 7;

export function CaregiverInvitationManager({
  tenants,
  invitations,
}: Readonly<{
  tenants: Tenant[];
  invitations: CaregiverInvitation[];
}>) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(String(defaultExpiresInDays));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestLink, setLatestLink] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const sortedInvitations = useMemo(
    () =>
      [...invitations].sort((left, right) =>
        (right.createdAt ?? "").localeCompare(left.createdAt ?? "")
      ),
    [invitations]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setCopyFeedback(null);

    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        email: email || null,
        expiresInDays: Number(expiresInDays) || defaultExpiresInDays,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel gerar o convite.");
      setSubmitting(false);
      return;
    }

    const invitation = (await response.json()) as CaregiverInvitation;
    setLatestLink(invitation.inviteUrl);
    setEmail("");
    setExpiresInDays(String(defaultExpiresInDays));
    setSubmitting(false);
    startTransition(() => router.refresh());
  }

  async function handleCopy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopyFeedback("Link copiado.");
    } catch {
      setCopyFeedback("Nao foi possivel copiar automaticamente.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <PanelShell
        title="Convite de cuidadores"
        description="Gere links por tenant para que cada cuidador finalize o proprio cadastro."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Cidade</span>
            <select
              required
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            >
              <option value="">Selecione</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">E-mail do cuidador</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="opcional, para travar o convite em um e-mail"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Expira em</span>
            <select
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
            >
              <option value="3">3 dias</option>
              <option value="7">7 dias</option>
              <option value="14">14 dias</option>
            </select>
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          {copyFeedback && <p className="text-sm text-emerald-700">{copyFeedback}</p>}

          <button
            type="submit"
            disabled={submitting || !tenantId}
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Gerando..." : "Gerar link de convite"}
          </button>
        </form>

        {latestLink && (
          <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ultimo link gerado</p>
            <p className="mt-2 break-all text-sm text-slate-700">{latestLink}</p>
            <button
              type="button"
              onClick={() => handleCopy(latestLink)}
              className="mt-3 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Copiar link
            </button>
          </div>
        )}
      </PanelShell>

      <PanelShell
        title="Convites recentes"
        description="Acompanhe quais links ainda estao pendentes e quais cuidadores ja aceitaram."
      >
        <div className="space-y-3">
          {sortedInvitations.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum convite criado ainda.</p>
          )}

          {sortedInvitations.map((invitation) => {
            const tenant = tenants.find((item) => item.id === invitation.tenantId);
            const statusLabel =
              invitation.status === "accepted"
                ? "Aceito"
                : invitation.status === "expired"
                  ? "Expirado"
                  : invitation.status === "revoked"
                    ? "Revogado"
                    : "Pendente";

            return (
              <div key={invitation.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{tenant?.name ?? "Tenant"}</p>
                    <p className="text-sm text-slate-500">{invitation.email ?? "Convite aberto sem e-mail fixo"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {statusLabel}
                  </span>
                </div>

                <p className="mt-3 break-all text-sm text-slate-600">{invitation.inviteUrl}</p>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Expira: {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}</span>
                  {invitation.acceptedAt && (
                    <span>Aceito: {new Date(invitation.acceptedAt).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(invitation.inviteUrl)}
                  className="mt-3 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Copiar link
                </button>
              </div>
            );
          })}
        </div>
      </PanelShell>
    </div>
  );
}
