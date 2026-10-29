"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaregiverSignupChannel, CaregiverSignupChannelUse, Tenant } from "@/server/domain/mvp";
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
  useToast,
} from "@/ui/atalaia";
import { Check } from "@/ui/coord/check";
import { CopyButton } from "@/ui/coord/copy-button";
import { Meter } from "@/ui/coord/meter";

const USE_STATUS = {
  approved: { label: "Aprovado", tone: "success" },
  submitted: { label: "Pendente", tone: "warning" },
  rejected: { label: "Rejeitado", tone: "muted" },
} as const;

/** Canais de cadastro por QRCode: criar num drawer, acompanhar usos e aprovar cadastros. */
export function CaregiverSignupChannelManager({
  tenants,
  channels,
  uses,
}: Readonly<{
  tenants: Tenant[];
  channels: CaregiverSignupChannel[];
  uses: CaregiverSignupChannelUse[];
}>) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [name, setName] = useState("QRCode global de cuidadores");
  const [requireApproval, setRequireApproval] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [allowedEmailDomain, setAllowedEmailDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyChannelId, setBusyChannelId] = useState<string | null>(null);
  const [busyUseId, setBusyUseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestLink, setLatestLink] = useState<string | null>(null);

  const usesByChannel = useMemo(() => {
    const map = new Map<string, CaregiverSignupChannelUse[]>();
    for (const use of uses) {
      const current = map.get(use.channelId) ?? [];
      current.push(use);
      map.set(use.channelId, current);
    }
    return map;
  }, [uses]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/signup-channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        name,
        requireApproval,
        expiresInDays: Number(expiresInDays) > 0 ? Number(expiresInDays) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        allowedEmailDomain: allowedEmailDomain || null,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Não foi possível criar o canal global.");
      setSubmitting(false);
      return;
    }

    const payload = (await response.json()) as CaregiverSignupChannel;
    setLatestLink(payload.signupUrl);
    setName("QRCode global de cuidadores");
    setRequireApproval(true);
    setExpiresInDays("0");
    setMaxUses("");
    setAllowedEmailDomain("");
    setSubmitting(false);
    setOpen(false);
    toast("Canal criado. Copie o link ou mostre o QRCode.");
    startTransition(() => router.refresh());
  }

  async function toggleChannel(channelId: string) {
    setBusyChannelId(channelId);
    const response = await fetch(`/api/signup-channels/${channelId}/toggle`, { method: "POST" });
    setBusyChannelId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast(payload.error ?? "Não foi possível alterar o canal global.", { tone: "error" });
      return;
    }

    startTransition(() => router.refresh());
  }

  async function approveUse(channelId: string, useId: string) {
    setBusyUseId(useId);
    const response = await fetch(`/api/signup-channels/${channelId}/uses/${useId}/approve`, { method: "POST" });
    setBusyUseId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast(payload.error ?? "Não foi possível aprovar o cadastro.", { tone: "error" });
      return;
    }

    toast("Cadastro aprovado.");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <Card aria-labelledby="channels-heading">
        <CardHeader
          id="channels-heading"
          title="Canais de cadastro"
          action={
            <Button variant="primary" size="sm" icon="plus" onClick={() => setOpen(true)} disabled={tenants.length === 0}>
              Novo canal
            </Button>
          }
        />
        <CardBody className="grid gap-3">
          <p className="text-[13px] text-muted">
            Links reutilizáveis para a equipe se cadastrar sozinha. Quem entrar aparece em Equipe, e você escolhe se cada
            cadastro precisa de aprovação.
          </p>

          {latestLink ? (
            <div className="grid gap-2 rounded-card border border-primary bg-primary-soft px-3.5 py-3">
              <Eyebrow className="text-primary">Último canal gerado</Eyebrow>
              <p className="break-all font-mono text-xs">{latestLink}</p>
              <div className="flex flex-wrap items-center gap-3">
                <CopyButton link={latestLink} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=144x144&data=${encodeURIComponent(latestLink)}`}
                  alt="QRCode do canal"
                  width={144}
                  height={144}
                  className="size-36 rounded-control border border-border bg-white p-1"
                />
              </div>
            </div>
          ) : null}

          {channels.length === 0 ? (
            <EmptyState
              title="Nenhum canal criado ainda."
              reason="Crie um link e mande no grupo da equipe. Cada pessoa se cadastra sozinha, e você aprova."
              hint="Use “Novo canal” no topo deste cartão."
            />
          ) : (
            <ul className="grid gap-3">
              {channels.map((channel) => {
                const channelUses = usesByChannel.get(channel.id) ?? [];
                const pendingCount = channelUses.filter((item) => item.status === "submitted").length;
                const expired = channel.expiresAt ? new Date(channel.expiresAt) < new Date() : false;
                const full = channel.maxUses !== null && channel.usesCount >= channel.maxUses;
                return (
                  <li key={channel.id} className="grid gap-3 rounded-card border border-border bg-raised p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{channel.name}</h3>
                        <p className="text-xs text-muted">
                          {channel.tenantName ?? "Localidade"} · {channel.requireApproval ? "Com aprovação" : "Liberação imediata"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!channel.active ? (
                          <Pill tone="muted">Desativado</Pill>
                        ) : expired ? (
                          <Pill tone="danger">Expirado</Pill>
                        ) : full ? (
                          <Pill tone="danger">Esgotado</Pill>
                        ) : (
                          <Pill tone="success">Aceitando cadastros</Pill>
                        )}
                        <Button size="sm" loading={busyChannelId === channel.id} onClick={() => toggleChannel(channel.id)}>
                          {channel.active ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </div>

                    <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
                      <dt className="text-xs text-muted">Usos</dt>
                      <dd>
                        <span className="font-mono">
                          {channel.usesCount}
                          {channel.maxUses !== null ? ` de ${channel.maxUses}` : ""}
                        </span>
                        {channel.maxUses !== null ? (
                          <Meter value={channel.usesCount} max={channel.maxUses} className="mt-1.5 max-w-56" />
                        ) : (
                          <span className="text-muted"> · sem limite</span>
                        )}
                      </dd>
                      <dt className="text-xs text-muted">Pendentes</dt>
                      <dd className="font-mono">{pendingCount}</dd>
                      <dt className="text-xs text-muted">Validade</dt>
                      <dd>{channel.expiresAt ? new Date(channel.expiresAt).toLocaleDateString("pt-BR") : "Sem validade"}</dd>
                    </dl>

                    <div className="flex flex-wrap items-center gap-3">
                      <CopyButton link={channel.signupUrl} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(channel.signupUrl)}`}
                        alt={`QRCode de ${channel.name}`}
                        width={96}
                        height={96}
                        className="size-24 rounded-control border border-border bg-white p-1"
                      />
                    </div>

                    {channelUses.length > 0 ? (
                      <ul className="grid gap-2">
                        {channelUses.slice(0, 4).map((use) => {
                          const status = USE_STATUS[use.status] ?? USE_STATUS.rejected;
                          return (
                            <li
                              key={use.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 py-2"
                            >
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold">
                                  {use.firstName} {use.lastName}
                                </div>
                                <div className="truncate text-xs text-muted">
                                  {use.email} · {use.phone}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Pill tone={status.tone}>{status.label}</Pill>
                                {use.status === "submitted" && channel.requireApproval ? (
                                  <Button
                                    size="sm"
                                    icon="check"
                                    loading={busyUseId === use.id}
                                    onClick={() => approveUse(channel.id, use.id)}
                                  >
                                    Aprovar
                                  </Button>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {open ? (
        <Drawer
          open
          onClose={() => setOpen(false)}
          title="Novo canal de cadastro"
          subtitle="Um link permanente para a equipe entrar sozinha."
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" form="channel-form" variant="primary" loading={submitting} disabled={!tenantId}>
                Criar canal
              </Button>
            </>
          }
        >
          <form id="channel-form" className="grid gap-3.5" onSubmit={handleCreate}>
            <Select
              label="Localidade"
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
              placeholder="Selecione a localidade"
              required
            />
            <Input
              label="Nome do canal *"
              data-autofocus=""
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Equipe de recepção"
              required
            />
            <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
              <Select
                label="Expiração"
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                options={[
                  { value: "0", label: "Sem expiração" },
                  { value: "7", label: "7 dias" },
                  { value: "30", label: "30 dias" },
                ]}
              />
              <Input
                label="Limite de usos"
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Sem limite"
                inputMode="numeric"
              />
            </div>
            <Input
              label="Só e-mails do domínio"
              value={allowedEmailDomain}
              onChange={(event) => setAllowedEmailDomain(event.target.value)}
              placeholder="Ex.: igreja.org"
              hint="Deixe vazio para aceitar qualquer e-mail."
            />
            <Check
              label="Aprovar cada cadastro"
              hint="A coordenação aprova antes do primeiro login."
              checked={requireApproval}
              onChange={(event) => setRequireApproval(event.target.checked)}
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
