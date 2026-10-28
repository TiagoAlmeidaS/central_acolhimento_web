import type { ReactNode } from "react";
import { Button, Input } from "@/ui/atalaia";
import { AuthShell } from "./auth-shell";
import { AuthStateCard } from "./auth-states";
import { AuthLink } from "./auth-parts";

export type CaregiverFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type CaregiverFormErrors = Partial<Record<keyof CaregiverFormValues, string>>;

/** Mesmas regras dos dois fluxos (convite e canal): obrigatorios, senha de 8+ e confirmacao. */
export function validateCaregiverForm(form: CaregiverFormValues): CaregiverFormErrors {
  const errors: CaregiverFormErrors = {};
  if (!form.firstName.trim()) errors.firstName = "Informe seu nome.";
  if (!form.lastName.trim()) errors.lastName = "Informe seu sobrenome.";
  if (!form.email.trim()) errors.email = "Informe seu e-mail.";
  else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Informe um e-mail válido, como voce@igreja.org.br.";
  if (!form.phone.trim()) errors.phone = "Informe o telefone principal.";
  if (form.password.length < 8) errors.password = "A senha precisa ter pelo menos 8 caracteres.";
  if (form.password !== form.confirmPassword) errors.confirmPassword = "As senhas não conferem.";
  return errors;
}

export function focusFirstCaregiverError(errors: CaregiverFormErrors) {
  const order: Array<keyof CaregiverFormValues> = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "password",
    "confirmPassword",
  ];
  const first = order.find((key) => errors[key]);
  if (first) requestAnimationFrame(() => document.getElementById(`cg-${first}`)?.focus());
}

/** Campos do cadastro do cuidador, iguais no convite e no canal. */
export function CaregiverFields({
  form,
  errors,
  onChange,
  emailLocked = false,
}: Readonly<{
  form: CaregiverFormValues;
  errors: CaregiverFormErrors;
  onChange: (key: keyof CaregiverFormValues, value: string) => void;
  emailLocked?: boolean;
}>) {
  return (
    <>
      <div className="grid items-start gap-3 min-[560px]:grid-cols-2">
        <Input
          id="cg-firstName"
          label="Nome"
          value={form.firstName}
          onChange={(event) => onChange("firstName", event.target.value)}
          placeholder="Ex.: Maria"
          autoComplete="given-name"
          required
          error={errors.firstName}
        />
        <Input
          id="cg-lastName"
          label="Sobrenome"
          value={form.lastName}
          onChange={(event) => onChange("lastName", event.target.value)}
          placeholder="Ex.: Oliveira"
          autoComplete="family-name"
          required
          error={errors.lastName}
        />
      </div>
      <Input
        id="cg-email"
        label="E-mail"
        type="email"
        value={form.email}
        onChange={(event) => onChange("email", event.target.value)}
        placeholder="voce@igreja.org.br"
        autoComplete="email"
        disabled={emailLocked}
        hint={emailLocked ? "Este e-mail foi reservado para você no convite." : undefined}
        required
        error={errors.email}
      />
      <Input
        id="cg-phone"
        label="Telefone principal"
        type="tel"
        inputMode="tel"
        value={form.phone}
        onChange={(event) => onChange("phone", event.target.value)}
        placeholder="+55 11 99999-9999"
        autoComplete="tel"
        required
        error={errors.phone}
      />
      <div className="grid items-start gap-3 min-[560px]:grid-cols-2">
        <Input
          id="cg-password"
          label="Senha"
          type="password"
          value={form.password}
          onChange={(event) => onChange("password", event.target.value)}
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          required
          error={errors.password}
        />
        <Input
          id="cg-confirmPassword"
          label="Confirmar senha"
          type="password"
          value={form.confirmPassword}
          onChange={(event) => onChange("confirmPassword", event.target.value)}
          placeholder="Repita a senha"
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
        />
      </div>
    </>
  );
}

/** Faixa noturna dos fluxos de cuidador: diz qual igreja convidou, antes do formulario. */
export function CaregiverSide({
  kicker,
  churchName,
  location,
  note,
}: Readonly<{ kicker: string; churchName: string; location?: string | null; note?: ReactNode }>) {
  return (
    <div className="grid gap-2 min-[900px]:gap-3">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--night-muted)]">
        {kicker}
      </span>
      <p className="font-display text-[26px] font-medium leading-[1.1] tracking-[-0.035em] text-[var(--night-fg)] min-[900px]:text-[34px]">
        {churchName}
      </p>
      {location ? <p className="text-sm text-[var(--night-muted)]">{location}</p> : null}
      {note ? <p className="hidden max-w-[34ch] text-sm text-[var(--night-muted)] min-[900px]:block">{note}</p> : null}
    </div>
  );
}

/** Pagina de link que nao existe mais (convite ou canal): ensina o que fazer. */
export function CaregiverLinkNotFound({ kind }: Readonly<{ kind: "convite" | "canal" }>) {
  return (
    <AuthShell footer={<p><AuthLink href="/login">Já tem acesso? Entrar</AuthLink></p>}>
      <AuthStateCard
        eyebrow={kind === "convite" ? "Convite de cuidador" : "Cadastro de cuidador"}
        title={kind === "convite" ? "Não encontramos este convite" : "Não encontramos este canal de cadastro"}
        reason="O link pode ter sido digitado incompleto, ou já foi removido pela coordenação."
        hint="Peça à coordenação da sua igreja um novo link e abra-o direto da mensagem, sem copiar e colar pela metade."
        actions={
          <Button href="/login" variant="primary">
            Ir para o login
          </Button>
        }
      />
    </AuthShell>
  );
}
