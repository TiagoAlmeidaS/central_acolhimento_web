"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/ui/v2-components/icons";
import { Button, Card, Input } from "@/ui/v2-components/ui";

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.status === 429) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Muitas tentativas. Aguarde e tente novamente.");
        return;
      }

      // Qualquer outro status (200 ou erro 5xx) mostra a mensagem genérica
      setSent(true);
    } catch {
      setSent(true); // Mesmo em falha de rede, exibe mensagem genérica por segurança
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "40px 24px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <BrandMark size={80} />
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                lineHeight: 1.15,
              }}
            >
              Central de Acolhimento
            </h1>
          </div>
        </div>

        {/* Card */}
        <Card padding={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                Recuperar acesso
              </p>
              <h2
                style={{
                  margin: "6px 0 0",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Esqueci minha senha
              </h2>
            </div>

            {sent ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  padding: "20px",
                  borderRadius: 14,
                  background: "var(--status-concluido-bg)",
                  border: "1px solid var(--status-concluido)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: "var(--status-concluido)",
                  }}
                >
                  ✉️ Verifique seu e-mail
                </p>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
                  Se o endereço <strong>{email}</strong> estiver cadastrado, você receberá um link
                  para redefinir sua senha em instantes. Verifique também a caixa de spam.
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-3)" }}>
                  O link expira em 30 minutos.
                </p>
              </div>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
                  Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
                </p>

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

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Input
                    label="E-mail"
                    type="email"
                    required
                    value={email}
                    onChange={setEmail}
                    placeholder="voce@igreja.org"
                  />

                  <Button type="submit" variant="primary" full disabled={loading}>
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </Card>

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <Link
            href="/login"
            style={{ fontSize: 13.5, color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
          >
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
