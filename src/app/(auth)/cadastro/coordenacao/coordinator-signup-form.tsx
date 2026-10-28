"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, Input, cx } from "@/ui/atalaia";
import { AuthHeading, AuthLink, AuthNotice, AuthShell, AuthSummary } from "@/ui/auth";
import { OnboardingSteps } from "@/ui/auth/onboarding-steps";

const TENANT_COLORS = [
  { value: "#2D7FF9", name: "Azul" },
  { value: "#10B981", name: "Verde" },
  { value: "#F59E0B", name: "Âmbar" },
  { value: "#7C3AED", name: "Violeta" },
  { value: "#EC4899", name: "Rosa" },
  { value: "#6366F1", name: "Índigo" },
] as const;

/** Passos do onboarding. Os campos do cadastro original foram agrupados em Igreja e Você. */
const STEPS = ["Igreja", "Você (coordenação)", "Revisar e criar"] as const;
const LAST_STEP = STEPS.length - 1;

type FormState = {
  tenantName: string;
  city: string;
  state: string;
  sigla: string;
  color: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function siglaFrom(nome: string): string {
  const words = nome.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CA";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Validacao por passo: as mesmas regras do cadastro original, agora campo a campo. */
function validateStep(step: number, form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 0) {
    if (!form.tenantName.trim()) errors.tenantName = "Informe o nome da igreja.";
    if (!form.city.trim()) errors.city = "Informe a cidade.";
    if (!form.state.trim()) errors.state = "Informe a UF.";
    if (!form.sigla) errors.sigla = "Informe uma sigla para identificar a central.";
  }

  if (step === 1) {
    if (!form.firstName.trim()) errors.firstName = "Informe seu nome.";
    if (!form.lastName.trim()) errors.lastName = "Informe seu sobrenome.";
    if (!form.email.trim()) errors.email = "Informe o e-mail principal.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      errors.email = "Informe um e-mail válido, como voce@igreja.org.br.";
    if (!form.phone.trim()) errors.phone = "Informe um telefone principal para contato da central.";
    if (!form.password) errors.password = "Crie uma senha de acesso.";
    else if (form.password.length < 8) errors.password = "A senha precisa ter pelo menos 8 caracteres.";
    if (!form.confirmPassword) errors.confirmPassword = "Repita a senha.";
    else if (form.password !== form.confirmPassword) errors.confirmPassword = "As senhas não conferem.";
  }

  return errors;
}

export function CoordinatorSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    tenantName: "",
    city: "",
    state: "",
    sigla: "",
    color: TENANT_COLORS[0].value,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [siglaTouched, setSiglaTouched] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const didMount = useRef(false);

  // Ao trocar de passo, o foco vai para o titulo (leitor de tela anuncia o passo novo).
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const update = (key: keyof FormState) => (value: string) => {
    const derivesSigla = key === "tenantName" && !siglaTouched && value.trim() !== "";
    setErrors((current) => {
      if (!current[key] && !(derivesSigla && current.sigla)) return current;
      return { ...current, [key]: undefined, ...(derivesSigla ? { sigla: undefined } : {}) };
    });
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "tenantName" && !siglaTouched) {
        next.sigla = value.trim() ? siglaFrom(value) : "";
      }
      return next;
    });
  };

  function goTo(target: number) {
    setError(null);
    setErrors({});
    setStep(target);
  }

  function focusFirstInvalid(found: FieldErrors) {
    const first = (Object.keys(found) as Array<keyof FormState>).find((key) => found[key]);
    if (first) requestAnimationFrame(() => document.getElementById(`onb-${first}`)?.focus());
  }

  async function submit() {
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
        setError(payload.error ?? "Não foi possível criar o acesso da coordenação.");
        setSubmitting(false);
        return;
      }

      router.replace(`/login?email=${encodeURIComponent(form.email)}&registered=1`);
    } catch {
      setError("Erro de rede. Tente novamente.");
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (step < LAST_STEP) {
      const found = validateStep(step, form);
      setErrors(found);
      if (Object.values(found).some(Boolean)) {
        focusFirstInvalid(found);
        return;
      }
      setStep(step + 1);
      return;
    }

    // Antes de enviar, revalida tudo: o usuario pode ter voltado e apagado algo.
    for (const s of [0, 1]) {
      const found = validateStep(s, form);
      if (Object.values(found).some(Boolean)) {
        setErrors(found);
        setStep(s);
        focusFirstInvalid(found);
        return;
      }
    }
    void submit();
  }

  const isLast = step === LAST_STEP;

  return (
    <AuthShell
      width="wide"
      side={<OnboardingSteps steps={STEPS} current={step} />}
      footer={
        <p>
          Já tem uma central? <AuthLink href="/login">Entrar</AuthLink>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-[18px]">
        {step === 0 ? (
          <>
            <AuthHeading
              size="lg"
              headingRef={headingRef}
              eyebrow={`Passo 1 de ${STEPS.length}`}
              title="Qual igreja vai usar a central?"
              lead="Esses dados identificam a central. Você pode ajustar depois, em Ajustes."
            />
            <Input
              id="onb-tenantName"
              label="Nome da igreja"
              value={form.tenantName}
              onChange={(event) => update("tenantName")(event.target.value)}
              placeholder="Ex.: Igreja Central Adrianópolis"
              autoComplete="organization"
              required
              error={errors.tenantName}
            />
            <div className="grid grid-cols-[minmax(0,1fr)_88px] items-start gap-3">
              <Input
                id="onb-city"
                label="Cidade"
                value={form.city}
                onChange={(event) => update("city")(event.target.value)}
                placeholder="Ex.: Manaus"
                autoComplete="address-level2"
                required
                error={errors.city}
              />
              <Input
                id="onb-state"
                label="UF"
                value={form.state}
                onChange={(event) => update("state")(event.target.value.toUpperCase().slice(0, 2))}
                placeholder="AM"
                maxLength={2}
                autoComplete="address-level1"
                required
                error={errors.state}
              />
            </div>
            <Input
              id="onb-sigla"
              label="Sigla"
              value={form.sigla}
              onChange={(event) => {
                setSiglaTouched(true);
                update("sigla")(event.target.value.toUpperCase().slice(0, 3));
              }}
              placeholder="CA"
              hint="Até 3 letras. Aparece na identificação visual da central."
              required
              error={errors.sigla}
              wrapperClassName="max-w-[280px]"
            />
            <div className="grid gap-1">
              <span id="onb-color-label" className="text-xs font-semibold text-muted">
                Cor principal
              </span>
              <div role="radiogroup" aria-labelledby="onb-color-label" className="flex flex-wrap gap-2.5">
                {TENANT_COLORS.map((color) => {
                  const selected = form.color === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={color.name}
                      title={color.name}
                      onClick={() => update("color")(color.value)}
                      style={{ background: color.value }}
                      className={cx(
                        "grid size-8 cursor-pointer place-items-center rounded-full border-0 text-white transition-shadow duration-150 max-[560px]:size-9",
                        selected && "shadow-[0_0_0_2px_var(--bg),0_0_0_4px_var(--fg)]",
                      )}
                    >
                      {selected ? <Icon name="check" size={15} /> : null}
                    </button>
                  );
                })}
              </div>
              <small className="text-xs text-subtle">A cor que acompanha a sigla da sua central.</small>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <AuthHeading
              size="lg"
              headingRef={headingRef}
              eyebrow={`Passo 2 de ${STEPS.length}`}
              title="Quem coordena o acolhimento?"
              lead="A coordenação vê todos os contatos da igreja e gerencia os cuidadores."
            />
            <div className="grid items-start gap-3 min-[560px]:grid-cols-2">
              <Input
                id="onb-firstName"
                label="Nome"
                value={form.firstName}
                onChange={(event) => update("firstName")(event.target.value)}
                placeholder="Ex.: Daniel"
                autoComplete="given-name"
                required
                error={errors.firstName}
              />
              <Input
                id="onb-lastName"
                label="Sobrenome"
                value={form.lastName}
                onChange={(event) => update("lastName")(event.target.value)}
                placeholder="Ex.: Almeida"
                autoComplete="family-name"
                required
                error={errors.lastName}
              />
            </div>
            <div className="grid items-start gap-3 min-[560px]:grid-cols-2">
              <Input
                id="onb-email"
                label="E-mail principal"
                type="email"
                value={form.email}
                onChange={(event) => update("email")(event.target.value)}
                placeholder="voce@igreja.org.br"
                autoComplete="email"
                required
                error={errors.email}
              />
              <Input
                id="onb-phone"
                label="Telefone principal"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => update("phone")(event.target.value)}
                placeholder="+55 11 99999-9999"
                autoComplete="tel"
                hint="Contato da coordenação. Não enviamos código por SMS ou WhatsApp."
                required
                error={errors.phone}
              />
            </div>
            <div className="grid items-start gap-3 min-[560px]:grid-cols-2">
              <Input
                id="onb-password"
                label="Senha de acesso"
                type="password"
                value={form.password}
                onChange={(event) => update("password")(event.target.value)}
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                required
                error={errors.password}
              />
              <Input
                id="onb-confirmPassword"
                label="Confirmar senha"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => update("confirmPassword")(event.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
                error={errors.confirmPassword}
              />
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <AuthHeading
              size="lg"
              headingRef={headingRef}
              eyebrow={`Passo 3 de ${STEPS.length}`}
              title="Confira e crie a central"
              lead="Tudo certo? Ao criar, você volta para o login e entra com o e-mail e a senha da coordenação."
            />
            <AuthSummary
              items={[
                {
                  label: "Igreja",
                  value: (
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          style={{ background: form.color }}
                          className="grid size-7 shrink-0 place-items-center rounded-full font-mono text-[11px] font-medium text-white"
                        >
                          {form.sigla}
                        </span>
                        <span className="min-w-0">
                          <strong className="font-medium">{form.tenantName}</strong>
                          <span className="block text-xs text-muted">
                            {form.city} - {form.state} · sigla {form.sigla}
                          </span>
                        </span>
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => goTo(0)}>
                        Editar<span className="sr-only"> igreja</span>
                      </Button>
                    </span>
                  ),
                },
                {
                  label: "Coordenação",
                  value: (
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0">
                        <strong className="font-medium">
                          {form.firstName} {form.lastName}
                        </strong>
                        <span className="block text-xs text-muted">{form.email}</span>
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => goTo(1)}>
                        Editar<span className="sr-only"> coordenação</span>
                      </Button>
                    </span>
                  ),
                },
                { label: "Telefone", value: form.phone },
                { label: "Senha", value: "Definida (oculta por segurança)" },
              ]}
            />
          </>
        ) : null}

        {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

        <div className="mt-2 flex justify-between gap-2">
          {step === 0 ? (
            <Button href="/login" variant="ghost">
              Voltar ao login
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={submitting}>
              Voltar
            </Button>
          )}
          <Button type="submit" variant="primary" loading={submitting}>
            {isLast ? (submitting ? "Criando a central…" : "Criar a central") : "Continuar"}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
