"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaregiverInvitation, Tenant } from "@/server/domain/mvp";
import { sortInvitationsByCreatedAt } from "@/ui/mvp/caregiver-invitation-utils";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Drawer,
  EmptyState,
  Eyebrow,
  Input,
  Pill,
  Select,
  Table,
  Td,
  Th,
  Tr,
  type PillTone,
  useToast,
} from "@/ui/atalaia";
import { CopyButton } from "@/ui/coord/copy-button";

const defaultExpiresInDays = 7;

const INVITE_STATUS: Record<CaregiverInvitation["status"], { label: string; tone: PillTone }> = {
  pending: { label: "Pendente", tone: "warning" },
  accepted: { label: "Aceito", tone: "success" },
  expired: { label: "Expirado", tone: "muted" },
  revoked: { label: "Revogado", tone: "danger" },
};

/** Convites por link: gerar num drawer, acompanhar na tabela. */
export function CaregiverInvitationManager({
  tenants,
  invitations,
}: Readonly<{
  tenants: Tenant[];
  invitations: CaregiverInvitation[];
}>) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(String(defaultExpiresInDays));
  const [role, setRole] = useState<"caregiver" | "coordinator">("caregiver");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestLink, setLatestLink] = useState<string | null>(null);

  const sortedInvitations = useMemo(() => sortInvitationsByCreatedAt(invitations), [invitations]);
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const pendingCount = invitations.filter((invitation) => invitation.status === "pending").length;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        email: email || null,
        expiresInDays: Number(expiresInDays) || defaultExpiresInDays,
        role,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Não foi possível gerar o convite.");
      setSubmitting(false);
      return;
    }

    const invitation = (await response.json()) as CaregiverInvitation;
    setLatestLink(invitation.inviteUrl);
    setEmail("");
    setExpiresInDays(String(defaultExpiresInDays));
    setSubmitting(false);
    setOpen(false);
    toast("Convite gerado. Copie o link e envie.");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <Card aria-labelledby="invites-heading">
        <CardHeader
          id="invites-heading"
          title="Convites de cuidadores"
          meta={pendingCount > 0 ? `${pendingCount} pendente(s)` : undefined}
          action={
            <Button variant="primary" size="sm" icon="plus" onClick={() => setOpen(true)} disabled={tenants.length === 0}>
              Gerar convite
            </Button>
          }
        />
        <CardBody className="grid gap-3">
          <p className="text-[13px] text-muted">
            Gere um link por localidade para que cada cuidador finalize o próprio cadastro.
          </p>

          {latestLink ? (
            <div className="grid gap-2 rounded-card border border-primary bg-primary-soft px-3.5 py-3">
              <Eyebrow className="text-primary">Último link gerado</Eyebrow>
              <p className="break-all font-mono text-xs">{latestLink}</p>
              <div>
                <CopyButton link={latestLink} />
              </div>
            </div>
          ) : null}

          {sortedInvitations.length === 0 ? (
            <EmptyState
              title="Nenhum convite criado ainda."
              reason="Convites levam a pessoa direto ao cadastro de cuidador da localidade escolhida."
              hint="Use “Gerar convite” no topo deste cartão e envie o link por mensagem."
            />
          ) : (
            <Table caption="Convites recentes" wrapperClassName="-mx-4">
              <thead>
                <tr>
                  <Th>Localidade</Th>
                  <Th>Função</Th>
                  <Th>E-mail</Th>
                  <Th>Validade</Th>
                  <Th>Situação</Th>
                  <Th>
                    <span className="sr-only">Link</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {sortedInvitations.map((invitation) => {
                  const status = INVITE_STATUS[invitation.status] ?? INVITE_STATUS.pending;
                  return (
                    <Tr key={invitation.id}>
                      <Td className="font-semibold">{tenantById.get(invitation.tenantId)?.name ?? "Localidade"}</Td>
                      <Td>
                        <Pill tone={invitation.role === "coordinator" ? "primary" : "neutral"} dot={false}>
                          {invitation.role === "coordinator" ? "Coordenador" : "Cuidador"}
                        </Pill>
                      </Td>
                      <Td className="text-muted">{invitation.email ?? "Convite aberto"}</Td>
                      <Td className="font-mono text-xs">
                        {invitation.acceptedAt
                          ? `Aceito em ${new Date(invitation.acceptedAt).toLocaleDateString("pt-BR")}`
                          : `Expira ${new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}`}
                      </Td>
                      <Td>
                        <Pill tone={status.tone}>{status.label}</Pill>
                      </Td>
                      <Td className="text-right">
                        <CopyButton link={invitation.inviteUrl} />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {open ? (
        <Drawer
          open
          onClose={() => setOpen(false)}
          title="Convidar cuidador"
          subtitle="O link expira sozinho. Você escolhe a função e, se quiser, trava num e-mail."
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" form="invite-form" variant="primary" loading={submitting} disabled={!tenantId}>
                Gerar link de convite
              </Button>
            </>
          }
        >
          <form id="invite-form" className="grid gap-3.5" onSubmit={handleSubmit}>
            <Select
              label="Localidade"
              data-autofocus=""
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
              placeholder="Selecione a localidade"
              required
            />
            <Input
              label="E-mail do cuidador"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="opcional — trava o convite a um e-mail"
            />
            <Select
              label="Função (permissão)"
              value={role}
              onChange={(event) => setRole(event.target.value as "caregiver" | "coordinator")}
              options={[
                { value: "caregiver", label: "Cuidador (acesso restrito)" },
                { value: "coordinator", label: "Coordenador (acesso total)" },
              ]}
            />
            <Select
              label="Validade do link"
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(event.target.value)}
              options={[
                { value: "3", label: "3 dias" },
                { value: "7", label: "7 dias" },
                { value: "14", label: "14 dias" },
              ]}
            />
            {error ? (
              <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-[13px] text-danger">
                {error}
              </p>
            ) : null}
          </form>
        </Drawer>
      ) : null}
    </>
  );
}
