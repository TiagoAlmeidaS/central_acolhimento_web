"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@/ui/atalaia";
import { AuthCard, AuthHeading, AuthLink, AuthNotice, AuthShell, AuthStateCard } from "@/ui/auth";

export function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Valida antes de enviar ao servidor
  function getClientError(): string | null {
    if (!token) return "Link inválido. Solicite um novo link de recuperação.";
    if (newPassword.length < 8) return "A nova senha deve ter no mínimo 8 caracteres.";
    if (newPassword !== confirmPassword) return "As senhas não coincidem.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPasswordError(null);
    setConfirmError(null);

    const clientError = getClientError();
    if (clientError) {
      if (newPassword.length < 8) setPasswordError(clientError);
      else if (newPassword !== confirmPassword) setConfirmError(clientError);
      else setError(clientError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }

      setSuccess(true);
      // Redireciona para login após 2.5 s
      setTimeout(() => router.replace("/login?reset=1"), 2500);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell
        footer={
          <p>
            <AuthLink href="/login">Voltar para o login</AuthLink>
          </p>
        }
      >
        <AuthStateCard
          eyebrow="Link de recuperação"
          title="Este link não é válido"
          reason="O endereço está incompleto ou já foi usado. Por segurança, cada link serve uma vez só e vale por 30 minutos."
          hint="Peça um novo link: você recebe outro e-mail em instantes."
          actions={
            <Button href="/esqueci-senha" variant="primary">
              Solicitar novo link
            </Button>
          }
        />
      </AuthShell>
    );
  }

  const linkProblem = error ? /inv[aá]lido|expirado/i.test(error) : false;

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
          eyebrow="Nova senha"
          title="Redefinir senha"
          lead={success ? undefined : "Crie uma nova senha para a sua conta. Mínimo de 8 caracteres."}
        />

        {success ? (
          <div className="grid gap-4">
            <AuthNotice tone="success" title="Senha redefinida com sucesso">
              Estamos levando você para o login.
            </AuthNotice>
            <div>
              <Button href="/login?reset=1" variant="primary">
                Ir para o login agora
              </Button>
            </div>
          </div>
        ) : (
          <>
            {error ? (
              <AuthNotice tone="danger">
                {error}
                {linkProblem ? (
                  <>
                    {" "}
                    <AuthLink href="/esqueci-senha">Solicitar novo link</AuthLink>
                  </>
                ) : null}
              </AuthNotice>
            ) : null}

            <form onSubmit={handleSubmit} noValidate className="grid gap-4">
              <Input
                label="Nova senha"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Mínimo de 8 caracteres"
                error={passwordError}
              />

              <Input
                label="Confirmar nova senha"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repita a nova senha"
                error={confirmError}
              />

              <Button type="submit" variant="primary" loading={loading} className="w-full">
                {loading ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </form>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}
