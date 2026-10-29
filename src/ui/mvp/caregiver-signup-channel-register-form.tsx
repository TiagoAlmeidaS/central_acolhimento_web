"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaregiverSignupChannel } from "@/server/domain/mvp";
import { Button } from "@/ui/atalaia";
import { AuthCard, AuthHeading, AuthLink, AuthNotice, AuthShell, AuthStateCard } from "@/ui/auth";
import {
  CaregiverFields,
  CaregiverSide,
  focusFirstCaregiverError,
  validateCaregiverForm,
  type CaregiverFormErrors,
  type CaregiverFormValues,
} from "@/ui/auth/caregiver-entry";

type UnavailableCopy = { title: string; reason: string; hint: string };

function unavailableCopy(channel: CaregiverSignupChannel, isExpired: boolean): UnavailableCopy {
  if (!channel.active) {
    return {
      title: "Este canal de cadastro está fechado",
      reason: "A coordenação da igreja desativou este link, então ele não recebe mais cadastros.",
      hint: "Peça à coordenação um link novo. Ela gera outro em poucos cliques.",
    };
  }
  if (isExpired) {
    return {
      title: "Este canal de cadastro expirou",
      reason: "O prazo deste link já passou. Os links têm validade para que ninguém de fora se cadastre depois.",
      hint: "Peça à coordenação da sua igreja um link novo.",
    };
  }
  return {
    title: "Este canal atingiu o limite de cadastros",
    reason: "Todas as vagas deste link já foram usadas.",
    hint: "Peça à coordenação da sua igreja um link novo, ou que ela aumente o limite deste canal.",
  };
}

export function CaregiverSignupChannelRegisterForm({
  channel,
}: Readonly<{
  channel: CaregiverSignupChannel;
}>) {
  const router = useRouter();
  const [form, setForm] = useState<CaregiverFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<CaregiverFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"submitted" | "approved" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isExpired = channel.expiresAt ? new Date(channel.expiresAt) < new Date() : false;
  const isUnavailable = !channel.active || isExpired || (channel.maxUses !== null && channel.usesCount >= channel.maxUses);

  const churchName = channel.tenantName ?? "Sua igreja";
  const location =
    channel.tenantCity && channel.tenantState ? `${channel.tenantCity} - ${channel.tenantState}` : null;
  const side = (
    <CaregiverSide
      kicker="Cadastro de cuidador"
      churchName={churchName}
      location={location}
      note={
        channel.requireApproval
          ? "Depois do envio, a coordenação revisa seu cadastro antes de liberar o acesso."
          : "Depois do envio, seu acesso é criado na hora para esta igreja."
      }
    />
  );

  function setField(key: keyof CaregiverFormValues, value: string) {
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const found = validateCaregiverForm(form);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      focusFirstCaregiverError(found);
      return;
    }

    setSubmitting(true);

    let status: "submitted" | "approved";
    try {
      const response = await fetch(`/api/signup-channels/public/${channel.token}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Não foi possível concluir o cadastro.");
        setSubmitting(false);
        return;
      }

      const payload = (await response.json()) as { status: "submitted" | "approved" };
      status = payload.status;
    } catch {
      setError("Erro de rede. Tente novamente.");
      setSubmitting(false);
      return;
    }

    if (status === "submitted") {
      setDone("submitted");
      router.replace(`/login?email=${encodeURIComponent(form.email)}&pendingApproval=1`);
      return;
    }

    setDone("approved");
    router.replace(`/login?email=${encodeURIComponent(form.email)}&invited=1`);
  }

  if (isUnavailable) {
    const copy = unavailableCopy(channel, isExpired);
    return (
      <AuthShell
        side={side}
        footer={
          <p>
            <AuthLink href="/login">Já tem acesso? Entrar</AuthLink>
          </p>
        }
      >
        <AuthStateCard
          eyebrow="Cadastro de cuidador"
          title={copy.title}
          reason={copy.reason}
          hint={copy.hint}
          icon="clock"
          actions={
            <Button href="/login" variant="primary">
              Ir para o login
            </Button>
          }
        />
      </AuthShell>
    );
  }

  if (done) {
    const pending = done === "submitted";
    return (
      <AuthShell side={side}>
        <AuthStateCard
          eyebrow={pending ? "Cadastro enviado" : "Cadastro concluído"}
          title={pending ? "Agora é com a coordenação" : "Seu acesso está pronto"}
          reason={
            pending
              ? `A coordenação de ${churchName} vai revisar seu cadastro. Quando ela aprovar, entre com o e-mail e a senha que você criou para abrir o app do cuidador.`
              : `Você agora faz parte da equipe de cuidadores de ${churchName}. Entre com o e-mail e a senha que acabou de criar para abrir o app do cuidador.`
          }
          hint="Estamos levando você para o login."
          icon={pending ? "clock" : "check"}
          tone={pending ? "warning" : "success"}
          actions={
            <Button
              href={`/login?email=${encodeURIComponent(form.email)}&${pending ? "pendingApproval" : "invited"}=1`}
              variant="primary"
            >
              {pending ? "Ir para o login" : "Abrir o app do cuidador"}
            </Button>
          }
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      side={side}
      footer={
        <p>
          Já tem acesso? <AuthLink href="/login">Entrar</AuthLink>
        </p>
      }
    >
      <AuthCard>
        <AuthHeading
          eyebrow="Cadastro de cuidador"
          title="Entrar na equipe"
          lead={
            channel.tenantName
              ? `Você está se cadastrando em ${channel.tenantName}, pelo canal “${channel.name}”.`
              : "Finalize seu cadastro para entrar na equipe de cuidadores do Atalaia."
          }
        />

        <AuthNotice tone="info" title={channel.requireApproval ? "Aprovação da coordenação" : "Liberação imediata"}>
          {channel.requireApproval
            ? "Depois do envio, a coordenação local vai revisar seu cadastro antes de liberar o acesso."
            : "Depois do envio, seu acesso é criado na hora para esta igreja."}
        </AuthNotice>

        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <CaregiverFields form={form} errors={errors} onChange={setField} />

          {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

          <Button type="submit" variant="primary" loading={submitting} className="w-full">
            {submitting ? "Enviando…" : channel.requireApproval ? "Enviar para aprovação" : "Criar meu acesso"}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
