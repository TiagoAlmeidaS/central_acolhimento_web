import { getDbPool, isDatabaseConfigured } from "@/lib/db";
import {
  caregivers as caregiverMocks,
  latestActivity as followupMocks,
  members as memberMocks,
  tenants as tenantMocks,
} from "@/server/mock-data";
import type {
  Caregiver,
  ConvertSeedToMemberInput,
  CreateCaregiverInput,
  CreateFollowupInput,
  CreateMemberInput,
  CreateSeedInput,
  CreateTenantInput,
  DashboardCard,
  Followup,
  Member,
  Seed,
  Tenant,
  DataScope,
  UpdateCaregiverInput,
  UpdateFollowupInput,
  UpdateMemberInput,
  UpdateSeedInput,
  UpdateTenantInput,
} from "@/server/domain/mvp";

type TenantRow = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: "active" | "inactive";
  coordinator_name: string | null;
  created_at: string;
};

type CaregiverRow = {
  id: string;
  tenant_id: string;
  tenant_user_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  active: boolean;
  notes: string;
  created_at: string;
};

type SeedRow = {
  id: string;
  tenant_id: string;
  caregiver_id: string | null;
  reference_name: string;
  phone: string;
  city: string;
  postal_code: string;
  open_house: boolean;
  address: string;
  street: string;
  neighborhood: string;
  address_number: string;
  state: string;
  house_front_image_url: string | null;
  source: string;
  status: Seed["status"];
  notes: string;
  first_contact_at: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  is_urgent: boolean;
};

type MemberRow = {
  id: string;
  tenant_id: string;
  caregiver_id: string | null;
  seed_id: string | null;
  name: string;
  phone: string;
  address: string;
  city: string;
  birth_date: string | null;
  status: Member["status"];
  notes: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  is_urgent: boolean;
};

type FollowupRow = {
  id: string;
  tenant_id: string;
  member_id: string;
  caregiver_id: string | null;
  type: Followup["type"];
  occurred_at: string;
  notes: string;
  next_action_at: string | null;
  created_at: string;
};

function serializeDateValue(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    status: row.status,
    coordinator: row.coordinator_name,
    createdAt: serializeDateValue(row.created_at) ?? undefined,
  };
}

function mapCaregiver(row: CaregiverRow): Caregiver {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantUserId: row.tenant_user_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    active: row.active,
    notes: row.notes,
    createdAt: serializeDateValue(row.created_at) ?? undefined,
  };
}

function mapSeed(row: SeedRow): Seed {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    caregiverId: row.caregiver_id,
    referenceName: row.reference_name,
    phone: row.phone,
    city: row.city,
    postalCode: row.postal_code,
    openHouse: row.open_house,
    address: row.address,
    street: row.street,
    neighborhood: row.neighborhood,
    addressNumber: row.address_number,
    state: row.state,
    houseFrontImageUrl: row.house_front_image_url,
    source: row.source,
    status: row.status,
    notes: row.notes,
    firstContactAt: serializeDateValue(row.first_contact_at),
    createdAt: serializeDateValue(row.created_at) ?? undefined,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    isUrgent: !!row.is_urgent,
  };
}

function mapMember(row: MemberRow): Member {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    caregiverId: row.caregiver_id,
    seedId: row.seed_id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    city: row.city,
    birthDate: serializeDateValue(row.birth_date),
    status: row.status,
    notes: row.notes,
    createdAt: serializeDateValue(row.created_at) ?? undefined,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    isUrgent: !!row.is_urgent,
  };
}

function mapFollowup(row: FollowupRow): Followup {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    memberId: row.member_id,
    caregiverId: row.caregiver_id,
    type: row.type,
    occurredAt: serializeDateValue(row.occurred_at) ?? new Date(0).toISOString(),
    notes: row.notes,
    nextActionAt: serializeDateValue(row.next_action_at),
    createdAt: serializeDateValue(row.created_at) ?? undefined,
  };
}

function buildLocalTenants(): Tenant[] {
  return tenantMocks.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    city: tenant.city,
    state: tenant.state,
    status: tenant.status === "Ativa" ? "active" : "inactive",
    coordinator: tenant.coordinator,
  }));
}

function normalizeCityKey(value: string) {
  return value.toLowerCase();
}

function buildLocalCaregivers(): Caregiver[] {
  return caregiverMocks.map((caregiver) => ({
    id: caregiver.id,
    tenantId:
      normalizeCityKey(caregiver.city).includes("sap")
        ? "1"
        : normalizeCityKey(caregiver.city).includes("mari")
          ? "2"
          : "3",
    tenantUserId: null,
    name: caregiver.name,
    phone: caregiver.phone,
    email: caregiver.email,
    active: caregiver.active,
    notes: "",
    city: caregiver.city,
    activeMembers: caregiver.activeMembers,
  }));
}

function buildLocalSeeds(): Seed[] {
  return [
    {
      id: "local-seed-1",
      tenantId: "1",
      caregiverId: "1",
      referenceName: "Pedro Lima",
      phone: "(83) 98888-4444",
      city: "Sape",
      postalCode: "",
      openHouse: false,
      address: "",
      street: "",
      neighborhood: "",
      addressNumber: "",
      state: "",
      houseFrontImageUrl: null,
      source: "Contato no culto",
      status: "contacted",
      notes: "Primeiro acolhimento feito pelo cuidador.",
      firstContactAt: new Date().toISOString(),
      caregiver: "Maria Oliveira",
      latitude: null,
      longitude: null,
    },
    {
      id: "local-seed-2",
      tenantId: "2",
      caregiverId: "2",
      referenceName: "Raquel Costa",
      phone: "(83) 98888-5555",
      city: "Mari",
      postalCode: "",
      openHouse: false,
      address: "",
      street: "",
      neighborhood: "",
      addressNumber: "",
      state: "",
      houseFrontImageUrl: null,
      source: "Visita residencial",
      status: "new",
      notes: "Novo contato aguardando primeiro retorno.",
      firstContactAt: null,
      caregiver: "Joao Silva",
      latitude: null,
      longitude: null,
    },
  ];
}

function buildLocalMembers(): Member[] {
  return memberMocks.map((member) => ({
    id: member.id,
    tenantId:
      normalizeCityKey(member.city).includes("sap")
        ? "1"
        : normalizeCityKey(member.city).includes("mari")
          ? "2"
          : "3",
    caregiverId:
      normalizeCityKey(member.caregiver).includes("maria")
        ? "1"
        : normalizeCityKey(member.caregiver).includes("jo")
          ? "2"
          : null,
    seedId: null,
    name: member.name,
    phone: member.phone,
    address: "",
    city: member.city,
    birthDate: null,
    status:
      member.status === "Novo"
        ? "new"
        : member.status === "Consolidado"
          ? "consolidated"
          : "in_progress",
    notes: "",
    caregiver: member.caregiver,
    lastContact: member.lastContact,
    latitude: null,
    longitude: null,
  }));
}

function buildLocalFollowups(): Followup[] {
  return followupMocks.map((item, index) => ({
    id: `local-followup-${index + 1}`,
    tenantId: index % 2 === 0 ? "1" : "2",
    memberId: String(index + 1),
    caregiverId: index % 2 === 0 ? "1" : "2",
    type: "call",
    occurredAt: new Date().toISOString(),
    notes: item.note,
    nextActionAt: null,
    member: item.member,
    caregiver: index % 2 === 0 ? "Maria Oliveira" : "Joao Silva",
  }));
}

const localTenantsStore = buildLocalTenants();
const localCaregiversStore = buildLocalCaregivers();
const localSeedsStore = buildLocalSeeds();
const localMembersStore = buildLocalMembers();
const localFollowupsStore = buildLocalFollowups();

export function resetLocalMvpStore() {
  localTenantsStore.splice(0, localTenantsStore.length, ...buildLocalTenants());
  localCaregiversStore.splice(0, localCaregiversStore.length, ...buildLocalCaregivers());
  localSeedsStore.splice(0, localSeedsStore.length, ...buildLocalSeeds());
  localMembersStore.splice(0, localMembersStore.length, ...buildLocalMembers());
  localFollowupsStore.splice(0, localFollowupsStore.length, ...buildLocalFollowups());
}

function isDatabaseReady() {
  return isDatabaseConfigured() && getDbPool() !== null;
}

function ensureDb() {
  const db = getDbPool();

  if (!db) {
    throw new Error("Postgres da Vercel nao configurado.");
  }

  return db;
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

function localTenantCity(tenantId: string) {
  return localTenantsStore.find((tenant) => tenant.id === tenantId)?.city ?? "";
}

function localCaregiverName(caregiverId: string | null | undefined) {
  if (!caregiverId) return null;
  return localCaregiversStore.find((caregiver) => caregiver.id === caregiverId)?.name ?? null;
}

function composeContactAddress(input: {
  street?: string;
  addressNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}) {
  const streetLine = [input.street, input.addressNumber].filter(Boolean).join(", ");
  const neighborhood = input.neighborhood?.trim();
  const cityState = [input.city?.trim(), input.state?.trim()].filter(Boolean).join(" - ");
  const postalCode = input.postalCode?.trim();

  return [streetLine, neighborhood, cityState, postalCode ? `CEP ${postalCode}` : ""]
    .filter(Boolean)
    .join(" · ");
}

function matchesScope(
  item: { tenantId: string; caregiverId?: string | null },
  scope?: DataScope
) {
  if (scope?.tenantId && item.tenantId !== scope.tenantId) {
    return false;
  }

  if (scope?.caregiverId && item.caregiverId !== scope.caregiverId) {
    return false;
  }

  return true;
}

function appendScopedWhereClause(
  clauses: string[],
  values: Array<string | boolean>,
  scope?: DataScope,
  aliases?: { tenant?: string; caregiver?: string }
) {
  const tenantColumn = aliases?.tenant ?? "tenant_id";
  const caregiverColumn = aliases?.caregiver ?? "caregiver_id";

  if (scope?.tenantId) {
    values.push(scope.tenantId);
    clauses.push(`${tenantColumn} = $${values.length}`);
  }

  if (scope?.caregiverId) {
    values.push(scope.caregiverId);
    clauses.push(`${caregiverColumn} = $${values.length}`);
  }
}

export async function listTenants(scope?: DataScope): Promise<Tenant[]> {
  if (!isDatabaseReady()) {
    if (!scope?.tenantId) {
      return [...localTenantsStore].sort((a, b) => a.name.localeCompare(b.name));
    }
    return localTenantsStore
      .filter((tenant) => tenant.id === scope.tenantId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const db = ensureDb();
  const values: string[] = [];
  const where = scope?.tenantId ? "where id = $1" : "";
  if (scope?.tenantId) {
    values.push(scope.tenantId);
  }
  const result = await db.query<TenantRow>(`select * from tenants ${where} order by name`, values);
  return result.rows.map(mapTenant);
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  if (!isDatabaseReady()) {
    const tenant = {
      id: crypto.randomUUID(),
      name: input.name,
      city: input.city,
      state: input.state,
      status: input.status ?? "active",
      coordinator: input.coordinator ?? null,
    };
    localTenantsStore.unshift(tenant);
    return tenant;
  }

  const db = ensureDb();
  const result = await db.query<TenantRow>(
    `insert into tenants (name, city, state, status, coordinator_name)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [input.name, input.city, input.state, input.status ?? "active", input.coordinator ?? null]
  );
  return mapTenant(result.rows[0]);
}

export async function updateTenant(id: string, input: UpdateTenantInput): Promise<Tenant> {
  if (!isDatabaseReady()) {
    const tenant = {
      id,
      name: input.name,
      city: input.city,
      state: input.state,
      status: input.status ?? "active",
      coordinator: input.coordinator ?? null,
    };
    const index = localTenantsStore.findIndex((item) => item.id === id);
    if (index >= 0) localTenantsStore[index] = tenant;
    return tenant;
  }

  const db = ensureDb();
  const result = await db.query<TenantRow>(
    `update tenants
        set name = $2,
            city = $3,
            state = $4,
            status = $5,
            coordinator_name = $6
      where id = $1
      returning *`,
    [id, input.name, input.city, input.state, input.status ?? "active", input.coordinator ?? null]
  );
  return mapTenant(result.rows[0]);
}

export async function listCaregivers(scope?: DataScope): Promise<Caregiver[]> {
  if (!isDatabaseReady()) {
    return localCaregiversStore
      .filter((caregiver) => {
        if (scope?.tenantId && caregiver.tenantId !== scope.tenantId) {
          return false;
        }

        if (scope?.caregiverId && caregiver.id !== scope.caregiverId) {
          return false;
        }

        return true;
      })
      .map((caregiver) => ({
      ...caregiver,
      activeMembers: localMembersStore.filter((member) => member.caregiverId === caregiver.id).length,
      }));
  }

  const db = ensureDb();
  const values: string[] = [];
  const clauses: string[] = [];
  appendScopedWhereClause(clauses, values, scope, { caregiver: "id" });
  const where = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const [result, tenants, memberCounts] = await Promise.all([
    db.query<CaregiverRow>(`select * from caregivers ${where} order by name`, values),
    listTenants(scope?.tenantId ? { tenantId: scope.tenantId } : undefined),
    db.query<{ caregiver_id: string | null; total: string }>(
      `select caregiver_id, count(*)::text as total
       from members
       ${scope?.tenantId ? "where tenant_id = $1 and caregiver_id is not null" : "where caregiver_id is not null"}
       group by caregiver_id`
      ,
      scope?.tenantId ? [scope.tenantId] : []
    ),
  ]);
  const tenantMap = new Map(tenants.map((tenant) => [tenant.id, tenant.city]));
  const memberCountMap = new Map(
    memberCounts.rows
      .filter((row) => row.caregiver_id)
      .map((row) => [row.caregiver_id as string, Number(row.total)])
  );

  return result.rows.map((row) => {
    const caregiver = mapCaregiver(row);
    return {
      ...caregiver,
      city: tenantMap.get(caregiver.tenantId),
      activeMembers: memberCountMap.get(caregiver.id) ?? 0,
    };
  });
}

export async function createCaregiver(input: CreateCaregiverInput): Promise<Caregiver> {
  if (!isDatabaseReady()) {
    const caregiver = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      tenantUserId: input.tenantUserId ?? null,
      name: input.name,
      phone: input.phone ?? "",
      email: input.email ?? null,
      active: input.active ?? true,
      notes: input.notes ?? "",
      city: localTenantCity(input.tenantId),
      activeMembers: 0,
    };
    localCaregiversStore.unshift(caregiver);
    return caregiver;
  }

  const db = ensureDb();
  const result = await db.query<CaregiverRow>(
    `insert into caregivers (tenant_id, tenant_user_id, name, phone, email, active, notes)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [input.tenantId, input.tenantUserId ?? null, input.name, input.phone ?? "", input.email ?? null, input.active ?? true, input.notes ?? ""]
  );
  return mapCaregiver(result.rows[0]);
}

export async function updateCaregiver(id: string, input: UpdateCaregiverInput): Promise<Caregiver> {
  if (!isDatabaseReady()) {
    const caregiver = {
      id,
      tenantId: input.tenantId,
      tenantUserId: input.tenantUserId ?? null,
      name: input.name,
      phone: input.phone ?? "",
      email: input.email ?? null,
      active: input.active ?? true,
      notes: input.notes ?? "",
      city: localTenantCity(input.tenantId),
      activeMembers: localMembersStore.filter((member) => member.caregiverId === id).length,
    };
    const index = localCaregiversStore.findIndex((item) => item.id === id);
    if (index >= 0) localCaregiversStore[index] = caregiver;
    return caregiver;
  }

  const db = ensureDb();
  const result = await db.query<CaregiverRow>(
    `update caregivers
        set tenant_id = $2,
            tenant_user_id = $3,
            name = $4,
            phone = $5,
            email = $6,
            active = $7,
            notes = $8
      where id = $1
      returning *`,
    [id, input.tenantId, input.tenantUserId ?? null, input.name, input.phone ?? "", input.email ?? null, input.active ?? true, input.notes ?? ""]
  );
  return mapCaregiver(result.rows[0]);
}

export async function listSeeds(scope?: DataScope): Promise<Seed[]> {
  if (!isDatabaseReady()) {
    return localSeedsStore
      .filter((seed) => matchesScope(seed, scope))
      .map((seed) => ({
      ...seed,
      caregiver: localCaregiverName(seed.caregiverId),
      }));
  }

  const db = ensureDb();
  const values: string[] = [];
  const clauses: string[] = [];
  appendScopedWhereClause(clauses, values, scope);
  const where = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const [seedsResult, caregivers] = await Promise.all([
    db.query<SeedRow>(`select * from seeds ${where} order by created_at desc`, values),
    db.query<{ id: string; name: string }>(
      `select id, name from caregivers ${scope?.tenantId ? "where tenant_id = $1" : ""}`,
      scope?.tenantId ? [scope.tenantId] : []
    ),
  ]);
  const caregiverMap = new Map(caregivers.rows.map((caregiver) => [caregiver.id, caregiver.name]));

  return seedsResult.rows.map((row) => {
    const seed = mapSeed(row);
    return {
      ...seed,
      caregiver: seed.caregiverId ? caregiverMap.get(seed.caregiverId) ?? null : null,
    };
  });
}

export async function createSeed(input: CreateSeedInput): Promise<Seed> {
  if (!isDatabaseReady()) {
    const seed = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      caregiverId: input.caregiverId ?? null,
      referenceName: input.referenceName,
      phone: input.phone ?? "",
      city: input.city ?? "",
      postalCode: input.postalCode ?? "",
      openHouse: input.openHouse ?? false,
      address: input.address ?? composeContactAddress(input),
      street: input.street ?? "",
      neighborhood: input.neighborhood ?? "",
      addressNumber: input.addressNumber ?? "",
      state: input.state ?? "",
      houseFrontImageUrl: input.houseFrontImageUrl ?? null,
      source: input.source ?? "",
      status: input.status ?? "new",
      notes: input.notes ?? "",
      firstContactAt: input.firstContactAt ?? null,
      caregiver: localCaregiverName(input.caregiverId),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      isUrgent: input.isUrgent ?? false,
    };
    localSeedsStore.unshift(seed);
    return seed;
  }

  const db = ensureDb();
  const result = await db.query<SeedRow>(
    `insert into seeds (tenant_id, caregiver_id, reference_name, phone, city, postal_code, open_house, address, street, neighborhood, address_number, state, house_front_image_url, source, status, notes, first_contact_at, latitude, longitude, is_urgent)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     returning *`,
    [
      input.tenantId,
      input.caregiverId ?? null,
      input.referenceName,
      input.phone ?? "",
      input.city ?? "",
      input.postalCode ?? "",
      input.openHouse ?? false,
      input.address ?? composeContactAddress(input),
      input.street ?? "",
      input.neighborhood ?? "",
      input.addressNumber ?? "",
      input.state ?? "",
      input.houseFrontImageUrl ?? null,
      input.source ?? "",
      input.status ?? "new",
      input.notes ?? "",
      input.firstContactAt ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.isUrgent ?? false,
    ]
  );
  return mapSeed(result.rows[0]);
}

export async function updateSeed(id: string, input: UpdateSeedInput): Promise<Seed> {
  if (!isDatabaseReady()) {
    const seed = {
      id,
      tenantId: input.tenantId,
      caregiverId: input.caregiverId ?? null,
      referenceName: input.referenceName,
      phone: input.phone ?? "",
      city: input.city ?? "",
      postalCode: input.postalCode ?? "",
      openHouse: input.openHouse ?? false,
      address: input.address ?? composeContactAddress(input),
      street: input.street ?? "",
      neighborhood: input.neighborhood ?? "",
      addressNumber: input.addressNumber ?? "",
      state: input.state ?? "",
      houseFrontImageUrl: input.houseFrontImageUrl ?? null,
      source: input.source ?? "",
      status: input.status ?? "new",
      notes: input.notes ?? "",
      firstContactAt: input.firstContactAt ?? null,
      caregiver: localCaregiverName(input.caregiverId),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      isUrgent: input.isUrgent ?? false,
    };
    const index = localSeedsStore.findIndex((item) => item.id === id);
    if (index >= 0) localSeedsStore[index] = seed;
    return seed;
  }

  const db = ensureDb();
  const result = await db.query<SeedRow>(
    `update seeds
        set tenant_id = $2,
            caregiver_id = $3,
            reference_name = $4,
            phone = $5,
            city = $6,
            postal_code = $7,
            open_house = $8,
            address = $9,
            street = $10,
            neighborhood = $11,
            address_number = $12,
            state = $13,
            house_front_image_url = $14,
            source = $15,
            status = $16,
            notes = $17,
            first_contact_at = $18,
            latitude = $19,
            longitude = $20,
            is_urgent = $21
      where id = $1
      returning *`,
    [
      id,
      input.tenantId,
      input.caregiverId ?? null,
      input.referenceName,
      input.phone ?? "",
      input.city ?? "",
      input.postalCode ?? "",
      input.openHouse ?? false,
      input.address ?? composeContactAddress(input),
      input.street ?? "",
      input.neighborhood ?? "",
      input.addressNumber ?? "",
      input.state ?? "",
      input.houseFrontImageUrl ?? null,
      input.source ?? "",
      input.status ?? "new",
      input.notes ?? "",
      input.firstContactAt ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.isUrgent ?? false,
    ]
  );
  return mapSeed(result.rows[0]);
}

export async function convertSeedToMember(seedId: string, input: ConvertSeedToMemberInput = {}) {
  if (!isDatabaseReady()) {
    const seed = localSeedsStore.find((item) => item.id === seedId);
    if (!seed) {
      throw new Error("Novo contato nao encontrado.");
    }

    const member: Member = {
      id: crypto.randomUUID(),
      tenantId: seed.tenantId,
      caregiverId: input.caregiverId ?? seed.caregiverId ?? null,
      seedId: seed.id,
      name: seed.referenceName,
      phone: seed.phone,
      address: input.address ?? seed.address ?? "",
      city: seed.city,
      birthDate: input.birthDate ?? null,
      status: "new",
      notes: input.notes ?? seed.notes,
      caregiver: localCaregiverName(input.caregiverId ?? seed.caregiverId),
      lastContact: formatDateLabel(seed.firstContactAt),
      latitude: input.latitude ?? seed.latitude ?? null,
      longitude: input.longitude ?? seed.longitude ?? null,
      isUrgent: input.isUrgent ?? seed.isUrgent ?? false,
    };

    localMembersStore.unshift(member);
    const index = localSeedsStore.findIndex((item) => item.id === seedId);
    localSeedsStore[index] = { ...seed, status: "in_progress" };
    return member;
  }

  const db = ensureDb();
  const seedResult = await db.query<SeedRow>("select * from seeds where id = $1 limit 1", [seedId]);
  const row = seedResult.rows[0];
  if (!row) {
    throw new Error("Novo contato nao encontrado.");
  }

  const memberResult = await db.query<MemberRow>(
    `insert into members (tenant_id, caregiver_id, seed_id, name, phone, address, city, birth_date, status, notes, latitude, longitude, is_urgent)
     values ($1, $2, $3, $4, $5, $6, $7, $8, 'new', $9, $10, $11, $12)
     returning *`,
    [
      row.tenant_id,
      input.caregiverId ?? row.caregiver_id,
      row.id,
      row.reference_name,
      row.phone,
      input.address ?? row.address,
      row.city,
      input.birthDate ?? null,
      input.notes ?? row.notes,
      input.latitude ?? row.latitude ?? null,
      input.longitude ?? row.longitude ?? null,
      input.isUrgent ?? row.is_urgent ?? false,
    ]
  );

  await db.query(`update seeds set status = 'in_progress' where id = $1`, [seedId]);
  return mapMember(memberResult.rows[0]);
}

export async function listMembers(scope?: DataScope): Promise<Member[]> {
  if (!isDatabaseReady()) {
    const latestFollowupMap = new Map<string, Followup>();
    for (const followup of localFollowupsStore.filter((item) => matchesScope(item, scope))) {
      const current = latestFollowupMap.get(followup.memberId);
      if (!current || new Date(followup.occurredAt) > new Date(current.occurredAt)) {
        latestFollowupMap.set(followup.memberId, followup);
      }
    }

    return localMembersStore
      .filter((member) => matchesScope(member, scope))
      .map((member) => ({
      ...member,
      caregiver: localCaregiverName(member.caregiverId),
      lastContact: formatDateLabel(latestFollowupMap.get(member.id)?.occurredAt ?? member.lastContact ?? null),
      }));
  }

  const db = ensureDb();
  const values: string[] = [];
  const clauses: string[] = [];
  appendScopedWhereClause(clauses, values, scope);
  const where = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const [membersResult, caregivers, followups] = await Promise.all([
    db.query<MemberRow>(`select * from members ${where} order by created_at desc`, values),
    listCaregivers(scope),
    listFollowups(scope),
  ]);

  const caregiverMap = new Map(caregivers.map((caregiver) => [caregiver.id, caregiver]));
  const latestFollowupMap = new Map<string, Followup>();
  for (const followup of followups) {
    const current = latestFollowupMap.get(followup.memberId);
    if (!current || new Date(followup.occurredAt) > new Date(current.occurredAt)) {
      latestFollowupMap.set(followup.memberId, followup);
    }
  }

  return membersResult.rows.map((row) => {
    const member = mapMember(row);
    return {
      ...member,
      caregiver: member.caregiverId ? caregiverMap.get(member.caregiverId)?.name ?? null : null,
      lastContact: formatDateLabel(latestFollowupMap.get(member.id)?.occurredAt ?? null),
    };
  });
}

export async function createMember(input: CreateMemberInput): Promise<Member> {
  if (!isDatabaseReady()) {
    const member: Member = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      caregiverId: input.caregiverId ?? null,
      seedId: input.seedId ?? null,
      name: input.name,
      phone: input.phone ?? "",
      address: input.address ?? "",
      city: input.city ?? "",
      birthDate: input.birthDate ?? null,
      status: input.status ?? "new",
      notes: input.notes ?? "",
      caregiver: localCaregiverName(input.caregiverId),
      lastContact: null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      isUrgent: input.isUrgent ?? false,
    };
    localMembersStore.unshift(member);
    return member;
  }

  const db = ensureDb();
  const result = await db.query<MemberRow>(
    `insert into members (tenant_id, caregiver_id, seed_id, name, phone, address, city, birth_date, status, notes, latitude, longitude, is_urgent)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     returning *`,
    [
      input.tenantId,
      input.caregiverId ?? null,
      input.seedId ?? null,
      input.name,
      input.phone ?? "",
      input.address ?? "",
      input.city ?? "",
      input.birthDate ?? null,
      input.status ?? "new",
      input.notes ?? "",
      input.latitude ?? null,
      input.longitude ?? null,
      input.isUrgent ?? false,
    ]
  );
  return mapMember(result.rows[0]);
}

export async function updateMember(id: string, input: UpdateMemberInput): Promise<Member> {
  let oldStatus: string = "new";
  let oldCaregiverId: string | null = null;
  let oldIsUrgent: boolean = false;

  if (isDatabaseReady()) {
    const db = ensureDb();
    const currentMemberRes = await db.query<MemberRow>("select status, caregiver_id, is_urgent from members where id = $1 limit 1", [id]);
    const currentMember = currentMemberRes.rows[0];
    if (currentMember) {
      oldStatus = currentMember.status;
      oldCaregiverId = currentMember.caregiver_id;
      oldIsUrgent = !!currentMember.is_urgent;
    }
  } else {
    const currentMember = localMembersStore.find((m) => m.id === id);
    if (currentMember) {
      oldStatus = currentMember.status;
      oldCaregiverId = currentMember.caregiverId;
      oldIsUrgent = !!currentMember.isUrgent;
    }
  }

  const newStatus = input.status ?? "new";
  const newCaregiverId = input.caregiverId ?? null;
  const newIsUrgent = input.isUrgent ?? false;

  if (!isDatabaseReady()) {
    const member: Member = {
      id,
      tenantId: input.tenantId,
      caregiverId: input.caregiverId ?? null,
      seedId: input.seedId ?? null,
      name: input.name,
      phone: input.phone ?? "",
      address: input.address ?? "",
      city: input.city ?? "",
      birthDate: input.birthDate ?? null,
      status: input.status ?? "new",
      notes: input.notes ?? "",
      caregiver: localCaregiverName(input.caregiverId),
      lastContact: null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      isUrgent: input.isUrgent ?? false,
    };
    const index = localMembersStore.findIndex((item) => item.id === id);
    if (index >= 0) {
      localMembersStore[index] = { ...localMembersStore[index], ...member };
    }

    const auditLogs: string[] = [];
    if (newStatus !== oldStatus) {
      const statusLabelsMap: Record<string, string> = {
        new: "Novo",
        in_progress: "Em Acompanhamento",
        consolidated: "Consolidado",
        inactive: "Inativo",
      };
      auditLogs.push(`Status pastoral alterado de "${statusLabelsMap[oldStatus] ?? oldStatus}" para "${statusLabelsMap[newStatus] ?? newStatus}"`);
    }
    if (newCaregiverId !== oldCaregiverId) {
      auditLogs.push(`Cuidador responsável alterado de "${localCaregiverName(oldCaregiverId) ?? "Sem atribuição"}" para "${localCaregiverName(newCaregiverId) ?? "Sem atribuição"}"`);
    }
    if (newIsUrgent !== oldIsUrgent) {
      auditLogs.push(newIsUrgent ? "Assistido marcado como caso URGENTE" : "Marcação de urgência removida deste assistido");
    }

    for (const logText of auditLogs) {
      localFollowupsStore.push({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        memberId: id,
        caregiverId: input.caregiverId || null,
        type: "other",
        occurredAt: new Date().toISOString(),
        notes: logText,
        nextActionAt: null,
      });
    }
    return member;
  }

  const db = ensureDb();
  const result = await db.query<MemberRow>(
    `update members
        set tenant_id = $2,
            caregiver_id = $3,
            seed_id = $4,
            name = $5,
            phone = $6,
            address = $7,
            city = $8,
            birth_date = $9,
            status = $10,
            notes = $11,
            latitude = $12,
            longitude = $13,
            is_urgent = $14
      where id = $1
      returning *`,
    [
      id,
      input.tenantId,
      input.caregiverId ?? null,
      input.seedId ?? null,
      input.name,
      input.phone ?? "",
      input.address ?? "",
      input.city ?? "",
      input.birthDate ?? null,
      input.status ?? "new",
      input.notes ?? "",
      input.latitude ?? null,
      input.longitude ?? null,
      input.isUrgent ?? false,
    ]
  );

  const auditLogs: string[] = [];
  if (newStatus !== oldStatus) {
    const statusLabelsMap: Record<string, string> = {
      new: "Novo",
      in_progress: "Em Acompanhamento",
      consolidated: "Consolidado",
      inactive: "Inativo",
    };
    auditLogs.push(`Status pastoral alterado de "${statusLabelsMap[oldStatus] ?? oldStatus}" para "${statusLabelsMap[newStatus] ?? newStatus}"`);
  }
  if (newCaregiverId !== oldCaregiverId) {
    let oldName = "Sem atribuição";
    let newName = "Sem atribuição";
    if (oldCaregiverId) {
      const oldCG = await db.query("select name from caregivers where id = $1 limit 1", [oldCaregiverId]);
      if (oldCG.rows[0]) oldName = oldCG.rows[0].name;
    }
    if (newCaregiverId) {
      const newCG = await db.query("select name from caregivers where id = $1 limit 1", [newCaregiverId]);
      if (newCG.rows[0]) newName = newCG.rows[0].name;
    }
    auditLogs.push(`Cuidador responsável alterado de "${oldName}" para "${newName}"`);
  }
  if (newIsUrgent !== oldIsUrgent) {
    auditLogs.push(newIsUrgent ? "Assistido marcado como caso URGENTE" : "Marcação de urgência removida deste assistido");
  }

  for (const logText of auditLogs) {
    await db.query(
      `insert into followups (tenant_id, member_id, caregiver_id, type, occurred_at, notes)
       values ($1, $2, $3, 'other', now(), $4)`,
      [input.tenantId, id, input.caregiverId || null, logText]
    );
  }

  return mapMember(result.rows[0]);
}

export async function assignCaregiverToMember(memberId: string, caregiverId: string | null): Promise<Member> {
  let oldCaregiverId: string | null = null;
  let tenantId = "";
  if (isDatabaseReady()) {
    const db = ensureDb();
    const currentMemberRes = await db.query<MemberRow>("select tenant_id, caregiver_id from members where id = $1 limit 1", [memberId]);
    const currentMember = currentMemberRes.rows[0];
    if (currentMember) {
      oldCaregiverId = currentMember.caregiver_id;
      tenantId = currentMember.tenant_id;
    }
  } else {
    const currentMember = localMembersStore.find((m) => m.id === memberId);
    if (currentMember) {
      oldCaregiverId = currentMember.caregiverId;
      tenantId = currentMember.tenantId;
    }
  }

  let updatedMember: Member;
  if (!isDatabaseReady()) {
    const member = localMembersStore.find((item) => item.id === memberId);
    if (!member) {
      throw new Error("Membro nao encontrado.");
    }
    member.caregiverId = caregiverId;
    member.caregiver = localCaregiverName(caregiverId);
    updatedMember = member;
  } else {
    const db = ensureDb();
    const result = await db.query<MemberRow>(
      `update members set caregiver_id = $2 where id = $1 returning *`,
      [memberId, caregiverId]
    );
    updatedMember = mapMember(result.rows[0]);
  }

  if (caregiverId !== oldCaregiverId) {
    let oldName = "Sem atribuição";
    let newName = "Sem atribuição";
    if (isDatabaseReady()) {
      const db = ensureDb();
      if (oldCaregiverId) {
        const oldCG = await db.query("select name from caregivers where id = $1 limit 1", [oldCaregiverId]);
        if (oldCG.rows[0]) oldName = oldCG.rows[0].name;
      }
      if (caregiverId) {
        const newCG = await db.query("select name from caregivers where id = $1 limit 1", [caregiverId]);
        if (newCG.rows[0]) newName = newCG.rows[0].name;
      }
      await db.query(
        `insert into followups (tenant_id, member_id, caregiver_id, type, occurred_at, notes)
         values ($1, $2, $3, 'other', now(), $4)`,
        [tenantId, memberId, caregiverId, `Cuidador responsável alterado de "${oldName}" para "${newName}"`]
      );
    } else {
      if (oldCaregiverId) oldName = localCaregiverName(oldCaregiverId) ?? "Sem atribuição";
      if (caregiverId) newName = localCaregiverName(caregiverId) ?? "Sem atribuição";
      localFollowupsStore.push({
        id: crypto.randomUUID(),
        tenantId,
        memberId,
        caregiverId,
        type: "other",
        occurredAt: new Date().toISOString(),
        notes: `Cuidador responsável alterado de "${oldName}" para "${newName}"`,
        nextActionAt: null,
      });
    }
  }

  return updatedMember;
}

export async function listFollowups(scope?: DataScope): Promise<Followup[]> {
  if (!isDatabaseReady()) {
    return localFollowupsStore
      .filter((followup) => matchesScope(followup, scope))
      .map((followup) => ({
      ...followup,
      member: localMembersStore.find((member) => member.id === followup.memberId)?.name ?? followup.member ?? null,
      caregiver: localCaregiverName(followup.caregiverId),
      }));
  }

  const db = ensureDb();
  const values: string[] = [];
  const clauses: string[] = [];
  appendScopedWhereClause(clauses, values, scope);
  const where = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const [followupsResult, members, caregivers] = await Promise.all([
    db.query<FollowupRow>(`select * from followups ${where} order by occurred_at desc`, values),
    db.query<{ id: string; name: string }>(
      `select id, name from members ${scope?.tenantId ? "where tenant_id = $1" : ""}`,
      scope?.tenantId ? [scope.tenantId] : []
    ),
    db.query<{ id: string; name: string }>(
      `select id, name from caregivers ${scope?.tenantId ? "where tenant_id = $1" : ""}`,
      scope?.tenantId ? [scope.tenantId] : []
    ),
  ]);

  const memberMap = new Map(members.rows.map((member) => [member.id, member.name]));
  const caregiverMap = new Map(caregivers.rows.map((caregiver) => [caregiver.id, caregiver.name]));

  return followupsResult.rows.map((row) => {
    const followup = mapFollowup(row);
    return {
      ...followup,
      member: memberMap.get(followup.memberId) ?? null,
      caregiver: followup.caregiverId ? caregiverMap.get(followup.caregiverId) ?? null : null,
    };
  });
}

export async function createFollowup(input: CreateFollowupInput): Promise<Followup> {
  // Load member and check status
  let memberToUpdate: Member | undefined;
  if (!isDatabaseReady()) {
    memberToUpdate = localMembersStore.find((m) => m.id === input.memberId);
  } else {
    const db = ensureDb();
    const res = await db.query<MemberRow>("select * from members where id = $1 limit 1", [input.memberId]);
    if (res.rows[0]) memberToUpdate = mapMember(res.rows[0]);
  }

  if (memberToUpdate && memberToUpdate.status === "new") {
    // Transition status to in_progress!
    await updateMember(memberToUpdate.id, {
      tenantId: memberToUpdate.tenantId,
      caregiverId: memberToUpdate.caregiverId,
      seedId: memberToUpdate.seedId,
      name: memberToUpdate.name,
      phone: memberToUpdate.phone,
      address: memberToUpdate.address,
      city: memberToUpdate.city,
      birthDate: memberToUpdate.birthDate,
      status: "in_progress",
      notes: memberToUpdate.notes,
      latitude: memberToUpdate.latitude,
      longitude: memberToUpdate.longitude,
      isUrgent: memberToUpdate.isUrgent,
    });
  }

  if (!isDatabaseReady()) {
    const followup: Followup = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      memberId: input.memberId,
      caregiverId: input.caregiverId ?? null,
      type: input.type,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      notes: input.notes ?? "",
      nextActionAt: input.nextActionAt ?? null,
      member: localMembersStore.find((member) => member.id === input.memberId)?.name ?? null,
      caregiver: localCaregiverName(input.caregiverId),
    };
    localFollowupsStore.unshift(followup);
    return followup;
  }

  const db = ensureDb();
  const result = await db.query<FollowupRow>(
    `insert into followups (tenant_id, member_id, caregiver_id, type, occurred_at, notes, next_action_at)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [input.tenantId, input.memberId, input.caregiverId ?? null, input.type, input.occurredAt ?? new Date().toISOString(), input.notes ?? "", input.nextActionAt ?? null]
  );
  return mapFollowup(result.rows[0]);
}

export async function updateFollowup(id: string, input: UpdateFollowupInput): Promise<Followup> {
  if (!isDatabaseReady()) {
    const followup: Followup = {
      id,
      tenantId: input.tenantId,
      memberId: input.memberId,
      caregiverId: input.caregiverId ?? null,
      type: input.type,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      notes: input.notes ?? "",
      nextActionAt: input.nextActionAt ?? null,
      member: localMembersStore.find((member) => member.id === input.memberId)?.name ?? null,
      caregiver: localCaregiverName(input.caregiverId),
    };
    const index = localFollowupsStore.findIndex((item) => item.id === id);
    if (index >= 0) localFollowupsStore[index] = followup;
    return followup;
  }

  const db = ensureDb();
  const result = await db.query<FollowupRow>(
    `update followups
        set tenant_id = $2,
            member_id = $3,
            caregiver_id = $4,
            type = $5,
            occurred_at = $6,
            notes = $7,
            next_action_at = $8
      where id = $1
      returning *`,
    [id, input.tenantId, input.memberId, input.caregiverId ?? null, input.type, input.occurredAt ?? new Date().toISOString(), input.notes ?? "", input.nextActionAt ?? null]
  );
  return mapFollowup(result.rows[0]);
}

export async function getDashboardSummary(scope?: DataScope): Promise<DashboardCard[]> {
  if (!isDatabaseReady()) {
    const scopedSeeds = localSeedsStore.filter((seed) => matchesScope(seed, scope));
    const scopedMembers = localMembersStore.filter((member) => matchesScope(member, scope));
    const scopedCaregivers = localCaregiversStore.filter((caregiver) => matchesScope(caregiver, scope));
    const scopedFollowups = localFollowupsStore.filter((followup) => matchesScope(followup, scope));
    const openContacts = scopedSeeds.filter((seed) => seed.status === "new" || seed.status === "contacted").length;
    const activeMembers = scopedMembers.filter((member) => member.status === "in_progress").length;
    const activeCaregivers = scopedCaregivers.filter((caregiver) => caregiver.active).length;
    const futureActions = scopedFollowups.filter((followup) => {
      if (!followup.nextActionAt) return false;
      const parsed = new Date(followup.nextActionAt);
      return !Number.isNaN(parsed.getTime()) && parsed >= new Date();
    }).length;

    return [
      { label: "Membros cadastrados", value: String(scopedMembers.length), detail: "Base do tenant atual" },
      { label: "Membros ativos", value: String(activeMembers), detail: "Em acompanhamento" },
      { label: "Novos contatos", value: String(openContacts), detail: "Entrada do cuidado" },
      { label: "Cuidadores ativos", value: String(activeCaregivers), detail: "Prontos para acompanhar" },
      { label: "Acompanhamentos", value: String(scopedFollowups.length), detail: "Registros de cuidado" },
      { label: "Proximas acoes", value: String(futureActions), detail: "Pendencias futuras" },
    ];
  }

  const [members, caregivers, seeds, followups] = await Promise.all([
    listMembers(scope),
    listCaregivers(scope),
    listSeeds(scope),
    listFollowups(scope),
  ]);

  const activeMembers = members.filter((member) => member.status === "in_progress").length;
  const activeCaregivers = caregivers.filter((caregiver) => caregiver.active).length;
  const openContacts = seeds.filter((seed) => seed.status === "new" || seed.status === "contacted").length;
  const futureActions = followups.filter((followup) => {
    if (!followup.nextActionAt) return false;
    const parsed = new Date(followup.nextActionAt);
    return !Number.isNaN(parsed.getTime()) && parsed >= new Date();
  }).length;

  return [
    { label: "Membros cadastrados", value: String(members.length), detail: "Base do tenant atual" },
    { label: "Membros ativos", value: String(activeMembers), detail: "Em acompanhamento" },
    { label: "Novos contatos", value: String(openContacts), detail: "Entrada do cuidado" },
    { label: "Cuidadores ativos", value: String(activeCaregivers), detail: "Prontos para acompanhar" },
    { label: "Acompanhamentos", value: String(followups.length), detail: "Registros de cuidado" },
    { label: "Proximas acoes", value: String(futureActions), detail: "Pendencias futuras" },
  ];
}
