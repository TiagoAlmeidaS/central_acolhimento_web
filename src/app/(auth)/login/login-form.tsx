"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserMembership } from "@/server/domain/mvp";
import { useAuth } from "@/auth/auth-context";
import { BrandMark } from "@/ui/v2-components/icons";
import { Button, Card, Input } from "@/ui/v2-components/ui";

function roleLabel(role: UserMembership["role"]) {
  return role === "coordinator" ? "Coordenacao" : "Cuidador";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const invited = searchParams.get("invited") === "1";
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
  const title = useMemo(
    () => (showMembershipStep ? "Selecione a cidade" : "Entrar na Central"),
    [showMembershipStep]
  );

  async function finishLogin(tenantUserId?: string | null) {
    setLoading(true);
    const { error: authError, result } = await signInWithPassword(email, password, tenantUserId);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (!result) {
      setError("Nao foi possivel concluir o login.");
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
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14.5,
                lineHeight: 1.5,
                color: "var(--text-2)",
                letterSpacing: "-0.005em",
              }}
            >
              Acompanhe pessoas, cuidadores e indicadores com clareza operacional.
            </p>
          </div>
        </div>

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
                {showMembershipStep ? "Etapa 2 de 2" : "Etapa 1 de 2"}
              </p>
              <h2
                style={{
                  margin: "6px 0 0",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {title}
              </h2>
            </div>

            {invited ? (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "var(--status-concluido-bg)",
                  color: "var(--status-concluido)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cadastro concluido. Entre com o e-mail e a senha que voce acabou de criar.
              </div>
            ) : null}

            {registered ? (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "var(--status-concluido-bg)",
                  color: "var(--status-concluido)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Acesso da coordenacao criado. Entre para iniciar a configuracao da sua central.
              </div>
            ) : null}

            {passwordReset ? (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "var(--status-concluido-bg)",
                  color: "var(--status-concluido)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Senha redefinida com sucesso! Entre com sua nova senha.
              </div>
            ) : null}

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

            {!showMembershipStep ? (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Input
                  label="E-mail"
                  type="email"
                  required
                  value={email}
                  onChange={setEmail}
                  placeholder="voce@igreja.org"
                />

                <Input
                  label="Senha"
                  type="password"
                  required
                  value={password}
                  onChange={setPassword}
                  placeholder="Digite sua senha"
                />

                <Button type="submit" variant="primary" full disabled={loading}>
                  {loading ? "Entrando..." : "Continuar"}
                </Button>

                <div style={{ textAlign: "right", marginTop: -4 }}>
                  <Link
                    href="/esqueci-senha"
                    style={{
                      fontSize: 13,
                      color: "var(--accent)",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {memberships.map((membership) => (
                  <button
                    key={membership.tenantUserId}
                    type="button"
                    onClick={() => {
                      setError(null);
                      void finishLogin(membership.tenantUserId);
                    }}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: 16,
                      borderRadius: 14,
                      border: "1.5px solid var(--border)",
                      background: "var(--surface-2)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "border-color 0.15s, background-color 0.15s",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.borderColor = "var(--accent)";
                      event.currentTarget.style.background = "var(--surface)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.borderColor = "var(--border)";
                      event.currentTarget.style.background = "var(--surface-2)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: "var(--text)" }}>
                          {membership.tenantName}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-2)" }}>
                          {membership.tenantCity} - {membership.tenantState}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          background: "var(--accent-bg)",
                          color: "var(--accent)",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {roleLabel(membership.role)}
                      </span>
                    </div>
                  </button>
                ))}

                <Button onClick={() => setMemberships([])} variant="secondary" full>
                  Voltar e alterar credenciais
                </Button>
              </div>
            )}
          </div>
        </Card>

        {!showMembershipStep ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", width: "100%" }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center" }}>
              Ainda nao possui central?{" "}
              <Link
                href="/cadastro/coordenacao"
                style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
              >
                Cadastre-se aqui
              </Link>
            </div>
            <div style={{ height: 1, background: "var(--border)", width: "100%" }} />
            <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.5 }}>
              Os cuidadores recebem acesso por convite da coordenacao local.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
