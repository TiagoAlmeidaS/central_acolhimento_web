"use client";

import { useState } from "react";
import type { Caregiver, Seed, Tenant } from "@/server/domain/mvp";
import { Button, Drawer, Pill, Select, StatusPill } from "@/ui/atalaia";
import { Check } from "@/ui/coord/check";
import {
  BOARD_STATUSES,
  CAREGIVER_CAPACITY,
  daysSince,
  formatDate,
  formatRelativeDays,
  seedLastActivityAt,
  seedStartedAt,
  SEED_STATUS_LABEL,
  type SeedStatus,
} from "@/ui/coord/seed-utils";

export type ContactDrawerHandlers = {
  onClose: () => void;
  onEdit: (seed: Seed) => void;
  onAssign: (seed: Seed, caregiverId: string | null) => Promise<void>;
  onUrgent: (seed: Seed, value: boolean) => Promise<void>;
  onMove: (seed: Seed, to: SeedStatus) => Promise<void>;
  onDelete: (seed: Seed) => Promise<void>;
};

type Props = ContactDrawerHandlers & {
  seed: Seed | null;
  tenants: Tenant[];
  caregivers: Caregiver[];
  /** Quantos assistidos ativos cada cuidador tem (para o rotulo do seletor). */
  loadByCaregiver: Map<string, number>;
};

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

/** Leitura do contato com as acoes de um clique: atribuir, marcar urgente, avancar na jornada. */
export function ContactDrawer({ seed, tenants, caregivers, loadByCaregiver, ...handlers }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  }

  if (!seed) {
    return (
      <Drawer open={false} onClose={handlers.onClose} title="Contato">
        {null}
      </Drawer>
    );
  }

  const tenant = tenants.find((item) => item.id === seed.tenantId);
  const options = caregivers.filter(
    (caregiver) => caregiver.tenantId === seed.tenantId && (caregiver.active || caregiver.id === seed.caregiverId),
  );
  const index = BOARD_STATUSES.indexOf(seed.status);
  const next: SeedStatus | null = seed.status === "in_progress" ? "consolidated" : index >= 0 && index < BOARD_STATUSES.length - 1 ? BOARD_STATUSES[index + 1] : null;
  const nextIsConvert = next === "in_progress";
  const canConvertEarly = (seed.status === "new" || seed.status === "contacted") && !nextIsConvert;
  const since = daysSince(seedLastActivityAt(seed));
  const addressLine = [seed.street, seed.addressNumber].filter(Boolean).join(", ");
  const place = [seed.neighborhood, seed.city && `${seed.city}${seed.state ? `/${seed.state}` : ""}`].filter(Boolean).join(" · ");

  return (
    <Drawer
      open
      onClose={handlers.onClose}
      title={seed.referenceName}
      subtitle={
        <span className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={seed.status} label={SEED_STATUS_LABEL[seed.status]} />
          {seed.isUrgent ? <Pill tone="danger">Urgente</Pill> : null}
        </span>
      }
      footerStart={
        <span className="flex items-center gap-1">
          {seed.status === "inactive" ? (
            <Button variant="ghost" loading={busy === "reactivate"} onClick={() => run("reactivate", () => handlers.onMove(seed, "contacted"))}>
              Reativar
            </Button>
          ) : (
            <Button variant="ghost" loading={busy === "inactive"} onClick={() => run("inactive", () => handlers.onMove(seed, "inactive"))}>
              Marcar inativo
            </Button>
          )}
          <Button variant="danger" loading={busy === "delete"} onClick={() => run("delete", () => handlers.onDelete(seed))}>
            Excluir
          </Button>
        </span>
      }
      footer={
        <>
          <Button onClick={() => handlers.onEdit(seed)}>Editar</Button>
          {next ? (
            <Button
              variant="primary"
              loading={busy === "next"}
              onClick={() => run("next", () => handlers.onMove(seed, next))}
            >
              {nextIsConvert ? "Converter em membro" : `Avançar para ${SEED_STATUS_LABEL[next].toLowerCase()}`}
            </Button>
          ) : null}
        </>
      }
    >
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-sm">
        <KV label="Idade">{seed.age !== null ? `${seed.age} anos` : <span className="text-subtle">não informada</span>}</KV>
        <KV label="Telefone">
          {seed.phone ? (
            <a className="font-mono text-primary underline underline-offset-2" href={`tel:${seed.phone}`}>
              {seed.phone}
            </a>
          ) : (
            <span className="text-subtle">sem telefone</span>
          )}
        </KV>
        <KV label="Endereço">
          {addressLine || place ? (
            <>
              {addressLine ? <>{addressLine}<br /></> : null}
              <span className="text-muted">{place}</span>
              {seed.postalCode ? <span className="text-muted"> · CEP <span className="font-mono">{seed.postalCode}</span></span> : null}
            </>
          ) : (
            <span className="text-subtle">sem endereço</span>
          )}
        </KV>
        {seed.latitude !== null && seed.longitude !== null ? (
          <KV label="Coordenadas">
            <span className="font-mono text-xs text-muted">
              {seed.latitude.toFixed(4)}, {seed.longitude.toFixed(4)}
            </span>
          </KV>
        ) : null}
        <KV label="Localidade">{tenant ? tenant.name : "—"}</KV>
        <KV label="Origem">{seed.source || <span className="text-subtle">não informada</span>}</KV>
        <KV label="Casa aberta">{seed.openHouse ? "Sim, recebe vizinhos para visitas" : "Não"}</KV>
        <KV label="Primeiro contato">{formatDate(seedStartedAt(seed))}</KV>
        <KV label="Último movimento">
          {formatDate(seedLastActivityAt(seed))} <span className="text-muted">· {since <= 0 ? "hoje" : `há ${formatRelativeDays(since)}`}</span>
        </KV>
      </dl>

      {seed.houseFrontImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={seed.houseFrontImageUrl}
          alt={`Frente da casa de ${seed.referenceName}`}
          className="max-h-[200px] w-full rounded-control border border-border object-cover"
        />
      ) : null}

      <Select
        label="Cuidador"
        value={seed.caregiverId ?? ""}
        disabled={busy === "assign"}
        data-autofocus={seed.caregiverId ? undefined : ""}
        onChange={(event) => {
          const value = event.target.value || null;
          void run("assign", () => handlers.onAssign(seed, value));
        }}
        hint={seed.caregiverId ? undefined : "Sem cuidador: escolha alguém para o contato sair de “Precisa de alguém”."}
      >
        <option value="">Sem cuidador</option>
        {options.map((caregiver) => {
          const load = loadByCaregiver.get(caregiver.id) ?? 0;
          return (
            <option key={caregiver.id} value={caregiver.id}>
              {caregiver.name} · {load}/{CAREGIVER_CAPACITY} assistidos{caregiver.active ? "" : " (inativo)"}
            </option>
          );
        })}
      </Select>

      <Check
        label="Caso urgente"
        hint="Alguém precisa falar com essa pessoa hoje."
        checked={seed.isUrgent ?? false}
        disabled={busy === "urgent"}
        onChange={(event) => {
          const value = event.target.checked;
          void run("urgent", () => handlers.onUrgent(seed, value));
        }}
      />

      {canConvertEarly ? (
        <div>
          <Button loading={busy === "convert"} onClick={() => run("convert", () => handlers.onMove(seed, "in_progress"))}>
            Converter em membro agora
          </Button>
        </div>
      ) : null}

      <div className="grid gap-1">
        <span className="text-xs font-semibold text-muted">Observações</span>
        {seed.notes ? <p className="whitespace-pre-line">{seed.notes}</p> : <p className="text-subtle">Sem observações.</p>}
      </div>
    </Drawer>
  );
}
