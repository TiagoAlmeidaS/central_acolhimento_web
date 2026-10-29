"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "@/ui/atalaia";
import { AuthCard, AuthHeading, AuthLink, AuthNotice, AuthShell } from "@/ui/auth";

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
    <AuthShell
      footer={
        <p>
          <AuthLink href="/login">Voltar para o login</AuthLink>
        </p>
      }
    >
      <AuthCard>
        <AuthHeading
          eyebrow="Recuperar acesso"
          title="Esqueci minha senha"
          lead={
            sent ? undefined : "Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha."
          }
        />

        {sent ? (
          <div className="grid gap-4">
            <AuthNotice tone="success" title="Verifique seu e-mail">
              Se o endereço <strong>{email.trim()}</strong> estiver cadastrado, você receberá um link para redefinir
              a senha em instantes. Olhe também a caixa de spam.
            </AuthNotice>
            <p className="text-[13px] text-muted">O link expira em 30 minutos. Passado esse prazo, peça um novo.</p>
            <div className="flex flex-wrap gap-2">
              <Button href="/login" variant="primary">
                Voltar para o login
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSent(false);
                  setError(null);
                }}
              >
                Usar outro e-mail
              </Button>
            </div>
          </div>
        ) : (
          <>
            {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <Input
                label="E-mail"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@igreja.org.br"
              />

              <Button type="submit" variant="primary" loading={loading} className="w-full">
                {loading ? "Enviando…" : "Enviar link de recuperação"}
              </Button>
            </form>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}
