"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Seed } from "@/server/domain/mvp";
import { Button, Card, CardHeader, EmptyState, Select, cx, useToast } from "@/ui/atalaia";
import {
  CAREGIVER_CAPACITY,
  firstName,
  loadLabel,
  plural,
  updateSeedRequest,
  type NeedItem,
} from "@/ui/coord/seed-utils";

export type NeedsCaregiver = { id: string; name: string; tenantId: string; load: number };

type Props = {
  items: NeedItem[];
  /** Contatos que aparecem nos itens (necessarios para atribuir cuidador no lugar). */
  seeds: Seed[];
  caregivers: NeedsCaregiver[];
  /** Quantos itens mostrar antes do link "Ver todos". */
  limit?: number;
  /** Destino de "Ver todos" quando ha mais itens que o limite. */
  moreHref?: string;
};

const SEV_CLASS: Record<NeedItem["sev"], string> = {
  3: "bg-danger",
  2: "bg-warning",
  1: "bg-subtle",
};

const SEV_LABEL: Record<NeedItem["sev"], string> = {
  3: "Urgente",
  2: "Importante",
  1: "Acompanhar",
};

function AssignInline({ item, seed, caregivers }: { item: NeedItem; seed: Seed; caregivers: NeedsCaregiver[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const options = caregivers
    .filter((caregiver) => caregiver.tenantId === item.tenantId)
    .sort((a, b) => a.load - b.load || a.name.localeCompare(b.name, "pt-BR"));

  async function assign() {
    const caregiver = options.find((option) => option.id === choice);
    if (!caregiver) return;
    setBusy(true);
    const result = await updateSeedRequest(seed, { caregiverId: caregiver.id });
    setBusy(false);
    if (!result.ok) {
      toast(result.error, { tone: "error" });
      return;
    }
    toast(`${firstName(seed.referenceName)} agora é de ${firstName(caregiver.name)}.`);
    setChoice("");
    startTransition(() => router.refresh());
  }

  if (options.length === 0) {
    return (
      <Button size="sm" href="/coord/cuidadores">
        Convidar cuidador
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select
        aria-label={`Cuidador para ${item.name}`}
        value={choice}
        onChange={(event) => setChoice(event.target.value)}
        wrapperClassName="w-44 max-[560px]:w-32"
        className="!min-h-7 !py-0 text-[13px]"
      >
        <option value="">Escolher cuidador</option>
        {options.map((caregiver) => (
          <option key={caregiver.id} value={caregiver.id} disabled={caregiver.load >= CAREGIVER_CAPACITY}>
            {loadLabel(caregiver, caregiver.load)}
          </option>
        ))}
      </Select>
      <Button size="sm" variant="primary" disabled={!choice} loading={busy} onClick={assign}>
        Atribuir
      </Button>
    </div>
  );
}

/** "Precisa de alguem": o que destrava num clique vem primeiro, com a acao no proprio lugar. */
export function NeedsCard({ items, seeds, caregivers, limit = 7, moreHref = "/coord/contatos?filtro=precisa" }: Props) {
  const seedsById = new Map(seeds.map((seed) => [seed.id, seed]));
  const visible = items.slice(0, limit);

  return (
    <Card aria-labelledby="needs-heading">
      <CardHeader
        id="needs-heading"
        title="Precisa de alguém"
        meta={
          <span role="status">
            {items.length > 0 ? `${plural(items.length, "pessoa espera", "pessoas esperam")} uma ação` : "Ninguém esperando"}
          </span>
        }
      />
      {visible.length > 0 ? (
        <ul className="pb-1 pt-2">
          {visible.map((item) => {
            const seed = item.kind === "seed" ? seedsById.get(item.id) : undefined;
            return (
              <li
                key={item.key}
                className="grid grid-cols-[8px_1fr_auto] items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0 max-[700px]:grid-cols-[8px_1fr]"
              >
                <span aria-hidden="true" className={cx("size-2 rounded-full", SEV_CLASS[item.sev])} />
                <div className="min-w-0">
                  <b className="block truncate font-semibold">{item.name}</b>
                  <small className="text-xs text-muted">
                    <span className="sr-only">{SEV_LABEL[item.sev]}. </span>
                    {item.reason} · {item.kind === "seed" ? "contato" : "assistido"}
                  </small>
                </div>
                <div className="max-[700px]:col-start-2">
                  {item.action === "assign" && seed ? (
                    <AssignInline item={item} seed={seed} caregivers={caregivers} />
                  ) : (
                    <Button size="sm" href={item.href}>
                      {item.actionLabel}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="px-4 pb-4 pt-3">
          <EmptyState
            title="Tudo em dia."
            reason="Ninguém urgente, sem cuidador ou com ação atrasada. Bom momento para planejar a próxima saída."
            hint={'Quando alguém precisar de atenção, aparece aqui com o botão para resolver.'}
            action={
              <Button href="/coord/saidas" size="sm">
                Ver saídas
              </Button>
            }
          />
        </div>
      )}
      {items.length > limit ? (
        <div className="border-t border-border px-4 py-2.5 text-[13px]">
          <Link className="text-primary underline underline-offset-2" href={moreHref}>
            Ver as {items.length} no quadro
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
