import crypto from "node:crypto";
import { assertDatabaseConfigured, getDbPool, isDatabaseConfigured, isInMemoryFallbackAllowed } from "@/lib/db";
import { filterSessionsByWeek, isEditableTciStatus, sessionsOverlap, validateTciSessionWindow } from "@/server/domain/tci-scheduling";
import type {
  CreateTciChamberInput,
  CreateTciSessionInput,
  DataScope,
  TciChamber,
  TciSession,
  TciSessionCaregiver,
  TciSessionStatus,
  UpdateTciChamberInput,
  UpdateTciSessionInput,
} from "@/server/domain/mvp";
import { listCaregivers } from "@/server/repositories/mvp-repository";

type TciChamberRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  capacity: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type TciSessionRow = {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  starts_at: string;
  ends_at: string;
  chamber_id: string;
  status: TciSessionStatus;
  notes: string;
  created_by_tenant_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type TciSessionCaregiverRow = {
  id: string;
  tci_session_id: string;
  caregiver_id: string;
  role: string | null;
  created_at: string;
};

const localChambersStore: TciChamber[] = [];
const localSessionsStore: Array<Omit<TciSession, "caregivers">> = [];
const localSessionCaregiversStore: TciSessionCaregiver[] = [];

function serializeDateValue(value: string | Date | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function isDatabaseReady() {
  if (!isDatabaseConfigured()) {
    if (isInMemoryFallbackAllowed()) {
      return false;
    }

    throw new Error("Banco de dados obrigatorio nao configurado para o modulo de TCI.");
  }

  return getDbPool() !== null;
}

function ensureDb() {
  assertDatabaseConfigured("persistencia do modulo de TCI");
  const db = getDbPool();

  if (!db) {
    throw new Error("Nao foi possivel inicializar o pool do banco para o modulo de TCI.");
  }

  return db;
}

function matchesScope(tenantId: string, scope?: DataScope) {
  if (scope?.tenantId && scope.tenantId !== tenantId) return false;
  if (!scope?.tenantId && scope?.tenantIds?.length && !scope.tenantIds.includes(tenantId)) return false;
  return true;
}

function assertScopeAccess(record: { tenantId: string }, scope?: DataScope) {
  if (scope && !matchesScope(record.tenantId, scope)) {
    throw new Error("Acesso negado para outro tenant.");
  }
}

function mapChamber(row: TciChamberRow): TciChamber {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    capacity: row.capacity !== null ? Number(row.capacity) : null,
    active: !!row.active,
    createdAt: serializeDateValue(row.created_at) ?? undefined,
    updatedAt: serializeDateValue(row.updated_at) ?? undefined,
  };
}

function mapSessionCaregiver(row: TciSessionCaregiverRow, caregiverName?: string | null): TciSessionCaregiver {
  return {
    id: row.id,
    tciSessionId: row.tci_session_id,
    caregiverId: row.caregiver_id,
    caregiverName: caregiverName ?? null,
    role: row.role,
    createdAt: serializeDateValue(row.created_at) ?? undefined,
  };
}

function mapSession(
  row: TciSessionRow,
  chamberName: string | null,
  caregivers: TciSessionCaregiver[],
): TciSession {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description,
    scheduledDate: row.scheduled_date,
    startsAt: row.starts_at.slice(0, 5),
    endsAt: row.ends_at.slice(0, 5),
    chamberId: row.chamber_id,
    chamberName,
    status: row.status,
    notes: row.notes,
    createdByTenantUserId: row.created_by_tenant_user_id,
    caregivers,
    createdAt: serializeDateValue(row.created_at) ?? undefined,
    updatedAt: serializeDateValue(row.updated_at) ?? undefined,
  };
}

async function resolveCaregiverRoles(
  tenantId: string,
  caregiverIds: string[],
  caregiverRoles?: Array<{ caregiverId: string; role?: string | null }>,
) {
  const caregivers = await listCaregivers({ tenantId });
  const caregiverMap = new Map(caregivers.map((item) => [item.id, item]));
  const roleMap = new Map((caregiverRoles ?? []).map((item) => [item.caregiverId, item.role ?? null]));

  return caregiverIds.map((caregiverId) => {
    const caregiver = caregiverMap.get(caregiverId);
    if (!caregiver) {
      throw new Error("Cuidador informado nao pertence a esta localidade.");
    }

    return {
      caregiverId,
      caregiverName: caregiver.name,
      role: roleMap.get(caregiverId) ?? null,
    };
  });
}

async function assertChamberExists(tenantId: string, chamberId: string, scope?: DataScope) {
  const chambers = await listTciChambers(scope ?? { tenantId });
  const chamber = chambers.find((item) => item.id === chamberId);
  if (!chamber) {
    throw new Error("Camara de energizacao nao encontrada para esta localidade.");
  }
  if (!chamber.active) {
    throw new Error("Camara de energizacao inativa.");
  }
  return chamber;
}

async function assertNoSessionConflict(input: {
  tenantId: string;
  chamberId: string;
  scheduledDate: string;
  startsAt: string;
  endsAt: string;
  ignoreSessionId?: string;
}, scope?: DataScope) {
  const sessions = await listTciSessions(scope ?? { tenantId: input.tenantId });
  const conflict = sessions.find((session) =>
    session.id !== input.ignoreSessionId &&
    session.chamberId === input.chamberId &&
    session.scheduledDate === input.scheduledDate &&
    session.status !== "cancelled" &&
    sessionsOverlap(session.startsAt, session.endsAt, input.startsAt, input.endsAt),
  );

  if (conflict) {
    throw new Error(`Ja existe sessao na mesma camara em conflito com o horario informado: ${conflict.title}.`);
  }
}

export function resetLocalTciStore() {
  localChambersStore.splice(0, localChambersStore.length);
  localSessionsStore.splice(0, localSessionsStore.length);
  localSessionCaregiversStore.splice(0, localSessionCaregiversStore.length);
}

export async function listTciChambers(scope?: DataScope): Promise<TciChamber[]> {
  if (!isDatabaseReady()) {
    return localChambersStore
      .filter((chamber) => matchesScope(chamber.tenantId, scope))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  const db = ensureDb();
  const values: any[] = [];
  const clauses: string[] = [];
  if (scope?.tenantId) {
    values.push(scope.tenantId);
    clauses.push(`tenant_id = $${values.length}`);
  } else if (scope?.tenantIds?.length) {
    values.push(scope.tenantIds);
    clauses.push(`tenant_id = ANY($${values.length})`);
  }
  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const result = await db.query<TciChamberRow>(`select * from tci_chambers ${where} order by name`, values);
  return result.rows.map(mapChamber);
}

export async function createTciChamber(input: CreateTciChamberInput): Promise<TciChamber> {
  if (!isDatabaseReady()) {
    const chamber: TciChamber = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      name: input.name,
      description: input.description?.trim() ?? "",
      capacity: input.capacity ?? null,
      active: input.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localChambersStore.unshift(chamber);
    return chamber;
  }

  const db = ensureDb();
  const result = await db.query<TciChamberRow>(
    `insert into tci_chambers (tenant_id, name, description, capacity, active)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [input.tenantId, input.name, input.description?.trim() ?? "", input.capacity ?? null, input.active ?? true],
  );
  return mapChamber(result.rows[0]);
}

export async function updateTciChamber(chamberId: string, input: UpdateTciChamberInput, scope?: DataScope): Promise<TciChamber> {
  const existing = (await listTciChambers(scope)).find((item) => item.id === chamberId);
  if (!existing) {
    throw new Error("Camara de energizacao nao encontrada.");
  }

  if (!isDatabaseReady()) {
    const next: TciChamber = {
      ...existing,
      name: input.name,
      description: input.description?.trim() ?? "",
      capacity: input.capacity ?? null,
      active: input.active ?? true,
      updatedAt: new Date().toISOString(),
    };
    const index = localChambersStore.findIndex((item) => item.id === chamberId);
    localChambersStore[index] = next;
    return next;
  }

  const db = ensureDb();
  const result = await db.query<TciChamberRow>(
    `update tci_chambers
        set name = $2,
            description = $3,
            capacity = $4,
            active = $5
      where id = $1
      returning *`,
    [chamberId, input.name, input.description?.trim() ?? "", input.capacity ?? null, input.active ?? true],
  );
  return mapChamber(result.rows[0]);
}

export async function listTciSessions(
  scope?: DataScope,
  filters?: { weekStart?: string; caregiverId?: string; chamberId?: string; status?: TciSessionStatus | "" },
): Promise<TciSession[]> {
  if (!isDatabaseReady()) {
    const chambers = await listTciChambers(scope);
    let sessions: TciSession[] = localSessionsStore
      .filter((session) => matchesScope(session.tenantId, scope))
      .map((session) => ({
        ...session,
        chamberName: chambers.find((chamber) => chamber.id === session.chamberId)?.name ?? null,
        caregivers: localSessionCaregiversStore.filter((item) => item.tciSessionId === session.id),
      }));

    if (filters?.caregiverId) {
      sessions = sessions.filter((session) => session.caregivers.some((item) => item.caregiverId === filters.caregiverId));
    }
    if (filters?.chamberId) {
      sessions = sessions.filter((session) => session.chamberId === filters.chamberId);
    }
    if (filters?.status) {
      sessions = sessions.filter((session) => session.status === filters.status);
    }
    if (filters?.weekStart) {
      sessions = filterSessionsByWeek(sessions, filters.weekStart);
    }

    return sessions.sort((left, right) => `${left.scheduledDate} ${left.startsAt}`.localeCompare(`${right.scheduledDate} ${right.startsAt}`));
  }

  const db = ensureDb();
  const values: any[] = [];
  const clauses: string[] = [];
  if (scope?.tenantId) {
    values.push(scope.tenantId);
    clauses.push(`s.tenant_id = $${values.length}`);
  } else if (scope?.tenantIds?.length) {
    values.push(scope.tenantIds);
    clauses.push(`s.tenant_id = ANY($${values.length})`);
  }
  if (filters?.chamberId) {
    values.push(filters.chamberId);
    clauses.push(`s.chamber_id = $${values.length}`);
  }
  if (filters?.status) {
    values.push(filters.status);
    clauses.push(`s.status = $${values.length}`);
  }
  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const [sessionsResult, chambersResult, caregiversResult, sessionCaregiversResult] = await Promise.all([
    db.query<TciSessionRow>(`select s.* from tci_sessions s ${where} order by s.scheduled_date asc, s.starts_at asc`, values),
    db.query<TciChamberRow>("select * from tci_chambers"),
    db.query<{ id: string; name: string }>("select id, name from caregivers"),
    db.query<TciSessionCaregiverRow>("select * from tci_session_caregivers"),
  ]);
  const chamberMap = new Map(chambersResult.rows.map((item) => [item.id, item.name]));
  const caregiverMap = new Map(caregiversResult.rows.map((item) => [item.id, item.name]));
  let sessions = sessionsResult.rows.map((row) =>
    mapSession(
      row,
      chamberMap.get(row.chamber_id) ?? null,
      sessionCaregiversResult.rows
        .filter((item) => item.tci_session_id === row.id)
        .map((item) => mapSessionCaregiver(item, caregiverMap.get(item.caregiver_id) ?? null)),
    ),
  );

  if (filters?.caregiverId) {
    sessions = sessions.filter((session) => session.caregivers.some((item) => item.caregiverId === filters.caregiverId));
  }
  if (filters?.weekStart) {
    sessions = filterSessionsByWeek(sessions, filters.weekStart);
  }
  return sessions;
}

export async function getTciSession(sessionId: string, scope?: DataScope): Promise<TciSession> {
  const session = (await listTciSessions(scope)).find((item) => item.id === sessionId);
  if (!session) {
    throw new Error("Sessao TCI nao encontrada.");
  }
  assertScopeAccess(session, scope);
  return session;
}

export async function createTciSession(input: CreateTciSessionInput, scope?: DataScope): Promise<TciSession> {
  validateTciSessionWindow(input.startsAt, input.endsAt);
  await assertChamberExists(input.tenantId, input.chamberId, scope);
  await assertNoSessionConflict(input, scope);
  const caregiverLinks = await resolveCaregiverRoles(input.tenantId, Array.from(new Set(input.caregiverIds)), input.caregiverRoles);

  if (!isDatabaseReady()) {
    const sessionBase: Omit<TciSession, "caregivers"> = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      title: input.title,
      description: input.description?.trim() ?? "",
      scheduledDate: input.scheduledDate,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      chamberId: input.chamberId,
      chamberName: localChambersStore.find((item) => item.id === input.chamberId)?.name ?? null,
      status: input.status ?? "scheduled",
      notes: input.notes?.trim() ?? "",
      createdByTenantUserId: input.createdByTenantUserId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localSessionsStore.unshift(sessionBase);
    for (const caregiver of caregiverLinks) {
      localSessionCaregiversStore.push({
        id: crypto.randomUUID(),
        tciSessionId: sessionBase.id,
        caregiverId: caregiver.caregiverId,
        caregiverName: caregiver.caregiverName,
        role: caregiver.role,
        createdAt: new Date().toISOString(),
      });
    }
    return getTciSession(sessionBase.id, scope);
  }

  const db = ensureDb();
  await db.query("begin");
  try {
    const sessionResult = await db.query<TciSessionRow>(
      `insert into tci_sessions
        (tenant_id, title, description, scheduled_date, starts_at, ends_at, chamber_id, status, notes, created_by_tenant_user_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning *`,
      [
        input.tenantId,
        input.title,
        input.description?.trim() ?? "",
        input.scheduledDate,
        input.startsAt,
        input.endsAt,
        input.chamberId,
        input.status ?? "scheduled",
        input.notes?.trim() ?? "",
        input.createdByTenantUserId ?? null,
      ],
    );
    for (const caregiver of caregiverLinks) {
      await db.query(
        `insert into tci_session_caregivers (tci_session_id, caregiver_id, role)
         values ($1, $2, $3)`,
        [sessionResult.rows[0].id, caregiver.caregiverId, caregiver.role],
      );
    }
    await db.query("commit");
    return getTciSession(sessionResult.rows[0].id, scope);
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

export async function updateTciSession(sessionId: string, input: UpdateTciSessionInput, scope?: DataScope): Promise<TciSession> {
  const existing = await getTciSession(sessionId, scope);
  if (!isEditableTciStatus(existing.status)) {
    throw new Error("Sessao concluida ou cancelada nao pode ser reprogramada diretamente.");
  }

  validateTciSessionWindow(input.startsAt, input.endsAt);
  await assertChamberExists(input.tenantId, input.chamberId, scope);
  await assertNoSessionConflict({ ...input, ignoreSessionId: sessionId }, scope);
  const caregiverLinks = await resolveCaregiverRoles(input.tenantId, Array.from(new Set(input.caregiverIds)), input.caregiverRoles);

  if (!isDatabaseReady()) {
    const index = localSessionsStore.findIndex((item) => item.id === sessionId);
    localSessionsStore[index] = {
      ...localSessionsStore[index],
      title: input.title,
      description: input.description?.trim() ?? "",
      scheduledDate: input.scheduledDate,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      chamberId: input.chamberId,
      chamberName: localChambersStore.find((item) => item.id === input.chamberId)?.name ?? null,
      status: input.status ?? localSessionsStore[index].status,
      notes: input.notes?.trim() ?? "",
      updatedAt: new Date().toISOString(),
    };
    for (let i = localSessionCaregiversStore.length - 1; i >= 0; i -= 1) {
      if (localSessionCaregiversStore[i]?.tciSessionId === sessionId) {
        localSessionCaregiversStore.splice(i, 1);
      }
    }
    for (const caregiver of caregiverLinks) {
      localSessionCaregiversStore.push({
        id: crypto.randomUUID(),
        tciSessionId: sessionId,
        caregiverId: caregiver.caregiverId,
        caregiverName: caregiver.caregiverName,
        role: caregiver.role,
        createdAt: new Date().toISOString(),
      });
    }
    return getTciSession(sessionId, scope);
  }

  const db = ensureDb();
  await db.query("begin");
  try {
    await db.query(
      `update tci_sessions
          set title = $2,
              description = $3,
              scheduled_date = $4,
              starts_at = $5,
              ends_at = $6,
              chamber_id = $7,
              status = $8,
              notes = $9
        where id = $1`,
      [sessionId, input.title, input.description?.trim() ?? "", input.scheduledDate, input.startsAt, input.endsAt, input.chamberId, input.status ?? existing.status, input.notes?.trim() ?? ""],
    );
    await db.query("delete from tci_session_caregivers where tci_session_id = $1", [sessionId]);
    for (const caregiver of caregiverLinks) {
      await db.query(
        `insert into tci_session_caregivers (tci_session_id, caregiver_id, role)
         values ($1, $2, $3)`,
        [sessionId, caregiver.caregiverId, caregiver.role],
      );
    }
    await db.query("commit");
    return getTciSession(sessionId, scope);
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

export async function updateTciSessionStatus(sessionId: string, status: TciSessionStatus, scope?: DataScope): Promise<TciSession> {
  const existing = await getTciSession(sessionId, scope);
  if (existing.status === "cancelled" && status === "completed") {
    throw new Error("Sessao cancelada nao pode ser concluida.");
  }

  if (!isDatabaseReady()) {
    const index = localSessionsStore.findIndex((item) => item.id === sessionId);
    localSessionsStore[index] = {
      ...localSessionsStore[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    return getTciSession(sessionId, scope);
  }

  const db = ensureDb();
  await db.query("update tci_sessions set status = $2 where id = $1", [sessionId, status]);
  return getTciSession(sessionId, scope);
}
