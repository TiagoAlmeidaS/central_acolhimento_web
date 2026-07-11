"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaregiverSignupChannel, CaregiverSignupChannelUse, Tenant } from "@/server/domain/mvp";
import { Button, Card, Input, SectionTitle, Select } from "@/ui/v2-components/ui";
import { IconCheck, IconMapPin, IconPlus, IconSend, IconShield, IconX } from "@/ui/v2-components/icons";

function CopyBtn({ link, label = "Copiar link" }: { link: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // noop
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 999,
        background: copied ? "#F0FDF4" : "var(--surface-2)",
        border: `1px solid ${copied ? "#BBF7D0" : "var(--border)"}`,
        color: copied ? "#15803D" : "var(--text)",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {copied ? <IconCheck size={13} /> : <IconSend size={13} />}
      {copied ? "Copiado!" : label}
    </button>
  );
}

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
      setError(payload.error ?? "Nao foi possivel criar o canal global.");
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
    startTransition(() => router.refresh());
  }

  async function toggleChannel(channelId: string) {
    setBusyChannelId(channelId);
    setError(null);
    const response = await fetch(`/api/signup-channels/${channelId}/toggle`, { method: "POST" });
    setBusyChannelId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel alterar o canal global.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function approveUse(channelId: string, useId: string) {
    setBusyUseId(useId);
    setError(null);
    const response = await fetch(`/api/signup-channels/${channelId}/uses/${useId}/approve`, { method: "POST" });
    setBusyUseId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel aprovar o cadastro.");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }}>
      <Card padding={28}>
        <SectionTitle>QRCode global de cadastro</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, marginTop: -8 }}>
          Gere um link permanente por localidade para que varios cuidadores se cadastrem pelo mesmo QRCode.
        </p>

        <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleCreate}>
          <Select
            label="Localidade"
            value={tenantId}
            onChange={setTenantId}
            options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
            placeholder="Selecione a localidade"
            required
          />

          <Input
            label="Nome do canal"
            value={name}
            onChange={setName}
            placeholder="Ex: QRCode da reuniao de equipe"
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select
              label="Expiracao"
              value={expiresInDays}
              onChange={setExpiresInDays}
              options={[
                { value: "0", label: "Sem expiracao" },
                { value: "7", label: "7 dias" },
                { value: "30", label: "30 dias" },
              ]}
            />

            <Input
              label="Limite de usos"
              value={maxUses}
              onChange={(value) => setMaxUses(value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Opcional"
              inputMode="numeric"
            />
          </div>

          <Input
            label="Dominio de e-mail permitido"
            value={allowedEmailDomain}
            onChange={setAllowedEmailDomain}
            placeholder="Opcional - ex: igreja.org"
          />

          <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(event) => setRequireApproval(event.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              Exigir aprovacao da coordenacao antes do primeiro login
            </span>
          </label>

          {error ? (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "#FFF1F2",
                border: "1px solid #FECDD3",
                fontSize: 13,
                color: "#E11D48",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <IconX size={14} /> {error}
            </div>
          ) : null}

          <Button type="submit" variant="primary" size="md" disabled={submitting || !tenantId} icon={<IconPlus />}>
            {submitting ? "Gerando..." : "Criar canal global"}
          </Button>
        </form>

        {latestLink ? (
          <div
            style={{
              marginTop: 20,
              padding: "16px 18px",
              borderRadius: 14,
              background: "var(--accent-bg)",
              border: "1px solid rgba(45,127,249,0.2)",
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 8,
              }}
            >
              Ultimo canal gerado
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text)", wordBreak: "break-all", lineHeight: 1.5 }}>{latestLink}</p>
            <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <CopyBtn link={latestLink} />
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=144x144&data=${encodeURIComponent(latestLink)}`}
                alt="QRCode do canal global"
                style={{ width: 144, height: 144, borderRadius: 12, border: "1px solid var(--border)", background: "#fff" }}
              />
            </div>
          </div>
        ) : null}
      </Card>

      <Card padding={28}>
        <SectionTitle>Canais globais ativos</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, marginTop: -8 }}>
          Acompanhe os links reutilizaveis, os cadastros enviados e as aprovacoes pendentes.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {channels.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
              Nenhum canal global criado ainda.
            </p>
          ) : null}

          {channels.map((channel) => {
            const channelUses = usesByChannel.get(channel.id) ?? [];
            const pendingCount = channelUses.filter((item) => item.status === "submitted").length;
            return (
              <div
                key={channel.id}
                style={{
                  padding: "16px 18px",
                  borderRadius: 14,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{channel.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4 }}>
                      {channel.tenantName ?? "Localidade"} · {channel.requireApproval ? "Com aprovacao" : "Liberacao imediata"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    disabled={busyChannelId === channel.id}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "1px solid var(--border)",
                      background: channel.active ? "#F0FDF4" : "#FFF1F2",
                      color: channel.active ? "#15803D" : "#E11D48",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: busyChannelId === channel.id ? "wait" : "pointer",
                    }}
                  >
                    {busyChannelId === channel.id ? "Atualizando..." : channel.active ? "Ativo" : "Inativo"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--text-3)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <IconMapPin size={12} color="var(--accent)" />
                    {channel.usesCount} cadastro(s)
                  </span>
                  <span>{pendingCount} pendente(s)</span>
                  <span>{channel.expiresAt ? `Expira ${new Date(channel.expiresAt).toLocaleDateString("pt-BR")}` : "Sem expiracao"}</span>
                  <span>{channel.maxUses !== null ? `Limite ${channel.maxUses}` : "Sem limite"}</span>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <CopyBtn link={channel.signupUrl} />
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(channel.signupUrl)}`}
                    alt={`QRCode de ${channel.name}`}
                    style={{ width: 96, height: 96, borderRadius: 12, border: "1px solid var(--border)", background: "#fff" }}
                  />
                </div>

                {channelUses.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {channelUses.slice(0, 4).map((use) => (
                      <div
                        key={use.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid var(--border)",
                          background: "var(--surface)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>
                            {use.firstName} {use.lastName}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                            {use.email} · {use.phone}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: use.status === "approved" ? "#DCFCE7" : use.status === "submitted" ? "#FFEDD5" : "#F4F4F5",
                              color: use.status === "approved" ? "#15803D" : use.status === "submitted" ? "#C2410C" : "#71717A",
                              fontSize: 11.5,
                              fontWeight: 700,
                            }}
                          >
                            {use.status === "approved" ? "Aprovado" : use.status === "submitted" ? "Pendente" : "Rejeitado"}
                          </span>
                          {use.status === "submitted" && channel.requireApproval ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => approveUse(channel.id, use.id)}
                              disabled={busyUseId === use.id}
                              icon={<IconShield />}
                            >
                              {busyUseId === use.id ? "Aprovando..." : "Aprovar"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
