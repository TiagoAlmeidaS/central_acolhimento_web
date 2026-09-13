import { SEED_ORIGIN_CHANNELS, seedOriginChannelLabel } from "@/lib/seed-origin";
import type { Seed, SeedOriginChannel } from "@/server/domain/mvp";

/** Chave usada para o grupo de quem cadastrou quando a coluna nova esta nula. */
export const ACQUISITION_UNKNOWN_REGISTRAR_KEY = "__sem_autoria__";
/** Rotulo honesto para o backlog historico sem `registered_by_tenant_user_id`. */
export const ACQUISITION_UNKNOWN_REGISTRAR_LABEL = "Sem autoria registrada";

export type AcquisitionChannelBucket = {
  channel: SeedOriginChannel;
  label: string;
  count: number;
  /** Percentual inteiro sobre o total do recorte. 0 quando nao ha entradas. */
  percent: number;
};

export type AcquisitionRegistrarBucket = {
  key: string;
  tenantUserId: string | null;
  count: number;
  percent: number;
};

export type AcquisitionSummary = {
  /** Pessoas novas no recorte recebido. */
  total: number;
  /** Um item por canal com pelo menos uma entrada, do maior volume para o menor. */
  channels: AcquisitionChannelBucket[];
  /** Canal com mais entradas no recorte; null quando o recorte esta vazio. */
  topChannel: AcquisitionChannelBucket | null;
  /** Fila de reclassificacao: contatos gravados como `other`. */
  withoutOriginChannel: number;
  firstContactCount: number;
  /** Percentual inteiro de `first_contact_at` preenchido; null quando nao ha base. */
  firstContactRate: number | null;
  withoutCaregiver: number;
  /** Um item por autor, do maior volume para o menor; nulos viram um grupo proprio. */
  registrars: AcquisitionRegistrarBucket[];
};

function percentOf(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function channelOrder(channel: SeedOriginChannel) {
  const index = SEED_ORIGIN_CHANNELS.indexOf(channel);
  return index === -1 ? SEED_ORIGIN_CHANNELS.length : index;
}

/** Canal efetivo do contato: ausente cai em `other`, a mesma regra da API. */
function resolveChannel(seed: Seed): SeedOriginChannel {
  return seed.originChannel ?? "other";
}

/**
 * Resume a aquisicao a partir dos contatos JA no recorte (periodo, estado,
 * cidade, localidade). A funcao nao filtra nada: quem chama decide o recorte.
 */
export function summarizeAcquisition(seeds: Seed[]): AcquisitionSummary {
  const total = seeds.length;

  const countsByChannel = new Map<SeedOriginChannel, number>();
  const countsByRegistrar = new Map<string, { tenantUserId: string | null; count: number }>();
  let firstContactCount = 0;
  let withoutCaregiver = 0;

  for (const seed of seeds) {
    const channel = resolveChannel(seed);
    countsByChannel.set(channel, (countsByChannel.get(channel) ?? 0) + 1);

    const tenantUserId = seed.registeredByTenantUserId ?? null;
    const key = tenantUserId ?? ACQUISITION_UNKNOWN_REGISTRAR_KEY;
    const bucket = countsByRegistrar.get(key) ?? { tenantUserId, count: 0 };
    bucket.count += 1;
    countsByRegistrar.set(key, bucket);

    if (seed.firstContactAt) firstContactCount += 1;
    if (!seed.caregiverId) withoutCaregiver += 1;
  }

  const channels = Array.from(countsByChannel.entries())
    .map(([channel, count]) => ({
      channel,
      label: seedOriginChannelLabel(channel),
      count,
      percent: percentOf(count, total),
    }))
    .sort((a, b) => b.count - a.count || channelOrder(a.channel) - channelOrder(b.channel));

  const registrars = Array.from(countsByRegistrar.entries())
    .map(([key, bucket]) => ({
      key,
      tenantUserId: bucket.tenantUserId,
      count: bucket.count,
      percent: percentOf(bucket.count, total),
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));

  return {
    total,
    channels,
    topChannel: channels[0] ?? null,
    withoutOriginChannel: countsByChannel.get("other") ?? 0,
    firstContactCount,
    firstContactRate: total > 0 ? percentOf(firstContactCount, total) : null,
    withoutCaregiver,
    registrars,
  };
}
