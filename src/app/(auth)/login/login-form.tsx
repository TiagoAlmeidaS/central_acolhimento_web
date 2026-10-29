"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserMembership } from "@/server/domain/mvp";
import { useAuth } from "@/auth/auth-context";
import { Button, Eyebrow, Input, Pill } from "@/ui/atalaia";
import { AuthCard, AuthHeading, AuthLink, AuthNotice, AuthShell } from "@/ui/auth";

function roleLabel(role: UserMembership["role"]) {
  return role === "coordinator" ? "Coordenação" : "Cuidador";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const invited = searchParams.get("invited") === "1";
  const pendingApproval = searchParams.get("pendingApproval") === "1";
  const registered = searchParams.get("registered") === "1";
  const passwordReset = searchParams.get("reset") === "1";
  const prefilledEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signInWithPassword } = useAuth();

  const showMembershipStep = memberships.length > 0;

  async function finishLogin(tenantUserId?: string | null) {
    setLoading(true);
    const { error: authError, result } = await signInWithPassword(email, password, tenantUserId);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (!result) {
      setError("Não foi possível concluir o login.");
      return;
    }

    if (result.type === "select-membership") {
      setMemberships(result.memberships);
      return;
    }

    const target = next ?? result.session.homePath;
    router.replace(target);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMemberships([]);
    await finishLogin(null);
  }

  return (
    <AuthShell
      footer={
        showMembershipStep ? null : (
          <>
            <p>
              Ainda não tem uma central? <AuthLink href="/cadastro/coordenacao">Criar a central em três passos</AuthLink>
            </p>
            <p className="text-xs text-subtle">
              Cuidadores entram por um link de convite da coordenação da igreja.
            </p>
          </>
        )
      }
    >
      <AuthCard>
        <AuthHeading
          eyebrow={showMembershipStep ? "Passo 2 de 2" : "Passo 1 de 2"}
          title={showMembershipStep ? "Em qual igreja você vai entrar?" : "Entrar no Atalaia"}
          lead={
            showMembershipStep
              ? "Sua conta tem acesso a mais de uma igreja. Escolha uma para continuar."
              : "Use o e-mail e a senha da sua conta."
          }
        />

        {invited ? (
          <AuthNotice tone="success" title="Cadastro concluído">
            Entre com o e-mail e a senha que você acabou de criar para abrir o app do cuidador.
          </AuthNotice>
        ) : null}

        {pendingApproval ? (
          <AuthNotice tone="warning" title="Cadastro enviado para aprovação">
            A coordenação da igreja vai revisar seu pedido. Quando for aprovado, entre aqui com o e-mail e a senha
            que você criou.
          </AuthNotice>
        ) : null}

        {registered ? (
          <AuthNotice tone="success" title="Central criada">
            Entre com o e-mail e a senha da coordenação para começar a configurar a igreja.
          </AuthNotice>
        ) : null}

        {passwordReset ? (
          <AuthNotice tone="success" title="Senha redefinida">
            Entre com a sua nova senha.
          </AuthNotice>
        ) : null}

        {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

        {!showMembershipStep ? (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Input
              label="E-mail"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@igreja.org.br"
            />

            <Input
              label="Senha"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
            />

            <div className="grid gap-3">
              <Button type="submit" variant="primary" loading={loading} className="w-full">
                {loading ? "Entrando…" : "Entrar"}
              </Button>
              <p className="text-center text-[13px]">
                <AuthLink href="/esqueci-senha">Esqueci minha senha</AuthLink>
              </p>
            </div>
          </form>
        ) : (
          <div className="grid gap-3">
            <Eyebrow>Suas igrejas</Eyebrow>
            <ul className="m-0 grid list-none gap-2 p-0">
              {memberships.map((membership) => (
                <li key={membership.tenantUserId}>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      void finishLogin(membership.tenantUserId);
                    }}
                    disabled={loading}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-card border border-border-strong bg-surface px-3.5 py-3 text-left transition-colors duration-150 hover:border-primary hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="grid min-w-0 gap-0.5">
                      <span className="truncate font-medium text-fg">{membership.tenantName}</span>
                      <span className="text-xs text-muted">
                        {membership.tenantCity} - {membership.tenantState}
                      </span>
                    </span>
                    <Pill tone={membership.role === "coordinator" ? "primary" : "neutral"}>
                      {roleLabel(membership.role)}
                    </Pill>
                  </button>
                </li>
              ))}
            </ul>

            <Button onClick={() => setMemberships([])} variant="ghost" className="w-full" disabled={loading}>
              Voltar e alterar credenciais
            </Button>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
