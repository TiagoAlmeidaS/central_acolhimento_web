"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/ui/v2-components/icons";
import { Button, Card, Input } from "@/ui/v2-components/ui";

export function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Valida antes de enviar ao servidor
  function getClientError(): string | null {
    if (!token) return "Link inválido. Solicite um novo link de recuperação.";
    if (newPassword.length < 8) return "A nova senha deve ter no mínimo 8 caracteres.";
    if (newPassword !== confirmPassword) return "As senhas não coincidem.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientError = getClientError();
    if (clientError) {
      setError(clientError);
      return;
    }

    setLoading(true);
    setError(null);

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
          </div>
          <Card padding={24}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: "var(--status-urgente-bg)",
                  color: "var(--status-urgente)",
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                Link inválido ou expirado. Solicite um novo link de recuperação.
              </div>
              <Link
                href="/esqueci-senha"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "12px",
                  borderRadius: 12,
                  background: "var(--accent-bg)",
                  color: "var(--accent)",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Solicitar novo link
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
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
                Nova senha
              </p>
              <h2
                style={{
                  margin: "6px 0 0",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Redefinir senha
              </h2>
            </div>

            {success ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
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
                  ✅ Senha redefinida com sucesso!
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)" }}>
                  Redirecionando para o login...
                </p>
              </div>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
                  Crie uma nova senha para sua conta. Mínimo de 8 caracteres.
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
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                    {(error.toLowerCase().includes("inválido") || error.toLowerCase().includes("expirado")) ? (
                      <div style={{ marginTop: 8 }}>
                        <Link
                          href="/esqueci-senha"
                          style={{ color: "var(--status-urgente)", fontWeight: 800, textDecoration: "underline" }}
                        >
                          Solicitar novo link →
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Input
                    label="Nova senha"
                    type="password"
                    required
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Mínimo 8 caracteres"
                  />

                  <Input
                    label="Confirmar nova senha"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repita a nova senha"
                  />

                  <Button type="submit" variant="primary" full disabled={loading}>
                    {loading ? "Salvando..." : "Salvar nova senha"}
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
