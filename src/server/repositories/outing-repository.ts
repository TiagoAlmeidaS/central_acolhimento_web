import crypto from "node:crypto";
import { assertDatabaseConfigured, getDbPool, isDatabaseConfigured, isInMemoryFallbackAllowed } from "@/lib/db";
import { generateOutingGroups, normalizeGuestIdentity } from "@/server/domain/outing-generator";
import type {
  AddOutingParticipantInput,
  CreateOutingConstraintInput,
  CreateOutingInput,
  CreateOutingTypeInput,
  DataScope,
  OutingConstraintGroup,
  OutingDetail,
  OutingEvent,
  OutingGroup,
  OutingParticipant,
  OutingType,
  UpdateOutingTypeInput,
  UpdateOutingInput,
} from "@/server/domain/mvp";
import { listCaregivers, listMembers } from "@/server/repositories/mvp-repository";

type OutingEventRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  scheduled_for: string | null;
  target_group_size: number;
  allow_groups_without_car: boolean;
  status: OutingEvent["status"];
  created_by_tenant_user_id: string | null;
  created_at: string;
  updated_at: string;
  outing_type_id: string | null;
  outing_type_name?: string | null;
  completed_at: string | null;
  completed_by_tenant_user_id: string | null;
};

type OutingTypeRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  active: boolean;
  created_by_tenant_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type OutingParticipantRow = {
  id: string;
  outing_event_id: string;
  participant_type: OutingParticipant["participantType"];
  participant_id: string | null;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  has_car: boolean;
  car_seats: number;
  is_driver: boolean;
  notes: string;
  created_at: string;
};

type OutingConstraintGroupRow = {
  id: string;
  outing_event_id: string;
  label: string;
  constraint_type: "must_stay_together";
  created_at: string;
};

type OutingConstraintGroupMemberRow = {
  constraint_group_id: string;
  outing_participant_id: string;
};

type OutingGroupRow = {
  id: string;
  outing_event_id: string;
  name: string;
  driver_participant_id: string | null;
  car_capacity_total: number | null;
  sort_order: number;
  created_at: string;
};

type OutingGroupAssignmentRow = {
  outing_group_id: string;
  outing_participant_id: string;
  assigned_by: "system" | "manual";
};

const localOutingEventsStore: OutingEvent[] = [];
const localOutingTypesStore: OutingType[] = [];
const localOutingParticipantsStore: OutingParticipant[] = [];
const localOutingConstraintGroupsStore: OutingConstraintGroup[] = [];
const localOutingGroupsStore: Array<Omit<OutingGroup, "participants">> = [];
const localOutingAssignmentsStore: Array<{ outingGroupId: string; outingParticipantId: string; assignedBy: "system" | "manual" }> = [];

function serializeDateValue(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function mapOuting(row: OutingEventRow): OutingEvent {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    scheduledFor: serializeDateValue(row.scheduled_for),
    targetGroupSize: Number(row.target_group_size),
    allowGroupsWithoutCar: !!row.allow_groups_without_car,
    status: row.status,
    createdByTenantUserId: row.created_by_tenant_user_id,
    createdAt: serializeDateValue(row.created_at) ?? undefined,
    updatedAt: serializeDateValue(row.updated_at) ?? undefined,
    outingTypeId: row.outing_type_id,
    outingTypeName: row.outing_type_name ?? null,
    completedAt: serializeDateValue(row.completed_at),
    completedByTenantUserId: row.completed_by_tenant_user_id,
  };
}

function mapOutingType(row: OutingTypeRow): OutingType {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    active: !!row.active,
    createdByTenantUserId: row.created_by_tenant_user_id,
    createdAt: serializeDateValue(row.created_at) ?? undefined,
    updatedAt: serializeDateValue(row.updated_at) ?? undefined,
  };
}

function mapParticipant(row: OutingParticipantRow): OutingParticipant {
  return {
    id: row.id,
    outingEventId: row.outing_event_id,
    participantType: row.participant_type,
    participantId: row.participant_id,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    hasCar: !!row.has_car,
    carSeats: Number(row.car_seats),
    isDriver: !!row.is_driver,
    notes: row.notes,
    createdAt: serializeDateValue(row.created_at) ?? undefined,
  };
}

function mapConstraint(
  row: OutingConstraintGroupRow,
  members: OutingConstraintGroupMemberRow[],
): OutingConstraintGroup {
  return {
    id: row.id,
    outingEventId: row.outing_event_id,
    label: row.label,
    constraintType: row.constraint_type,
    participantIds: members
      .filter((member) => member.constraint_group_id === row.id)
      .map((member) => member.outing_participant_id),
    createdAt: serializeDateValue(row.created_at) ?? undefined,
  };
}

function mapGroup(
  row: OutingGroupRow,
  participants: OutingParticipant[],
  assignments: OutingGroupAssignmentRow[],
): OutingGroup {
  const groupAssignments = assignments.filter((assignment) => assignment.outing_group_id === row.id);

  return {
    id: row.id,
    outingEventId: row.outing_event_id,
    name: row.name,
    driverParticipantId: row.driver_participant_id,
    carCapacityTotal: row.car_capacity_total !== null ? Number(row.car_capacity_total) : null,
    sortOrder: Number(row.sort_order),
    participants: groupAssignments
      .map((assignment) => participants.find((participant) => participant.id === assignment.outing_participant_id))
      .filter((participant): participant is OutingParticipant => Boolean(participant)),
    assignedBy: groupAssignments[0]?.assigned_by ?? "system",
    createdAt: serializeDateValue(row.created_at) ?? undefined,
  };
}

function isDatabaseReady() {
  if (!isDatabaseConfigured()) {
    if (isInMemoryFallbackAllowed()) {
      return false;
    }

    throw new Error("Banco de dados obrigatorio nao configurado para o modulo de saidas.");
  }

  return getDbPool() !== null;
}

function ensureDb() {
  assertDatabaseConfigured("persistencia do modulo de saidas");
  const db = getDbPool();

  if (!db) {
    throw new Error("Nao foi possivel inicializar o pool do banco para o modulo de saidas.");
  }

  return db;
}

function matchesScope(tenantId: string, scope?: DataScope) {
  if (scope?.tenantId && tenantId !== scope.tenantId) {
    return false;
  }

  if (!scope?.tenantId && scope?.tenantIds?.length && !scope.tenantIds.includes(tenantId)) {
    return false;
  }

  return true;
}

function assertScopeAccess(record: { tenantId: string }, scope?: DataScope) {
  if (scope && !matchesScope(record.tenantId, scope)) {
    throw new Error("Acesso negado para outro tenant.");
  }
}

function clearLocalGroupsForOuting(outingEventId: string) {
  for (let index = localOutingAssignmentsStore.length - 1; index >= 0; index -= 1) {
    const assignment = localOutingAssignmentsStore[index];
    const group = localOutingGroupsStore.find((item) => item.id === assignment?.outingGroupId);

    if (group?.outingEventId === outingEventId) {
      localOutingAssignmentsStore.splice(index, 1);
    }
  }

  for (let index = localOutingGroupsStore.length - 1; index >= 0; index -= 1) {
    if (localOutingGroupsStore[index]?.outingEventId === outingEventId) {
      localOutingGroupsStore.splice(index, 1);
    }
  }
}

async function resolveSourceParticipant(input: AddOutingParticipantInput, tenantId: string) {
  if (input.participantType === "guest") {
    const displayName = input.displayName?.trim() || [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(" ");

    if (!displayName) {
      throw new Error("Participante avulso precisa ter nome preenchido.");
    }

    return {
      participantId: null,
      displayName,
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
    };
  }

  if (!input.participantId) {
    throw new Error("Participante cadastrado precisa informar participantId.");
  }

  if (input.participantType === "caregiver") {
    const caregiver = (await listCaregivers({ tenantId })).find((item) => item.id === input.participantId);

    if (!caregiver) {
      throw new Error("Cuidador nao encontrado para esta localidade.");
    }

    return {
      participantId: caregiver.id,
      displayName: caregiver.name,
      firstName: null,
      lastName: null,
      phone: caregiver.phone || null,
      email: caregiver.email ?? null,
    };
  }

  const member = (await listMembers({ tenantId })).find((item) => item.id === input.participantId);

  if (!member) {
    throw new Error("Membro nao encontrado para esta localidade.");
  }

  return {
    participantId: member.id,
    displayName: member.name,
    firstName: null,
    lastName: null,
    phone: member.phone || null,
    email: null,
  };
}

function assertLocalDuplicateParticipant(
  outingEventId: string,
  input: AddOutingParticipantInput,
  resolved: Awaited<ReturnType<typeof resolveSourceParticipant>>,
) {
  if (resolved.participantId) {
    const existing = localOutingParticipantsStore.find((participant) =>
      participant.outingEventId === outingEventId &&
      participant.participantType === input.participantType &&
      participant.participantId === resolved.participantId
    );

    if (existing) {
      throw new Error("Este participante ja foi adicionado a esta saida.");
    }

    return;
  }

  const guestIdentity = normalizeGuestIdentity(resolved.displayName, resolved.phone);
  const existing = localOutingParticipantsStore.find((participant) =>
    participant.outingEventId === outingEventId &&
    participant.participantType === "guest" &&
    normalizeGuestIdentity(participant.displayName, participant.phone) === guestIdentity
  );

  if (existing) {
    throw new Error("Este participante avulso ja foi adicionado a esta saida.");
  }
}

function buildLocalOutingDetail(outing: OutingEvent): OutingDetail {
  const participants = localOutingParticipantsStore.filter((participant) => participant.outingEventId === outing.id);
  const groups = localOutingGroupsStore
    .filter((group) => group.outingEventId === outing.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((group) => ({
      ...group,
      participants: localOutingAssignmentsStore
        .filter((assignment) => assignment.outingGroupId === group.id)
        .map((assignment) => participants.find((participant) => participant.id === assignment.outingParticipantId))
        .filter((participant): participant is OutingParticipant => Boolean(participant)),
    }));

  return {
    outing,
    participants,
    constraints: localOutingConstraintGroupsStore.filter((constraint) => constraint.outingEventId === outing.id),
    groups,
  };
}

export function resetLocalOutingsStore() {
  localOutingEventsStore.splice(0, localOutingEventsStore.length);
  localOutingTypesStore.splice(0, localOutingTypesStore.length);
  localOutingParticipantsStore.splice(0, localOutingParticipantsStore.length);
  localOutingConstraintGroupsStore.splice(0, localOutingConstraintGroupsStore.length);
  localOutingGroupsStore.splice(0, localOutingGroupsStore.length);
  localOutingAssignmentsStore.splice(0, localOutingAssignmentsStore.length);
}

export async function listOutingTypes(scope?: DataScope, options?: { includeInactive?: boolean }): Promise<OutingType[]> {
  if (!isDatabaseReady()) {
    return localOutingTypesStore
      .filter((item) => matchesScope(item.tenantId, scope) && (options?.includeInactive || item.active))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const db = ensureDb();
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (scope?.tenantId) {
    values.push(scope.tenantId);
    clauses.push(`tenant_id = $${values.length}`);
  } else if (scope?.tenantIds?.length) {
    values.push(scope.tenantIds);
    clauses.push(`tenant_id = ANY($${values.length})`);
  }
  if (!options?.includeInactive) clauses.push("active = true");
  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const result = await db.query<OutingTypeRow>(`select * from outing_types ${where} order by name asc`, values);
  return result.rows.map(mapOutingType);
}

export async function createOutingType(input: CreateOutingTypeInput): Promise<OutingType> {
  const name = input.name.trim();
  if (!name) throw new Error("Nome do tipo de saida e obrigatorio.");
  if (!isDatabaseReady()) {
    if (localOutingTypesStore.some((item) => item.tenantId === input.tenantId && item.active && item.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Ja existe um tipo de saida ativo com este nome.");
    }
    const now = new Date().toISOString();
    const type: OutingType = {
      id: crypto.randomUUID(), tenantId: input.tenantId, name, description: input.description?.trim() ?? "",
      active: input.active ?? true, createdByTenantUserId: input.createdByTenantUserId ?? null, createdAt: now, updatedAt: now,
    };
    localOutingTypesStore.push(type);
    return type;
  }
  const db = ensureDb();
  const result = await db.query<OutingTypeRow>(
    `insert into outing_types (tenant_id, name, description, active, created_by_tenant_user_id)
     values ($1, $2, $3, $4, $5) returning *`,
    [input.tenantId, name, input.description?.trim() ?? "", input.active ?? true, input.createdByTenantUserId ?? null],
  );
  return mapOutingType(result.rows[0]);
}

export async function updateOutingType(typeId: string, input: UpdateOutingTypeInput, scope?: DataScope): Promise<OutingType> {
  const existing = (await listOutingTypes(scope, { includeInactive: true })).find((item) => item.id === typeId);
  if (!existing) throw new Error("Tipo de saida nao encontrado.");
  if (existing.tenantId !== input.tenantId) throw new Error("Acesso negado para outro tenant.");
  const name = input.name.trim();
  if (!name) throw new Error("Nome do tipo de saida e obrigatorio.");
  if (!isDatabaseReady()) {
    const duplicate = localOutingTypesStore.some((item) => item.id !== typeId && item.tenantId === input.tenantId && item.active && (input.active ?? true) && item.name.toLowerCase() === name.toLowerCase());
    if (duplicate) throw new Error("Ja existe um tipo de saida ativo com este nome.");
    const updated = { ...existing, name, description: input.description?.trim() ?? "", active: input.active ?? true, updatedAt: new Date().toISOString() };
    localOutingTypesStore[localOutingTypesStore.findIndex((item) => item.id === typeId)] = updated;
    return updated;
  }
  const db = ensureDb();
  const result = await db.query<OutingTypeRow>(
    `update outing_types set name = $2, description = $3, active = $4 where id = $1 returning *`,
    [typeId, name, input.description?.trim() ?? "", input.active ?? true],
  );
  return mapOutingType(result.rows[0]);
}

async function resolveActiveOutingType(tenantId: string, typeId: string | null | undefined) {
  if (!typeId) return null;
  const type = (await listOutingTypes({ tenantId })).find((item) => item.id === typeId);
  if (!type) throw new Error("Tipo de saida ativo nao encontrado para esta localidade.");
  return type;
}

export async function listOutings(scope?: DataScope): Promise<OutingEvent[]> {
  if (!isDatabaseReady()) {
    return localOutingEventsStore
      .filter((outing) => matchesScope(outing.tenantId, scope))
      .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
  }

  const db = ensureDb();
  const values: string[] = [];
  const clauses: string[] = [];

  if (scope?.tenantId) {
    values.push(scope.tenantId);
    clauses.push(`tenant_id = $${values.length}`);
  } else if (scope?.tenantIds?.length) {
    values.push(scope.tenantIds as unknown as string);
    clauses.push(`tenant_id = ANY($${values.length})`);
  }

  const where = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const result = await db.query<OutingEventRow>(
    `select e.*, ot.name as outing_type_name from outing_events e left join outing_types ot on ot.id = e.outing_type_id ${where.replaceAll("tenant_id", "e.tenant_id")} order by e.created_at desc`,
    values,
  );
  return result.rows.map(mapOuting);
}

export async function getOutingDetail(outingId: string, scope?: DataScope): Promise<OutingDetail> {
  if (!isDatabaseReady()) {
    const outing = localOutingEventsStore.find((item) => item.id === outingId);

    if (!outing) {
      throw new Error("Saida nao encontrada.");
    }

    assertScopeAccess(outing, scope);
    return buildLocalOutingDetail(outing);
  }

  const db = ensureDb();
  const outingResult = await db.query<OutingEventRow>(
    "select e.*, ot.name as outing_type_name from outing_events e left join outing_types ot on ot.id = e.outing_type_id where e.id = $1 limit 1",
    [outingId],
  );
  const outing = outingResult.rows[0] ? mapOuting(outingResult.rows[0]) : null;

  if (!outing) {
    throw new Error("Saida nao encontrada.");
  }

  assertScopeAccess(outing, scope);

  const [participantsResult, constraintGroupsResult, constraintMembersResult, groupsResult, assignmentsResult] = await Promise.all([
    db.query<OutingParticipantRow>("select * from outing_participants where outing_event_id = $1 order by created_at asc", [outingId]),
    db.query<OutingConstraintGroupRow>("select * from outing_constraint_groups where outing_event_id = $1 order by created_at asc", [outingId]),
    db.query<OutingConstraintGroupMemberRow>(
      `select m.constraint_group_id, m.outing_participant_id
       from outing_constraint_group_members m
       join outing_constraint_groups g on g.id = m.constraint_group_id
       where g.outing_event_id = $1`,
      [outingId],
    ),
    db.query<OutingGroupRow>("select * from outing_groups where outing_event_id = $1 order by sort_order asc, created_at asc", [outingId]),
    db.query<OutingGroupAssignmentRow>(
      `select a.outing_group_id, a.outing_participant_id, a.assigned_by
       from outing_group_assignments a
       join outing_groups g on g.id = a.outing_group_id
       where g.outing_event_id = $1`,
      [outingId],
    ),
  ]);

  const participants = participantsResult.rows.map(mapParticipant);

  return {
    outing,
    participants,
    constraints: constraintGroupsResult.rows.map((row) => mapConstraint(row, constraintMembersResult.rows)),
    groups: groupsResult.rows.map((row) => mapGroup(row, participants, assignmentsResult.rows)),
  };
}

export async function createOuting(input: CreateOutingInput): Promise<OutingEvent> {
  const outingType = await resolveActiveOutingType(input.tenantId, input.outingTypeId);
  if (!isDatabaseReady()) {
    const outing: OutingEvent = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      name: input.name,
      description: input.description?.trim() ?? "",
      scheduledFor: input.scheduledFor ?? null,
      targetGroupSize: Math.max(2, input.targetGroupSize ?? 4),
      allowGroupsWithoutCar: !!input.allowGroupsWithoutCar,
      status: "draft",
      outingTypeId: outingType?.id ?? null,
      outingTypeName: outingType?.name ?? null,
      completedAt: null,
      completedByTenantUserId: null,
      createdByTenantUserId: input.createdByTenantUserId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localOutingEventsStore.unshift(outing);
    return outing;
  }

  const db = ensureDb();
  const result = await db.query<OutingEventRow>(
    `insert into outing_events
       (tenant_id, name, description, scheduled_for, target_group_size, allow_groups_without_car, status, created_by_tenant_user_id, outing_type_id)
     values ($1, $2, $3, $4, $5, $6, 'draft', $7, $8)
     returning *`,
    [
      input.tenantId,
      input.name,
      input.description?.trim() ?? "",
      input.scheduledFor ?? null,
      Math.max(2, input.targetGroupSize ?? 4),
      !!input.allowGroupsWithoutCar,
      input.createdByTenantUserId ?? null,
      outingType?.id ?? null,
    ],
  );
  return mapOuting(result.rows[0]);
}

export async function updateOuting(outingId: string, input: UpdateOutingInput, scope?: DataScope): Promise<OutingEvent> {
  const detail = await getOutingDetail(outingId, scope);
  const outingType = await resolveActiveOutingType(input.tenantId, input.outingTypeId);

  if (detail.outing.status === "confirmed") {
    throw new Error("A saida confirmada precisa voltar para rascunho antes de ser alterada.");
  }

  if (!isDatabaseReady()) {
    const index = localOutingEventsStore.findIndex((item) => item.id === outingId);
    const updated: OutingEvent = {
      ...detail.outing,
      name: input.name,
      description: input.description?.trim() ?? "",
      scheduledFor: input.scheduledFor ?? null,
      targetGroupSize: Math.max(2, input.targetGroupSize ?? 4),
      allowGroupsWithoutCar: !!input.allowGroupsWithoutCar,
      outingTypeId: outingType?.id ?? null,
      outingTypeName: outingType?.name ?? null,
      updatedAt: new Date().toISOString(),
    };
    localOutingEventsStore[index] = updated;
    return updated;
  }

  const db = ensureDb();
  const result = await db.query<OutingEventRow>(
    `update outing_events
        set name = $2,
            description = $3,
            scheduled_for = $4,
            target_group_size = $5,
            allow_groups_without_car = $6,
            outing_type_id = $7
      where id = $1
      returning *`,
    [outingId, input.name, input.description?.trim() ?? "", input.scheduledFor ?? null, Math.max(2, input.targetGroupSize ?? 4), !!input.allowGroupsWithoutCar, outingType?.id ?? null],
  );
  return mapOuting(result.rows[0]);
}

export async function addOutingParticipant(input: AddOutingParticipantInput, scope?: DataScope): Promise<OutingParticipant> {
  const detail = await getOutingDetail(input.outingEventId, scope);

  if (detail.outing.status === "confirmed") {
    throw new Error("Nao e possivel adicionar participantes a uma saida confirmada.");
  }

  const resolved = await resolveSourceParticipant(input, detail.outing.tenantId);

  if (!isDatabaseReady()) {
    assertLocalDuplicateParticipant(input.outingEventId, input, resolved);

    const participant: OutingParticipant = {
      id: crypto.randomUUID(),
      outingEventId: input.outingEventId,
      participantType: input.participantType,
      participantId: resolved.participantId,
      displayName: resolved.displayName,
      firstName: resolved.firstName,
      lastName: resolved.lastName,
      phone: resolved.phone,
      email: resolved.email,
      hasCar: !!input.hasCar,
      carSeats: Math.max(0, input.carSeats ?? 0),
      isDriver: !!input.isDriver && !!input.hasCar,
      notes: input.notes?.trim() ?? "",
      createdAt: new Date().toISOString(),
    };

    localOutingParticipantsStore.push(participant);
    return participant;
  }

  const db = ensureDb();
  const duplicateCheck = resolved.participantId
    ? await db.query<{ id: string }>(
        `select id
         from outing_participants
         where outing_event_id = $1 and participant_type = $2 and participant_id = $3
         limit 1`,
        [input.outingEventId, input.participantType, resolved.participantId],
      )
    : await db.query<{ id: string; display_name: string; phone: string | null }>(
        `select id, display_name, phone
         from outing_participants
         where outing_event_id = $1 and participant_type = 'guest'`,
        [input.outingEventId],
      );

  if (resolved.participantId && duplicateCheck.rows[0]) {
    throw new Error("Este participante ja foi adicionado a esta saida.");
  }

  if (!resolved.participantId) {
    const guestIdentity = normalizeGuestIdentity(resolved.displayName, resolved.phone);
    const duplicateGuest = (duplicateCheck.rows as Array<{ id: string; display_name: string; phone: string | null }>).find(
      (row) => normalizeGuestIdentity(row.display_name, row.phone) === guestIdentity,
    );
    if (duplicateGuest) {
      throw new Error("Este participante avulso ja foi adicionado a esta saida.");
    }
  }

  const result = await db.query<OutingParticipantRow>(
    `insert into outing_participants
       (outing_event_id, participant_type, participant_id, display_name, first_name, last_name, phone, email, has_car, car_seats, is_driver, notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning *`,
    [
      input.outingEventId,
      input.participantType,
      resolved.participantId,
      resolved.displayName,
      resolved.firstName,
      resolved.lastName,
      resolved.phone,
      resolved.email,
      !!input.hasCar,
      Math.max(0, input.carSeats ?? 0),
      !!input.isDriver && !!input.hasCar,
      input.notes?.trim() ?? "",
    ],
  );

  return mapParticipant(result.rows[0]);
}

export async function removeOutingParticipant(outingEventId: string, participantId: string, scope?: DataScope): Promise<void> {
  const detail = await getOutingDetail(outingEventId, scope);

  if (detail.outing.status === "confirmed") {
    throw new Error("Nao e possivel remover participantes de uma saida confirmada.");
  }

  if (!detail.participants.some((participant) => participant.id === participantId)) {
    throw new Error("Participante nao encontrado nesta saida.");
  }

  if (!isDatabaseReady()) {
    clearLocalGroupsForOuting(outingEventId);

    for (let index = localOutingConstraintGroupsStore.length - 1; index >= 0; index -= 1) {
      const constraint = localOutingConstraintGroupsStore[index];
      if (!constraint || constraint.outingEventId !== outingEventId) {
        continue;
      }

      if (constraint.participantIds.includes(participantId)) {
        const nextParticipantIds = constraint.participantIds.filter((id) => id !== participantId);

        if (nextParticipantIds.length < 2) {
          localOutingConstraintGroupsStore.splice(index, 1);
        } else {
          localOutingConstraintGroupsStore[index] = { ...constraint, participantIds: nextParticipantIds };
        }
      }
    }

    const participantIndex = localOutingParticipantsStore.findIndex((participant) => participant.id === participantId);
    if (participantIndex >= 0) {
      localOutingParticipantsStore.splice(participantIndex, 1);
    }

    const outingIndex = localOutingEventsStore.findIndex((item) => item.id === outingEventId);
    if (outingIndex >= 0) {
      localOutingEventsStore[outingIndex] = {
        ...localOutingEventsStore[outingIndex],
        status: "draft",
        updatedAt: new Date().toISOString(),
      };
    }

    return;
  }

  const db = ensureDb();
  await db.query("begin");

  try {
    const constraintGroups = await db.query<{ id: string }>(
      `select cg.id
       from outing_constraint_groups cg
       join outing_constraint_group_members cgm on cgm.constraint_group_id = cg.id
       where cg.outing_event_id = $1 and cgm.outing_participant_id = $2`,
      [outingEventId, participantId],
    );

    for (const row of constraintGroups.rows) {
      const countResult = await db.query<{ total: string }>(
        "select count(*)::text as total from outing_constraint_group_members where constraint_group_id = $1",
        [row.id],
      );
      const total = Number(countResult.rows[0]?.total ?? "0");
      await db.query(
        "delete from outing_constraint_group_members where constraint_group_id = $1 and outing_participant_id = $2",
        [row.id, participantId],
      );
      if (total <= 2) {
        await db.query("delete from outing_constraint_groups where id = $1", [row.id]);
      }
    }

    await db.query(
      `delete from outing_group_assignments
       where outing_participant_id = $1
         and outing_group_id in (select id from outing_groups where outing_event_id = $2)`,
      [participantId, outingEventId],
    );
    await db.query("delete from outing_participants where id = $1 and outing_event_id = $2", [participantId, outingEventId]);
    await db.query("delete from outing_groups where outing_event_id = $1", [outingEventId]);
    await db.query("update outing_events set status = 'draft' where id = $1", [outingEventId]);
    await db.query("commit");
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

export async function createOutingConstraint(input: CreateOutingConstraintInput, scope?: DataScope): Promise<OutingConstraintGroup> {
  const detail = await getOutingDetail(input.outingEventId, scope);

  if (detail.outing.status === "confirmed") {
    throw new Error("Nao e possivel alterar vinculos em uma saida confirmada.");
  }

  const uniqueParticipantIds = Array.from(new Set(input.participantIds));
  if (uniqueParticipantIds.length < 2) {
    throw new Error("Selecione ao menos dois participantes para criar um vinculo inseparavel.");
  }

  for (const participantId of uniqueParticipantIds) {
    if (!detail.participants.some((participant) => participant.id === participantId)) {
      throw new Error("Um dos participantes informados nao pertence a esta saida.");
    }
  }

  const alreadyConstrained = detail.constraints.find((constraint) =>
    constraint.participantIds.some((participantId) => uniqueParticipantIds.includes(participantId)),
  );

  if (alreadyConstrained) {
    throw new Error(`Um dos participantes ja esta no vinculo "${alreadyConstrained.label}".`);
  }

  if (!isDatabaseReady()) {
    const constraint: OutingConstraintGroup = {
      id: crypto.randomUUID(),
      outingEventId: input.outingEventId,
      label: input.label.trim(),
      constraintType: "must_stay_together",
      participantIds: uniqueParticipantIds,
      createdAt: new Date().toISOString(),
    };
    localOutingConstraintGroupsStore.push(constraint);
    return constraint;
  }

  const db = ensureDb();
  await db.query("begin");
  try {
    const result = await db.query<OutingConstraintGroupRow>(
      `insert into outing_constraint_groups (outing_event_id, label, constraint_type)
       values ($1, $2, 'must_stay_together')
       returning *`,
      [input.outingEventId, input.label.trim()],
    );

    for (const participantId of uniqueParticipantIds) {
      await db.query(
        `insert into outing_constraint_group_members (constraint_group_id, outing_participant_id)
         values ($1, $2)`,
        [result.rows[0].id, participantId],
      );
    }

    await db.query("commit");
    return {
      id: result.rows[0].id,
      outingEventId: result.rows[0].outing_event_id,
      label: result.rows[0].label,
      constraintType: result.rows[0].constraint_type,
      participantIds: uniqueParticipantIds,
      createdAt: result.rows[0].created_at,
    };
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

export async function removeOutingConstraint(outingEventId: string, constraintId: string, scope?: DataScope): Promise<void> {
  const detail = await getOutingDetail(outingEventId, scope);

  if (detail.outing.status === "confirmed") {
    throw new Error("Nao e possivel remover vinculos de uma saida confirmada.");
  }

  if (!detail.constraints.some((constraint) => constraint.id === constraintId)) {
    throw new Error("Vinculo nao encontrado nesta saida.");
  }

  if (!isDatabaseReady()) {
    const index = localOutingConstraintGroupsStore.findIndex((constraint) => constraint.id === constraintId);
    if (index >= 0) {
      localOutingConstraintGroupsStore.splice(index, 1);
    }
    return;
  }

  const db = ensureDb();
  await db.query("delete from outing_constraint_groups where id = $1 and outing_event_id = $2", [constraintId, outingEventId]);
}

export async function generateOuting(outingEventId: string, scope?: DataScope): Promise<OutingDetail> {
  const detail = await getOutingDetail(outingEventId, scope);
  if (detail.outing.completedAt) throw new Error("Reabra a execucao antes de gerar novos grupos.");
  const generatedGroups = generateOutingGroups({
    outingEventId,
    participants: detail.participants,
    constraints: detail.constraints,
    targetGroupSize: detail.outing.targetGroupSize,
    allowGroupsWithoutCar: detail.outing.allowGroupsWithoutCar,
  });

  if (!isDatabaseReady()) {
    clearLocalGroupsForOuting(outingEventId);

    for (const group of generatedGroups) {
      localOutingGroupsStore.push({
        id: crypto.randomUUID(),
        outingEventId,
        name: group.name,
        driverParticipantId: group.driverParticipantId,
        carCapacityTotal: group.carCapacityTotal,
        sortOrder: group.sortOrder,
        assignedBy: "system",
        createdAt: new Date().toISOString(),
      });
    }

    for (const group of localOutingGroupsStore.filter((item) => item.outingEventId === outingEventId)) {
      const sourceGroup = generatedGroups.find((item) => item.name === group.name && item.sortOrder === group.sortOrder);
      for (const participant of sourceGroup?.participants ?? []) {
        localOutingAssignmentsStore.push({
          outingGroupId: group.id,
          outingParticipantId: participant.id,
          assignedBy: "system",
        });
      }
    }

    const outingIndex = localOutingEventsStore.findIndex((item) => item.id === outingEventId);
    if (outingIndex >= 0) {
      localOutingEventsStore[outingIndex] = {
        ...localOutingEventsStore[outingIndex],
        status: "generated",
        updatedAt: new Date().toISOString(),
      };
    }

    return buildLocalOutingDetail(localOutingEventsStore[outingIndex]);
  }

  const db = ensureDb();
  await db.query("begin");

  try {
    await db.query("delete from outing_group_assignments where outing_group_id in (select id from outing_groups where outing_event_id = $1)", [outingEventId]);
    await db.query("delete from outing_groups where outing_event_id = $1", [outingEventId]);

    for (const group of generatedGroups) {
      const insertedGroup = await db.query<OutingGroupRow>(
        `insert into outing_groups (outing_event_id, name, driver_participant_id, car_capacity_total, sort_order)
         values ($1, $2, $3, $4, $5)
         returning *`,
        [outingEventId, group.name, group.driverParticipantId, group.carCapacityTotal, group.sortOrder],
      );

      for (const participant of group.participants) {
        await db.query(
          `insert into outing_group_assignments (outing_group_id, outing_participant_id, assigned_by)
           values ($1, $2, 'system')`,
          [insertedGroup.rows[0].id, participant.id],
        );
      }
    }

    await db.query("update outing_events set status = 'generated' where id = $1", [outingEventId]);
    await db.query("commit");
  } catch (error) {
    await db.query("rollback");
    throw error;
  }

  return getOutingDetail(outingEventId, scope);
}

export async function confirmOuting(outingEventId: string, scope?: DataScope): Promise<OutingDetail> {
  const detail = await getOutingDetail(outingEventId, scope);

  if (detail.groups.length === 0) {
    throw new Error("Gere os grupos antes de confirmar a saida.");
  }

  const allAssignedParticipantIds = new Set(detail.groups.flatMap((group) => group.participants.map((participant) => participant.id)));
  if (allAssignedParticipantIds.size !== detail.participants.length) {
    throw new Error("Todos os participantes precisam estar distribuidos em grupos antes da confirmacao.");
  }

  for (const constraint of detail.constraints) {
    const groupId = detail.groups.find((group) => group.participants.some((participant) => participant.id === constraint.participantIds[0]))?.id;
    if (!groupId) {
      throw new Error(`O vinculo "${constraint.label}" nao foi distribuido corretamente.`);
    }

    const split = constraint.participantIds.some((participantId) => {
      const currentGroupId = detail.groups.find((group) => group.participants.some((participant) => participant.id === participantId))?.id;
      return currentGroupId !== groupId;
    });

    if (split) {
      throw new Error(`O vinculo "${constraint.label}" foi separado entre grupos.`);
    }
  }

  for (const group of detail.groups) {
    if (!detail.outing.allowGroupsWithoutCar && !group.driverParticipantId) {
      throw new Error(`O ${group.name} esta sem motorista.`);
    }

    if (group.carCapacityTotal !== null && group.participants.length > group.carCapacityTotal) {
      throw new Error(`O ${group.name} excede a capacidade do carro.`);
    }
  }

  if (!isDatabaseReady()) {
    const outingIndex = localOutingEventsStore.findIndex((item) => item.id === outingEventId);
    if (outingIndex >= 0) {
      localOutingEventsStore[outingIndex] = {
        ...localOutingEventsStore[outingIndex],
        status: "confirmed",
        updatedAt: new Date().toISOString(),
      };
    }
    return buildLocalOutingDetail(localOutingEventsStore[outingIndex]);
  }

  const db = ensureDb();
  await db.query("update outing_events set status = 'confirmed' where id = $1", [outingEventId]);
  return getOutingDetail(outingEventId, scope);
}

export async function completeOuting(outingEventId: string, completedByTenantUserId: string, scope?: DataScope): Promise<OutingEvent> {
  const detail = await getOutingDetail(outingEventId, scope);
  if (detail.outing.completedAt) return detail.outing;
  if (detail.outing.status !== "confirmed") throw new Error("Apenas uma saida confirmada pode ser concluida.");
  if (!isDatabaseReady()) {
    const index = localOutingEventsStore.findIndex((item) => item.id === outingEventId);
    const completed = { ...detail.outing, completedAt: new Date().toISOString(), completedByTenantUserId, updatedAt: new Date().toISOString() };
    localOutingEventsStore[index] = completed;
    return completed;
  }
  const db = ensureDb();
  await db.query(
    `update outing_events set completed_at = coalesce(completed_at, now()), completed_by_tenant_user_id = coalesce(completed_by_tenant_user_id, $2) where id = $1`,
    [outingEventId, completedByTenantUserId],
  );
  return (await getOutingDetail(outingEventId, scope)).outing;
}

export async function reopenOuting(outingEventId: string, scope?: DataScope): Promise<OutingEvent> {
  const detail = await getOutingDetail(outingEventId, scope);
  if (!detail.outing.completedAt) return detail.outing;
  if (!isDatabaseReady()) {
    const index = localOutingEventsStore.findIndex((item) => item.id === outingEventId);
    const reopened = { ...detail.outing, completedAt: null, completedByTenantUserId: null, updatedAt: new Date().toISOString() };
    localOutingEventsStore[index] = reopened;
    return reopened;
  }
  const db = ensureDb();
  await db.query("update outing_events set completed_at = null, completed_by_tenant_user_id = null where id = $1", [outingEventId]);
  return (await getOutingDetail(outingEventId, scope)).outing;
}
