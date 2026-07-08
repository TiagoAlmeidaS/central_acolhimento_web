"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CaregiverInvitation } from "@/server/domain/mvp";
import { BrandMark, IconArrowLeft, IconCheck, IconHourglass, IconShield } from "@/ui/v2-components/icons";
import { Button, Card, InfoBanner, Input } from "@/ui/v2-components/ui";

function invitationStatusLabel(status: CaregiverInvitation["status"]) {
  if (status === "accepted") return "Aceito";
  if (status === "revoked") return "Revogado";
  if (status === "expired") return "Expirado";
  return "Pendente";
}

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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "32px 20px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 24 }}>
        <Link
          href="/login"
          style={{
            color: "var(--text-2)",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <IconArrowLeft size={16} />
          Voltar para o login
        </Link>

        <Card padding={28}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
              <BrandMark size={64} />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--accent)",
                  }}
                >
                  Convite de cuidador
                </p>
                <h1 style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 800, color: "var(--text)" }}>
                  Criar meu acesso
                </h1>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
                  Finalize seu cadastro para entrar na Central de Acolhimento e iniciar seus acompanhamentos.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>Status</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  {invitationStatusLabel(invitation.status)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>Expira em</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {invitation.email ? (
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--text-3)" }}>E-mail reservado</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "right" }}>
                    {invitation.email}
                  </span>
                </div>
              ) : null}
            </div>

            {isUnavailable ? (
              <InfoBanner icon={isExpired ? <IconHourglass /> : <IconShield />}>
                Este convite nao esta mais disponivel. Solicite um novo link para a coordenacao da sua central.
              </InfoBanner>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <InfoBanner icon={<IconCheck />}>
                  O convite libera apenas o acesso inicial. Depois do login, seu escopo sera limitado aos membros e
                  acompanhamentos da central que emitiu este link.
                </InfoBanner>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 160px" }}>
                    <Input
                      label="Nome"
                      value={form.firstName}
                      onChange={(value) => setForm((current) => ({ ...current, firstName: value }))}
                      placeholder="Ex: Maria"
                      required
                    />
                  </div>
                  <div style={{ flex: "1 1 160px" }}>
                    <Input
                      label="Sobrenome"
                      value={form.lastName}
                      onChange={(value) => setForm((current) => ({ ...current, lastName: value }))}
                      placeholder="Ex: Oliveira"
                      required
                    />
                  </div>
                </div>

                <Input
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                  disabled={Boolean(invitation.email)}
                  placeholder="voce@igreja.org"
                  required
                />

                <Input
                  label="Telefone principal"
                  type="tel"
                  value={form.phone}
                  onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                  placeholder="+55 11 99999-9999"
                  required
                />

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 160px" }}>
                    <Input
                      label="Senha"
                      type="password"
                      value={form.password}
                      onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                      placeholder="Minimo de 8 caracteres"
                      required
                    />
                  </div>
                  <div style={{ flex: "1 1 160px" }}>
                    <Input
                      label="Confirmar senha"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
                      placeholder="Repita a senha"
                      required
                    />
                  </div>
                </div>

                {error ? (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "var(--status-urgente-bg)",
                      color: "var(--status-urgente)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </div>
                ) : null}

                <Button type="submit" variant="primary" full disabled={submitting}>
                  {submitting ? "Finalizando..." : "Criar meu acesso"}
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
