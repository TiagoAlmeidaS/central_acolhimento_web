"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaregiverInvitation } from "@/server/domain/mvp";
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

function unavailableCopy(status: CaregiverInvitation["status"], isExpired: boolean): UnavailableCopy {
  if (status === "accepted") {
    return {
      title: "Este convite já foi usado",
      reason: "Um convite vale para um único cadastro, e este já foi concluído.",
      hint: "Se foi você, é só entrar com o e-mail e a senha que criou. Se não foi, avise a coordenação da igreja.",
    };
  }
  if (status === "revoked") {
    return {
      title: "Este convite foi cancelado",
      reason: "A coordenação da igreja cancelou este link, então ele não cria mais acessos.",
      hint: "Peça à coordenação um novo convite e abra o link novo.",
    };
  }
  if (status === "expired" || isExpired) {
    return {
      title: "Este convite expirou",
      reason: "Os convites têm prazo de validade por segurança, e o prazo deste já passou.",
      hint: "Peça à coordenação da sua igreja um novo convite. Leva um minuto para ser gerado.",
    };
  }
  return {
    title: "Este convite não está disponível",
    reason: "O link não pode mais ser usado para criar um acesso.",
    hint: "Peça à coordenação da sua igreja um novo convite.",
  };
}

export function CaregiverInvitationAcceptForm({
  invitation,
  tenantName,
  tenantLocation,
}: Readonly<{
  invitation: CaregiverInvitation;
  /** Nome da igreja que convidou (buscado no servidor a partir do convite). */
  tenantName?: string | null;
  /** Cidade - UF da igreja, quando conhecida. */
  tenantLocation?: string | null;
}>) {
  const router = useRouter();
  const [form, setForm] = useState<CaregiverFormValues>({
    firstName: "",
    lastName: "",
    email: invitation.email ?? "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<CaregiverFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isUnavailable = invitation.status !== "pending" || isExpired;
  const churchName = tenantName ?? "Sua igreja";
  const expiresLabel = new Date(invitation.expiresAt).toLocaleDateString("pt-BR");

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

    try {
      const response = await fetch(`/api/invitations/${invitation.token}/accept`, {
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
    } catch {
      setError("Erro de rede. Tente novamente.");
      setSubmitting(false);
      return;
    }

    setDone(true);
    router.replace(`/login?email=${encodeURIComponent(form.email)}&invited=1`);
  }

  const loginHref = `/login?email=${encodeURIComponent(form.email)}&invited=1`;

  if (isUnavailable) {
    const copy = unavailableCopy(invitation.status, isExpired);
    return (
      <AuthShell
        side={<CaregiverSide kicker="Convite de cuidador" churchName={churchName} location={tenantLocation} />}
        footer={
          <p>
            <AuthLink href="/login">Já tem acesso? Entrar</AuthLink>
          </p>
        }
      >
        <AuthStateCard
          eyebrow="Convite de cuidador"
          title={copy.title}
          reason={copy.reason}
          hint={copy.hint}
          icon={invitation.status === "accepted" ? "check" : "clock"}
          tone={invitation.status === "accepted" ? "success" : "warning"}
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
    return (
      <AuthShell
        side={<CaregiverSide kicker="Convite de cuidador" churchName={churchName} location={tenantLocation} />}
      >
        <AuthStateCard
          eyebrow="Cadastro concluído"
          title="Seu acesso está pronto"
          reason={`Você agora faz parte da equipe de cuidadores${tenantName ? ` de ${tenantName}` : ""}. Falta só entrar com o e-mail e a senha que acabou de criar para abrir o app do cuidador.`}
          hint="Estamos levando você para o login."
          icon="check"
          tone="success"
          actions={
            <Button href={loginHref} variant="primary">
              Abrir o app do cuidador
            </Button>
          }
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      side={
        <CaregiverSide
          kicker="Convite de cuidador"
          churchName={churchName}
          location={tenantLocation}
          note="Você foi convidado(a) para cuidar de quem chega à igreja. Seu acesso fica limitado aos contatos e acompanhamentos desta igreja."
        />
      }
      footer={
        <p>
          Já tem acesso? <AuthLink href="/login">Entrar</AuthLink>
        </p>
      }
    >
      <AuthCard>
        <AuthHeading
          eyebrow="Convite de cuidador"
          title="Criar meu acesso"
          lead={`${tenantName ? `${tenantName} convidou você.` : "Você recebeu um convite."} Preencha os dados abaixo. O convite vale até ${expiresLabel}.`}
        />

        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <CaregiverFields form={form} errors={errors} onChange={setField} emailLocked={Boolean(invitation.email)} />

          {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

          <Button type="submit" variant="primary" loading={submitting} className="w-full">
            {submitting ? "Finalizando…" : "Criar meu acesso"}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
