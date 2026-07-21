"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Seed, Tenant } from "@/server/domain/mvp";
import { Avatar, Button, Card, SectionTitle } from "@/ui/v2-components/ui";

const statusLabels: Record<Seed["status"], string> = {
  new: "Novo",
  contacted: "Contatado",
  waiting_visit: "Esperando Visita",
  in_progress: "Virou membro",
  consolidated: "Consolidado",
  inactive: "Inativo",
};

const statusColors: Record<Seed["status"], { bg: string; fg: string }> = {
  new: { bg: "#FFEDD5", fg: "#C2410C" },
  contacted: { bg: "#DBEAFE", fg: "#1D4ED8" },
  waiting_visit: { bg: "#ECFEFF", fg: "#0891B2" },
  in_progress: { bg: "#F3E8FF", fg: "#7C3AED" },
  consolidated: { bg: "#DCFCE7", fg: "#15803D" },
  inactive: { bg: "#F4F4F5", fg: "#71717A" },
};

export function ContactList({
  contacts,
  tenants,
}: Readonly<{
  contacts: Seed[];
  tenants: Tenant[];
}>) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function convertContact(contact: Seed) {
    setConvertingId(contact.id);
    setError(null);

    const response = await fetch(`/api/seeds/${contact.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caregiverId: null,
        address: contact.address || undefined,
        notes: contact.notes,
        latitude: contact.latitude,
        longitude: contact.longitude,
      }),
    });

    setConvertingId(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel converter o contato.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function deleteContact(contact: Seed) {
    const confirmed = window.confirm(`Excluir o contato "${contact.referenceName}"? Esta acao nao pode ser desfeita.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(contact.id);
    setError(null);
    const response = await fetch(`/api/seeds/${contact.id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel excluir o contato.");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <Card padding={20}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <SectionTitle>Todos os contatos</SectionTitle>
        <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500 }}>
          {contacts.length} {contacts.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {error ? (
        <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#FFF1F2", border: "1px solid #FECDD3", color: "#E11D48", fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {contacts.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "20px 0", margin: 0 }}>
            Nenhum contato encontrado para os filtros aplicados.
          </p>
        ) : null}

        {contacts.map((contact) => {
          const tenant = tenants.find((item) => item.id === contact.tenantId);
          const color = statusColors[contact.status];

          return (
            <div
              key={contact.id}
              style={{
                padding: "16px",
                borderRadius: 16,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Avatar name={contact.referenceName} size={42} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{contact.referenceName}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                        {contact.city || "Sem cidade"} · {tenant?.name ?? "Sem localidade"}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: color.bg,
                        color: color.fg,
                        fontSize: 11.5,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusLabels[contact.status]}
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, color: "var(--text-3)", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {contact.phone ? <span>{contact.phone}</span> : null}
                    {contact.caregiver ? <span>Cuidador: {contact.caregiver}</span> : null}
                    {contact.firstContactAt ? <span>Data: {new Date(contact.firstContactAt).toLocaleDateString("pt-BR")}</span> : null}
                  </div>

                  {contact.notes ? (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                      {contact.notes}
                    </p>
                  ) : null}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Link
                      href={`/coord/contatos/${contact.id}/editar`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 36,
                        padding: "0 14px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--text)",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Editar
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => convertContact(contact)}
                      disabled={convertingId === contact.id}
                    >
                      {convertingId === contact.id ? "Convertendo..." : "Converter em membro"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => deleteContact(contact)}
                      disabled={deletingId === contact.id}
                    >
                      {deletingId === contact.id ? "Excluindo..." : "Excluir"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
