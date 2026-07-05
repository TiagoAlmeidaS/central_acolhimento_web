"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button, Card, Select } from "@/ui/v2-components/ui";
import { IconChevronRight, IconArrowLeft, IconCheck } from "@/ui/v2-components/icons";

const TENANT_COLORS = [
  "#2D7FF9", // AD Adrianópolis
  "#10B981", // VM Vila Mariana
  "#F59E0B", // AL Aldeota
  "#7C3AED", // Pro
  "#EC4899", // Pink
  "#6366F1", // Indigo
];

function siglaFrom(nome: string): string {
  const words = nome.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AD";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function CoordinatorSignupForm() {
  const router = useRouter();
  
  // Step state: 0 -> Identidade, 1 -> WhatsApp OTP, 2 -> Localidade, 3 -> Personaliza, 4 -> Revisao
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
    cor: TENANT_COLORS[0],
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (value: string) => {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      // Auto derive sigla when tenantName changes and sigla hasn't been edited
      if (key === "tenantName" && !f.sigla) {
        updated.sigla = siglaFrom(value);
      }
      return updated;
    });
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "").substring(0, 1);
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);

    // Auto-focus next field
    if (clean && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleNextStep = () => {
    setError(null);

    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        setError("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
      if (form.password.length < 8) {
        setError("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("As senhas não conferem.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!form.phone) {
        setError("Por favor, informe seu WhatsApp.");
        return;
      }
      // Simulate OTP confirmation
      const filled = otp.every((digit) => digit.length === 1);
      if (!filled) {
        setError("Digite o código de 6 dígitos enviado ao seu WhatsApp.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.tenantName || !form.city || !form.state) {
        setError("Preencha as informações da localidade.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!form.sigla) {
        setError("Digite a sigla da localidade.");
        return;
      }
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
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
          // Custom properties can be stored or resolved on creation:
          sigla: form.sigla || siglaFrom(form.tenantName),
          color: form.cor,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Não foi possível criar o acesso da coordenação.");
        setSubmitting(false);
        return;
      }

      router.replace(`/login?email=${encodeURIComponent(form.email)}&registered=1`);
    } catch {
      setError("Erro de rede. Tente novamente.");
      setSubmitting(false);
    }
  };

  // Step Indicators
  const stepsTitles = ["Líder", "Verificação", "Localidade", "Estilo", "Revisão"];

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
      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Step Indicator Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px" }}>
          {step > 0 ? (
            <button
              onClick={handlePrevStep}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--text-2)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <IconArrowLeft size={16} /> Voltar
            </button>
          ) : (
            <Link
              href="/login"
              style={{
                color: "var(--text-2)",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <IconArrowLeft size={16} /> Login
            </Link>
          )}

          <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 700 }}>
            Etapa {step + 1} de 5
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ display: "flex", gap: 6, padding: "0 8px" }}>
          {stepsTitles.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? "var(--accent)" : "var(--border)",
                transition: "background-color 0.25s",
              }}
            />
          ))}
        </div>

        <Card padding={28}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Step Header */}
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
                {stepsTitles[step]}
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-2)" }}>
                {step === 0 && "Insira seus dados pessoais de liderança pastoral."}
                {step === 1 && "Enviaremos um código SMS ou WhatsApp para validação."}
                {step === 2 && "Configure o nome e a abrangência da sua localidade."}
                {step === 3 && "Personalize a identidade visual do seu canal local."}
                {step === 4 && "Confirme todos os dados antes de ativar a central."}
              </p>
            </div>

            {error && (
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
            )}

            {/* STEP 0: Identidade do Lider */}
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Nome"
                      value={form.firstName}
                      onChange={update("firstName")}
                      placeholder="Ex: Daniel"
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Sobrenome"
                      value={form.lastName}
                      onChange={update("lastName")}
                      placeholder="Ex: Bemol"
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
                  placeholder="Mínimo 8 caracteres"
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
            )}

            {/* STEP 1: OTP WhatsApp */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <Input
                  label="WhatsApp / Celular"
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+55 92 99999-9999"
                  required
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
                    Código de verificação (Simulado: use 1-2-3-4-5-6)
                  </label>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        style={{
                          width: 50,
                          height: 54,
                          borderRadius: 12,
                          border: "1.5px solid var(--border)",
                          background: "var(--surface)",
                          textAlign: "center",
                          fontSize: 18,
                          fontWeight: 700,
                          outline: "none",
                          color: "var(--text)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Localidade */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Input
                  label="Nome da central / Igreja"
                  value={form.tenantName}
                  onChange={update("tenantName")}
                  placeholder="Ex: Adrianópolis"
                  required
                />

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 2 }}>
                    <Input
                      label="Cidade"
                      value={form.city}
                      onChange={update("city")}
                      placeholder="Ex: Manaus"
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="UF"
                      value={form.state}
                      onChange={(val) => update("state")(val.toUpperCase())}
                      placeholder="AM"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Personaliza */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <Input
                  label="Sigla da Localidade (Máx 3 letras)"
                  value={form.sigla}
                  onChange={(val) => update("sigla")(val.toUpperCase().substring(0, 3))}
                  placeholder="Ex: AD"
                  required
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
                    Cor do Tema
                  </label>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {TENANT_COLORS.map((c) => {
                      const selected = form.cor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => update("cor")(c)}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: c,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: selected ? `0 0 0 3px var(--surface), 0 0 0 5.5px ${c}` : "none",
                            transition: "all 0.15s",
                          }}
                        >
                          {selected && <IconCheck size={16} style={{ color: "#fff" }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Revisao */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: 16, background: "var(--surface-2)", borderRadius: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Líder</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {form.firstName} {form.lastName}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>WhatsApp</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {form.phone}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>E-mail</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {form.email}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Localidade</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {form.tenantName} ({form.city} - {form.state})
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Visual</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: form.cor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {form.sigla}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        Sigla & Cor ativada
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {step < 4 ? (
              <Button onClick={handleNextStep} variant="primary" full iconRight={<IconChevronRight />}>
                Avançar
              </Button>
            ) : (
              <Button onClick={handleSubmit} variant="primary" full disabled={submitting}>
                {submitting ? "Finalizando cadastro..." : "Ativar Central"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
