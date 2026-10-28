"use client";

import { useState } from "react";
import type { Caregiver, Seed, Tenant } from "@/server/domain/mvp";
import { Avatar, Button, Card, Pill, StatusPill, Table, Td, Th, Tr, cx } from "@/ui/atalaia";
import {
  daysSince,
  firstName,
  formatDate,
  formatRelativeDays,
  seedLastActivityAt,
  seedStartedAt,
  SEED_STATUS_LABEL,
  STALE_DAYS,
} from "@/ui/coord/seed-utils";

const PAGE = 30;

/** Visao em lista dos contatos: uma linha por pessoa, abre o contato no drawer. */
export function ContactList({
  contacts,
  tenants = [],
  caregivers = [],
  onOpen,
}: Readonly<{
  contacts: Seed[];
  tenants?: Tenant[];
  caregivers?: Caregiver[];
  onOpen: (id: string) => void;
}>) {
  const [visible, setVisible] = useState(PAGE);
  const caregiversById = new Map(caregivers.map((caregiver) => [caregiver.id, caregiver]));
  const tenantsById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const showTenant = tenants.length > 1;
  const rows = contacts.slice(0, visible);

  return (
    <Card>
      <Table caption="Contatos">
        <thead>
          <tr>
            <Th>Nome</Th>
            <Th>Situação</Th>
            <Th>Bairro</Th>
            {showTenant ? <Th>Localidade</Th> : null}
            <Th>Origem</Th>
            <Th>Cuidador</Th>
            <Th>Primeiro contato</Th>
            <Th>Último movimento</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((seed) => {
            const caregiver = seed.caregiverId ? caregiversById.get(seed.caregiverId) : undefined;
            const since = daysSince(seedLastActivityAt(seed));
            const late = since > STALE_DAYS && (seed.status === "new" || seed.status === "contacted" || seed.status === "waiting_visit");
            return (
              <Tr key={seed.id} onActivate={() => onOpen(seed.id)} aria-label={`Abrir ${seed.referenceName}`}>
                <Td>
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {seed.referenceName}
                    {seed.isUrgent ? <Pill tone="danger">Urgente</Pill> : null}
                  </span>
                  {seed.phone ? <span className="block font-mono text-[11px] text-muted">{seed.phone}</span> : null}
                </Td>
                <Td>
                  <StatusPill status={seed.status} label={SEED_STATUS_LABEL[seed.status]} />
                </Td>
                <Td>{seed.neighborhood || seed.city || <span className="text-subtle">—</span>}</Td>
                {showTenant ? <Td>{tenantsById.get(seed.tenantId)?.name ?? "—"}</Td> : null}
                <Td>{seed.source || <span className="text-subtle">—</span>}</Td>
                <Td>
                  {caregiver ? (
                    <span className="flex items-center gap-1.5">
                      <Avatar name={caregiver.name} size="sm" />
                      {firstName(caregiver.name)}
                    </span>
                  ) : (
                    <span className="text-subtle">Sem cuidador</span>
                  )}
                </Td>
                <Td className="font-mono text-xs">{formatDate(seedStartedAt(seed))}</Td>
                <Td className={cx("font-mono text-xs", late && "text-danger")}>
                  {late ? "parado " : ""}
                  {formatRelativeDays(since)}
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
      {contacts.length > visible ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-[13px] text-muted">
          <span>
            Mostrando {rows.length} de {contacts.length}
          </span>
          <Button size="sm" onClick={() => setVisible((current) => current + PAGE)}>
            Mostrar mais
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
