import {
  classifyDailyOutingAge,
  DAILY_OUTING_REPORT_TIMEZONE,
  DAILY_OUTING_REPORT_VERSION,
  isIsoInHalfOpenRange,
  saoPauloDayUtcRange,
} from "@/server/domain/daily-outing-report";
import type { DailyOutingReport, OutingDetail, Seed, Tenant } from "@/server/domain/mvp";
import { listSeeds } from "@/server/repositories/mvp-repository";
import { getOutingDetail, listOutings } from "@/server/repositories/outing-repository";

type ReportSource = {
  tenant: Tenant;
  date: string;
  outingDetails: OutingDetail[];
  seeds: Seed[];
  generatedAt?: string;
};

export function buildDailyOutingReport(source: ReportSource): DailyOutingReport {
  const { start, end } = saoPauloDayUtcRange(source.date);
  const completedDetails = source.outingDetails.filter(({ outing }) =>
    isIsoInHalfOpenRange(outing.completedAt, start, end),
  );
  const completedIds = new Set(completedDetails.map(({ outing }) => outing.id));
  const seeds = source.seeds.filter((seed) =>
    Boolean(seed.outingEventId && completedIds.has(seed.outingEventId)) &&
    isIsoInHalfOpenRange(seed.createdAt, start, end),
  );
  const detailsById = new Map(completedDetails.map((detail) => [detail.outing.id, detail]));

  const contacts: DailyOutingReport["contacts"] = seeds.map((seed) => {
    const detail = detailsById.get(seed.outingEventId!);
    return {
      id: seed.id,
      name: seed.referenceName,
      age: seed.age,
      ageGroup: classifyDailyOutingAge(seed.age),
      outingId: detail!.outing.id,
      outingName: detail!.outing.name,
      outingTypeName: detail!.outing.outingTypeName ?? "Nao classificada",
      openHouse: seed.openHouse,
      address: seed.address,
      city: seed.city,
      latitude: seed.latitude,
      longitude: seed.longitude,
    };
  }).sort((a, b) => a.outingTypeName.localeCompare(b.outingTypeName) || a.outingName.localeCompare(b.outingName) || a.name.localeCompare(b.name));

  const outings: DailyOutingReport["outings"] = completedDetails.map((detail) => ({
    id: detail.outing.id,
    name: detail.outing.name,
    typeName: detail.outing.outingTypeName ?? "Nao classificada",
    completedAt: detail.outing.completedAt!,
    participationCount: new Set(detail.participants.map((participant) => participant.id)).size,
    newContactCount: contacts.filter((contact) => contact.outingId === detail.outing.id).length,
  })).sort((a, b) => a.typeName.localeCompare(b.typeName) || a.name.localeCompare(b.name));

  const typeBuckets = new Map<string, DailyOutingReport["byType"][number]>();
  for (const detail of completedDetails) {
    const key = detail.outing.outingTypeId ?? "unclassified";
    const bucket = typeBuckets.get(key) ?? {
      outingTypeId: detail.outing.outingTypeId,
      name: detail.outing.outingTypeName ?? "Nao classificada",
      outings: 0,
      participations: 0,
      newContacts: 0,
      adolescents: 0,
      openHouses: 0,
    };
    const relatedContacts = contacts.filter((contact) => contact.outingId === detail.outing.id);
    bucket.outings += 1;
    bucket.participations += new Set(detail.participants.map((participant) => participant.id)).size;
    bucket.newContacts += relatedContacts.length;
    bucket.adolescents += relatedContacts.filter((contact) => contact.ageGroup === "adolescent").length;
    bucket.openHouses += relatedContacts.filter((contact) => contact.openHouse).length;
    typeBuckets.set(key, bucket);
  }

  return {
    version: DAILY_OUTING_REPORT_VERSION,
    generatedAt: source.generatedAt ?? new Date().toISOString(),
    timezone: DAILY_OUTING_REPORT_TIMEZONE,
    date: source.date,
    tenant: { id: source.tenant.id, name: source.tenant.name, city: source.tenant.city, state: source.tenant.state },
    totals: {
      completedOutings: outings.length,
      participations: outings.reduce((sum, outing) => sum + outing.participationCount, 0),
      newContacts: contacts.length,
      adolescents: contacts.filter((contact) => contact.ageGroup === "adolescent").length,
      otherKnownAges: contacts.filter((contact) => contact.ageGroup === "other_known").length,
      unknownAges: contacts.filter((contact) => contact.ageGroup === "unknown").length,
      openHouses: contacts.filter((contact) => contact.openHouse).length,
      openHousesWithoutCoordinates: contacts.filter((contact) => contact.openHouse && (contact.latitude === null || contact.longitude === null)).length,
    },
    byType: Array.from(typeBuckets.values()).sort((a, b) => a.name.localeCompare(b.name)),
    outings,
    contacts,
  };
}

export async function getDailyOutingReport(tenant: Tenant, date: string): Promise<DailyOutingReport> {
  const scope = { tenantId: tenant.id };
  const [outings, seeds] = await Promise.all([listOutings(scope), listSeeds(scope)]);
  const completedOutings = outings.filter((outing) => outing.completedAt);
  const outingDetails = await Promise.all(completedOutings.map((outing) => getOutingDetail(outing.id, scope)));
  return buildDailyOutingReport({ tenant, date, outingDetails, seeds });
}
