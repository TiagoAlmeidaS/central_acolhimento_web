"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark, IconArrowLeft, IconCheck, IconChevronRight } from "@/ui/v2-components/icons";
import { Button, Card, InfoBanner, Input } from "@/ui/v2-components/ui";

const TENANT_COLORS = [
  "#2D7FF9",
  "#10B981",
  "#F59E0B",
  "#7C3AED",
  "#EC4899",
  "#6366F1",
];

const STEP_TITLES = ["Acesso", "Contato", "Central", "Revisao"] as const;

function siglaFrom(nome: string): string {
  const words = nome.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CA";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function CoordinatorSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    tenantName: "",
    city: "",
    state: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    sigla: "",
    color: TENANT_COLORS[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (value: string) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "tenantName" && !current.sigla) {
        next.sigla = siglaFrom(value);
      }
      return next;
    });
  };

  function handleNextStep() {
    setError(null);

    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
        setError("Preencha todos os campos obrigatorios para criar o acesso.");
        return;
      }

      if (form.password.length < 8) {
        setError("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("As senhas nao conferem.");
        return;
      }
    }

    if (step === 1 && !form.phone) {
      setError("Informe um telefone principal para contato da central.");
      return;
    }

    if (step === 2) {
      if (!form.tenantName || !form.city || !form.state) {
        setError("Preencha os dados principais da central.");
        return;
      }

      if (!form.sigla) {
        setError("Informe uma sigla para identificar a central.");
        return;
      }
    }

    setStep((current) => Math.min(current + 1, STEP_TITLES.length - 1));
  }

  function handlePrevStep() {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register-coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantName: form.tenantName,
          city: form.city,
          state: form.state,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          sigla: form.sigla || siglaFrom(form.tenantName),
          color: form.color,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Nao foi possivel criar o acesso da coordenacao.");
        setSubmitting(false);
        return;
      }

      router.replace(`/login?email=${encodeURIComponent(form.email)}&registered=1`);
    } catch {
      setError("Erro de rede. Tente novamente.");
      setSubmitting(false);
    }
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          {step > 0 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--text-2)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: 0,
              }}
            >
              <IconArrowLeft size={16} />
              Voltar
            </button>
          ) : (
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
              Login
            </Link>
          )}

          <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 700 }}>
            Etapa {step + 1} de {STEP_TITLES.length}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {STEP_TITLES.map((_, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background: index <= step ? "var(--accent)" : "var(--border)",
              }}
            />
          ))}
        </div>

        <Card padding={28}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
              <BrandMark size={64} />
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text)" }}>
                  Criar central
                </h1>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
                  Cadastre a coordenacao responsavel e prepare a primeira central para operar no monolito.
                </p>
              </div>
            </div>

            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
                {STEP_TITLES[step]}
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-2)" }}>
                {step === 0 && "Defina as credenciais iniciais da coordenacao."}
                {step === 1 && "Informe o telefone principal para contato operacional da central."}
                {step === 2 && "Configure a identificacao da cidade e a apresentacao visual da central."}
                {step === 3 && "Revise os dados antes de concluir o cadastro."}
              </p>
            </div>

            {step === 1 ? (
              <InfoBanner>
                Este numero sera usado como contato principal da coordenacao. Nao existe validacao por SMS ou WhatsApp
                nesta etapa.
              </InfoBanner>
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

            {step === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 160px" }}>
                    <Input
                      label="Nome"
                      value={form.firstName}
                      onChange={update("firstName")}
                      placeholder="Ex: Daniel"
                      required
                    />
                  </div>
                  <div style={{ flex: "1 1 160px" }}>
                    <Input
                      label="Sobrenome"
                      value={form.lastName}
                      onChange={update("lastName")}
                      placeholder="Ex: Almeida"
                      required
                    />
                  </div>
                </div>

                <Input
                  label="E-mail principal"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="voce@igreja.org"
                  required
                />

                <Input
                  label="Senha de acesso"
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Minimo de 8 caracteres"
                  required
                />

                <Input
                  label="Confirmar senha"
                  type="password"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  placeholder="Repita a senha"
                  required
                />
              </div>
            ) : null}

            {step === 1 ? (
              <Input
                label="Telefone principal"
                type="tel"
                value={form.phone}
                onChange={update("phone")}
                placeholder="+55 11 99999-9999"
                hint="Use o telefone que a central pretende divulgar para atendimento e alinhamento."
                required
              />
            ) : null}

            {step === 2 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Input
                  label="Nome da central"
                  value={form.tenantName}
                  onChange={update("tenantName")}
                  placeholder="Ex: Central Adrianopolis"
                  required
                />

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "2 1 200px" }}>
                    <Input
                      label="Cidade"
                      value={form.city}
                      onChange={update("city")}
                      placeholder="Ex: Manaus"
                      required
                    />
                  </div>
                  <div style={{ flex: "1 1 90px" }}>
                    <Input
                      label="UF"
                      value={form.state}
                      onChange={(value) => update("state")(value.toUpperCase().slice(0, 2))}
                      placeholder="AM"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <Input
                  label="Sigla"
                  value={form.sigla}
                  onChange={(value) => update("sigla")(value.toUpperCase().slice(0, 3))}
                  placeholder="CA"
                  hint="A sigla aparece na identificacao visual da central."
                  required
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Cor principal</label>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {TENANT_COLORS.map((color) => {
                      const selected = form.color === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => update("color")(color)}
                          aria-label={`Selecionar cor ${color}`}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            border: "none",
                            background: color,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: selected ? `0 0 0 3px var(--surface), 0 0 0 5px ${color}` : "none",
                          }}
                        >
                          {selected ? <IconCheck size={16} style={{ color: "#fff" }} /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    padding: 16,
                    background: "var(--surface-2)",
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Coordenacao</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "right" }}>
                      {form.firstName} {form.lastName}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Contato</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "right" }}>
                      {form.phone}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>E-mail</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "right" }}>
                      {form.email}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Central</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "right" }}>
                      {form.tenantName} ({form.city} - {form.state})
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Identidade</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: form.color,
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {form.sigla}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Sigla e cor definidas</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {step < STEP_TITLES.length - 1 ? (
              <Button onClick={handleNextStep} variant="primary" full iconRight={<IconChevronRight />}>
                Avancar
              </Button>
            ) : (
              <Button onClick={handleSubmit} variant="primary" full disabled={submitting}>
                {submitting ? "Finalizando cadastro..." : "Ativar central"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
