"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaregiverInvitation, Tenant } from "@/server/domain/mvp";
import { sortInvitationsByCreatedAt } from "@/ui/mvp/caregiver-invitation-utils";
import {
  Card,
  Button,
  Select,
  Input,
  SectionTitle,
  StatusPill,
} from "@/ui/v2-components/ui";
import {
  IconMapPin,
  IconCheck,
  IconPlus,
  IconSend,
  IconPhone,
  IconX,
} from "@/ui/v2-components/icons";

const defaultExpiresInDays = 7;

// ── tiny copy-to-clipboard icon button ──────────────────────────
function CopyBtn({ link, label = "Copiar link" }: { link: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* noop */
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 999,
        background: copied ? "#F0FDF4" : "var(--surface-2)",
        border: `1px solid ${copied ? "#BBF7D0" : "var(--border)"}`,
        color: copied ? "#15803D" : "var(--text)",
        fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        fontFamily: "inherit", transition: "all .15s",
      }}
    >
      {copied ? <IconCheck size={13} /> : <IconSend size={13} />}
      {copied ? "Copiado!" : label}
    </button>
  );
}

// ── invitation status pill ───────────────────────────────────────
const INVITE_STATUS: Record<
  CaregiverInvitation["status"],
  { label: string; fg: string; bg: string }
> = {
  pending: { label: "Pendente", fg: "#C2410C", bg: "#FFEDD5" },
  accepted: { label: "Aceito", fg: "#15803D", bg: "#DCFCE7" },
  expired: { label: "Expirado", fg: "#71717A", bg: "#F4F4F5" },
  revoked: { label: "Revogado", fg: "#E11D48", bg: "#FFE4E6" },
};

export function CaregiverInvitationManager({
  tenants,
  invitations,
}: Readonly<{
  tenants: Tenant[];
  invitations: CaregiverInvitation[];
}>) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(String(defaultExpiresInDays));
  const [role, setRole] = useState<"caregiver" | "coordinator">("caregiver");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestLink, setLatestLink] = useState<string | null>(null);

  const sortedInvitations = useMemo(
    () => sortInvitationsByCreatedAt(invitations),
    [invitations]
  );

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
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr" }}>
      {/* ── Form panel ── */}
      <Card padding={28}>
        <SectionTitle>Convidar cuidador</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, marginTop: -8 }}>
          Gere um link por localidade para que cada cuidador finalize o próprio cadastro.
        </p>

        <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
          <Select
            label="Localidade"
            value={tenantId}
            onChange={setTenantId}
            options={tenants.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Selecione a localidade"
            required
          />

          <Input
            label="E-mail do cuidador"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="opcional — trava o convite a um e-mail"
            icon={<IconPhone />}
          />

          <Select
            label="Função (Permissão)"
            value={role}
            onChange={(v) => setRole(v as "caregiver" | "coordinator")}
            options={[
              { value: "caregiver", label: "Cuidador (Acesso restrito)" },
              { value: "coordinator", label: "Coordenador (Acesso total)" },
            ]}
          />

          <Select
            label="Validade do link"
            value={expiresInDays}
            onChange={setExpiresInDays}
            options={[
              { value: "3", label: "3 dias" },
              { value: "7", label: "7 dias" },
              { value: "14", label: "14 dias" },
            ]}
          />

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 12,
              background: "#FFF1F2", border: "1px solid #FECDD3",
              fontSize: 13, color: "#E11D48",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <IconX size={14} /> {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting || !tenantId}
            icon={<IconPlus />}
          >
            {submitting ? "Gerando..." : "Gerar link de convite"}
          </Button>
        </form>

        {/* Latest generated link */}
        {latestLink && (
          <div style={{
            marginTop: 20,
            padding: "16px 18px",
            borderRadius: 14,
            background: "var(--accent-bg)",
            border: "1px solid rgba(45,127,249,0.2)",
          }}>
            <div style={{
              fontSize: 11.5, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase",
              color: "var(--accent)", marginBottom: 8,
            }}>
              Último link gerado
            </div>
            <p style={{
              fontSize: 12.5, color: "var(--text)",
              wordBreak: "break-all", lineHeight: 1.5, marginBottom: 12,
            }}>
              {latestLink}
            </p>
            <CopyBtn link={latestLink} />
          </div>
        )}
      </Card>

      {/* ── List panel ── */}
      <Card padding={28}>
        <SectionTitle>Convites recentes</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, marginTop: -8 }}>
          Acompanhe os convites pendentes e os cuidadores já integrados.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sortedInvitations.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
              Nenhum convite criado ainda.
            </p>
          )}
          {sortedInvitations.map((inv) => {
            const tenant = tenants.find((t) => t.id === inv.tenantId);
            const st = INVITE_STATUS[inv.status] ?? INVITE_STATUS.pending;
            return (
              <div
                key={inv.id}
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 6 }}>
                      {tenant?.name ?? "Localidade"}
                      <span style={{
                        background: inv.role === "coordinator" ? "#F5F3FF" : "#F0F9FF",
                        color: inv.role === "coordinator" ? "#7C3AED" : "#0369A1",
                        fontSize: 9.5, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
                        border: `1px solid ${inv.role === "coordinator" ? "#DDD6FE" : "#BAE6FD"}`
                      }}>
                        {inv.role === "coordinator" ? "Coordenador" : "Cuidador"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                      {inv.email ?? "Convite aberto (sem e-mail fixo)"}
                    </div>
                  </div>
                  <span style={{
                    padding: "4px 10px", borderRadius: 999,
                    background: st.bg, color: st.fg,
                    fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap",
                  }}>
                    {st.label}
                  </span>
                </div>

                <div style={{
                  marginTop: 10,
                  fontSize: 12, color: "var(--text-3)",
                  display: "flex", gap: 16, flexWrap: "wrap",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <IconMapPin size={12} color="var(--accent)" />
                    Expira {new Date(inv.expiresAt).toLocaleDateString("pt-BR")}
                  </span>
                  {inv.acceptedAt && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <IconCheck size={12} color="#16A34A" />
                      Aceito em {new Date(inv.acceptedAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <CopyBtn link={inv.inviteUrl} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
