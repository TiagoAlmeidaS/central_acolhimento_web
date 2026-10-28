"use client";

import { useState } from "react";
import type { Caregiver, Seed } from "@/server/domain/mvp";
import { Avatar, Pill, cx } from "@/ui/atalaia";
import {
  daysSince,
  firstName,
  formatRelativeDays,
  seedLastActivityAt,
  SEED_STATUS_LABEL,
  STALE_DAYS,
  type SeedStatus,
} from "@/ui/coord/seed-utils";

function placeLabel(seed: Seed) {
  return seed.neighborhood || seed.city || "";
}

export function SeedCard({
  seed,
  caregiver,
  needsSomeone,
  onOpen,
  draggable = true,
}: {
  seed: Seed;
  caregiver: Caregiver | undefined;
  needsSomeone: boolean;
  onOpen: (id: string) => void;
  draggable?: boolean;
}) {
  const since = daysSince(seedLastActivityAt(seed));
  const late = since > STALE_DAYS && (seed.status === "new" || seed.status === "contacted" || seed.status === "waiting_visit");
  const details = [seed.age !== null ? `${seed.age} anos` : null, placeLabel(seed) || null, seed.openHouse ? "casa aberta" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", seed.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onOpen(seed.id)}
      aria-label={`${seed.referenceName}, ${SEED_STATUS_LABEL[seed.status]}${seed.isUrgent ? ", urgente" : ""}${caregiver ? "" : ", sem cuidador"}`}
      className={cx(
        "grid w-full cursor-pointer gap-1.5 rounded-card border bg-raised p-2.5 text-left transition-colors duration-150 hover:border-border-strong hover:bg-sunken",
        needsSomeone ? "border-danger/40" : "border-border",
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <b className="min-w-0 break-words font-semibold">{seed.referenceName}</b>
        {seed.isUrgent ? <Pill tone="danger">Urgente</Pill> : null}
      </span>
      {details ? <small className="text-xs text-muted">{details}</small> : null}
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <Avatar name={caregiver?.name} size="sm" />
        <span className={cx("truncate", !caregiver && "text-subtle")}>
          {caregiver ? firstName(caregiver.name) : "Sem cuidador"}
        </span>
        <span className={cx("ml-auto shrink-0 font-mono text-[11px]", late && "text-danger")} title="Último movimento">
          {late ? "parado " : ""}
          {formatRelativeDays(since)}
        </span>
      </span>
    </button>
  );
}

function emptyColumnText(status: SeedStatus) {
  if (status === "new") return "Ninguém novo. Use “Novo contato” no topo ou cadastre pela recepção.";
  if (status === "in_progress") return "Arraste um card para cá para converter em membro.";
  return "Arraste um card para cá ou use o botão de avançar dentro do contato.";
}

export function ContactBoard({
  columns,
  seeds,
  caregiversById,
  needIds,
  onOpen,
  onMove,
}: {
  columns: SeedStatus[];
  seeds: Seed[];
  caregiversById: Map<string, Caregiver>;
  needIds: Set<string>;
  onOpen: (id: string) => void;
  onMove: (id: string, to: SeedStatus) => void;
}) {
  const [dropTarget, setDropTarget] = useState<SeedStatus | null>(null);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 min-[900px]:mx-0 min-[900px]:px-0">
      <div className="grid min-w-max auto-cols-[248px] grid-flow-col gap-3 min-[1100px]:min-w-0 min-[1100px]:auto-cols-fr">
        {columns.map((status) => {
          const items = seeds
            .filter((seed) => seed.status === status)
            .sort(
              (a, b) =>
                Number(b.isUrgent ?? false) - Number(a.isUrgent ?? false) ||
                (seedLastActivityAt(a) ?? "").localeCompare(seedLastActivityAt(b) ?? ""),
            );
          return (
            <section
              key={status}
              aria-label={SEED_STATUS_LABEL[status]}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dropTarget !== status) setDropTarget(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDropTarget(null);
                const id = event.dataTransfer.getData("text/plain");
                if (id) onMove(id, status);
              }}
              className={cx(
                "flex min-h-40 min-w-0 flex-col rounded-card border bg-sunken",
                dropTarget === status ? "border-primary" : "border-border",
              )}
            >
              <div className="flex items-center justify-between px-3 pb-1.5 pt-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                {SEED_STATUS_LABEL[status]}
                <span className="tabular-nums text-fg">{items.length}</span>
              </div>
              <div className="grid content-start gap-2 p-2">
                {items.length > 0 ? (
                  items.map((seed) => (
                    <SeedCard
                      key={seed.id}
                      seed={seed}
                      caregiver={seed.caregiverId ? caregiversById.get(seed.caregiverId) : undefined}
                      needsSomeone={needIds.has(seed.id)}
                      onOpen={onOpen}
                    />
                  ))
                ) : (
                  <p className="rounded-control border border-dashed border-border-strong px-3 py-4 text-xs text-subtle">
                    {emptyColumnText(status)}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
