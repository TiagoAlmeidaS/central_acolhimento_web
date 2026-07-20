import { getDbPool, isDatabaseConfigured, isInMemoryFallbackAllowed } from "@/lib/db";
import type {
  ChurchAttendanceRecord,
  ChurchAttendanceStatus,
  ChurchMeetingOccurrence,
  ChurchMeetingType,
  ChurchMembership,
  ChurchMembershipStatus,
  CreateChurchMeetingTypeInput,
  CreateChurchMembershipInput,
  CreateChurchOccurrenceInput,
  CreateMemberInput,
  DataScope,
  UpdateChurchMembershipInput,
} from "@/server/domain/mvp";
import { createMember, listMembers } from "@/server/repositories/mvp-repository";

type ChurchMembershipRow = {
  id: string;
  tenant_id: string;
  member_id: string;
  status: ChurchMembershipStatus;
  started_at: string | null;
  ended_at: string | null;
  notes: string;
  created_by_tenant_user_id: string | null;
  member_name: string | null;
  member_phone: string | null;
  member_city: string | null;
  caregiver_name: string | null;
  created_at: string;
  updated_at: string;
};

type ChurchMeetingTypeRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  recurrence_kind: "none" | "weekly";
  weekday: number | null;
  starts_at: string | null;
  ends_at: string | null;
  recurrence_starts_on: string | null;
  recurrence_ends_on: string | null;
  notes: string;
  created_by_tenant_user_id: string | null;
  occurrence_count?: string | null;
  created_at: string;
  updated_at: string;
};

type ChurchOccurrenceRow = {
  id: string;
  tenant_id: string;
  meeting_type_id: string;
  occurs_on: string;
  starts_at: string | null;
  ends_at: string | null;
  status: "scheduled" | "completed" | "cancelled";
  attendance_closed_at: string | null;
  attendance_closed_by_tenant_user_id: string | null;
  notes: string;
  meeting_type_name: string | null;
  meeting_type_color: string | null;
  created_at: string;
  updated_at: string;
};

type ChurchAttendanceRow = {
  id: string;
  tenant_id: string;
  occurrence_id: string;
  member_id: string;
  status: ChurchAttendanceStatus;
  notes: string;
  marked_by_tenant_user_id: string | null;
  marked_at: string | null;
  member_name: string | null;
  member_phone: string | null;
  created_at: string;
  updated_at: string;
};

const localChurchMemberships: ChurchMembership[] = [];
const localChurchMeetingTypes: ChurchMeetingType[] = [];
const localChurchOccurrences: ChurchMeetingOccurrence[] = [];
const localChurchAttendance: ChurchAttendanceRecord[] = [];

function isDatabaseReady() {
  if (!isDatabaseConfigured()) {
    if (isInMemoryFallbackAllowed()) {
      return false;
    }

    throw new Error("Banco de dados obrigatorio nao configurado para o modulo Igreja.");
  }

  return getDbPool() !== null;
}

function ensureDb() {
  const db = getDbPool();
  if (!db) {
    throw new Error("Nao foi possivel inicializar o banco para o modulo Igreja.");
  }
  return db;
}

function inScope(tenantId: string, scope?: DataScope) {
  if (scope?.tenantId && tenantId !== scope.tenantId) return false;
  if (!scope?.tenantId && scope?.tenantIds?.length && !scope.tenantIds.includes(tenantId)) return false;
  return true;
}

function appendScope(clauses: string[], values: unknown[], scope?: DataScope, alias = "tenant_id") {
  if (scope?.tenantId) {
    values.push(scope.tenantId);
    clauses.push(`${alias} = $${values.length}`);
  } else if (scope?.tenantIds?.length) {
    values.push(scope.tenantIds);
    clauses.push(`${alias} = ANY($${values.length})`);
  }
}

function dateOnly(value: string | Date | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function timeOnly(value: string | Date | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(11, 16);
  return String(value).slice(0, 5);
}

function mapMembership(row: ChurchMembershipRow): ChurchMembership {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    memberId: row.member_id,
    status: row.status,
    startedAt: dateOnly(row.started_at),
    endedAt: dateOnly(row.ended_at),
    notes: row.notes,
    createdByTenantUserId: row.created_by_tenant_user_id,
    memberName: row.member_name,
    memberPhone: row.member_phone,
    memberCity: row.member_city,
    caregiverName: row.caregiver_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMeetingType(row: ChurchMeetingTypeRow): ChurchMeetingType {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    color: row.color,
    active: row.active,
    recurrenceKind: row.recurrence_kind,
    weekday: row.weekday === null ? null : Number(row.weekday),
    startsAt: timeOnly(row.starts_at),
    endsAt: timeOnly(row.ends_at),
    recurrenceStartsOn: dateOnly(row.recurrence_starts_on),
    recurrenceEndsOn: dateOnly(row.recurrence_ends_on),
    notes: row.notes,
    createdByTenantUserId: row.created_by_tenant_user_id,
    occurrenceCount: row.occurrence_count ? Number(row.occurrence_count) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOccurrence(row: ChurchOccurrenceRow): ChurchMeetingOccurrence {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    meetingTypeId: row.meeting_type_id,
    occursOn: dateOnly(row.occurs_on) ?? row.occurs_on,
    startsAt: timeOnly(row.starts_at),
    endsAt: timeOnly(row.ends_at),
    status: row.status,
    attendanceClosedAt: row.attendance_closed_at,
    attendanceClosedByTenantUserId: row.attendance_closed_by_tenant_user_id,
    notes: row.notes,
    meetingTypeName: row.meeting_type_name,
    meetingTypeColor: row.meeting_type_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAttendance(row: ChurchAttendanceRow): ChurchAttendanceRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    occurrenceId: row.occurrence_id,
    memberId: row.member_id,
    status: row.status,
    notes: row.notes,
    markedByTenantUserId: row.marked_by_tenant_user_id,
    markedAt: row.marked_at,
    memberName: row.member_name,
    memberPhone: row.member_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function attendanceTotals(records: ChurchAttendanceRecord[]) {
  return records.reduce<Record<ChurchAttendanceStatus, number>>(
    (acc, record) => {
      acc[record.status] += 1;
      return acc;
    },
    { unmarked: 0, present: 0, absent: 0, justified: 0 },
  );
}

export async function listChurchMemberships(scope?: DataScope): Promise<ChurchMembership[]> {
  if (!isDatabaseReady()) {
    const members = await listMembers(scope);
    const memberMap = new Map(members.map((member) => [member.id, member]));
    return localChurchMemberships
      .filter((item) => inScope(item.tenantId, scope))
      .map((item) => {
        const member = memberMap.get(item.memberId);
        return {
          ...item,
          memberName: member?.name ?? item.memberName ?? null,
          memberPhone: member?.phone ?? item.memberPhone ?? null,
          memberCity: member?.city ?? item.memberCity ?? null,
          caregiverName: member?.caregiver ?? item.caregiverName ?? null,
        };
      })
      .sort((a, b) => (a.memberName ?? "").localeCompare(b.memberName ?? ""));
  }

  const values: unknown[] = [];
  const clauses: string[] = [];
  appendScope(clauses, values, scope, "cm.tenant_id");
  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const result = await ensureDb().query<ChurchMembershipRow>(
    `select cm.*, m.name as member_name, m.phone as member_phone, m.city as member_city, c.name as caregiver_name
       from church_memberships cm
       join members m on m.id = cm.member_id and m.tenant_id = cm.tenant_id
       left join caregivers c on c.id = m.caregiver_id
       ${where}
      order by m.name`,
    values,
  );
  return result.rows.map(mapMembership);
}

export async function createChurchMembership(input: CreateChurchMembershipInput): Promise<ChurchMembership> {
  if (!isDatabaseReady()) {
    const member = (await listMembers({ tenantId: input.tenantId })).find((item) => item.id === input.memberId);
    if (!member) throw new Error("Membro nao encontrado nesta localidade.");
    const existing = localChurchMemberships.find((item) => item.tenantId === input.tenantId && item.memberId === input.memberId);
    if (existing) throw new Error("Este membro ja esta vinculado a Igreja.");
    const membership: ChurchMembership = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      memberId: input.memberId,
      status: "active",
      startedAt: input.startedAt ?? null,
      endedAt: null,
      notes: input.notes ?? "",
      createdByTenantUserId: input.createdByTenantUserId ?? null,
      memberName: member.name,
      memberPhone: member.phone,
      memberCity: member.city,
      caregiverName: member.caregiver ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localChurchMemberships.push(membership);
    return membership;
  }

  const result = await ensureDb().query<ChurchMembershipRow>(
    `insert into church_memberships (tenant_id, member_id, started_at, notes, created_by_tenant_user_id)
     select $1, m.id, $3, $4, $5
       from members m
      where m.id = $2 and m.tenant_id = $1
     returning *, null::text as member_name, null::text as member_phone, null::text as member_city, null::text as caregiver_name`,
    [input.tenantId, input.memberId, input.startedAt ?? null, input.notes ?? "", input.createdByTenantUserId ?? null],
  );
  if (!result.rows[0]) throw new Error("Membro nao encontrado nesta localidade.");
  return (await listChurchMemberships({ tenantId: input.tenantId })).find((item) => item.id === result.rows[0].id) ?? mapMembership(result.rows[0]);
}

export async function registerChurchMember(input: CreateMemberInput & { createdByTenantUserId?: string | null; churchStartedAt?: string | null; churchNotes?: string }): Promise<ChurchMembership> {
  if (!isDatabaseReady()) {
    const member = await createMember(input);
    return createChurchMembership({
      tenantId: member.tenantId,
      memberId: member.id,
      startedAt: input.churchStartedAt ?? null,
      notes: input.churchNotes ?? "",
      createdByTenantUserId: input.createdByTenantUserId ?? null,
    });
  }

  const db = ensureDb();
  const client = await db.connect();
  try {
    await client.query("begin");
    const memberResult = await client.query<{ id: string }>(
      `insert into members
         (tenant_id, caregiver_id, seed_id, name, age, phone, address, postal_code, street, neighborhood, address_number, state, city, birth_date, status, notes, latitude, longitude, is_urgent)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       returning id`,
      [
        input.tenantId,
        input.caregiverId ?? null,
        input.seedId ?? null,
        input.name,
        input.age ?? null,
        input.phone ?? "",
        input.address ?? "",
        input.postalCode ?? "",
        input.street ?? "",
        input.neighborhood ?? "",
        input.addressNumber ?? "",
        input.state ?? "",
        input.city ?? "",
        input.birthDate ?? null,
        input.status ?? "new",
        input.notes ?? "",
        input.latitude ?? null,
        input.longitude ?? null,
        input.isUrgent ?? false,
      ],
    );
    const memberId = memberResult.rows[0].id;
    const membershipResult = await client.query<{ id: string }>(
      `insert into church_memberships (tenant_id, member_id, started_at, notes, created_by_tenant_user_id)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [input.tenantId, memberId, input.churchStartedAt ?? null, input.churchNotes ?? "", input.createdByTenantUserId ?? null],
    );
    await client.query("commit");
    return (await listChurchMemberships({ tenantId: input.tenantId })).find((item) => item.id === membershipResult.rows[0].id) as ChurchMembership;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateChurchMembership(id: string, input: UpdateChurchMembershipInput, scope?: DataScope): Promise<ChurchMembership> {
  if (!isDatabaseReady()) {
    const item = localChurchMemberships.find((membership) => membership.id === id && inScope(membership.tenantId, scope));
    if (!item) throw new Error("Vinculo nao encontrado.");
    Object.assign(item, {
      status: input.status ?? item.status,
      startedAt: input.startedAt !== undefined ? input.startedAt : item.startedAt,
      endedAt: input.endedAt !== undefined ? input.endedAt : item.endedAt,
      notes: input.notes !== undefined ? input.notes : item.notes,
      updatedAt: new Date().toISOString(),
    });
    return item;
  }

  const values: unknown[] = [id, input.status ?? null, input.startedAt ?? null, input.endedAt ?? null, input.notes ?? null];
  const clauses = ["id = $1"];
  appendScope(clauses, values, scope);
  const result = await ensureDb().query<ChurchMembershipRow>(
    `update church_memberships
        set status = coalesce($2::church_membership_status, status),
            started_at = coalesce($3::date, started_at),
            ended_at = $4::date,
            notes = coalesce($5::text, notes)
      where ${clauses.join(" and ")}
      returning *, null::text as member_name, null::text as member_phone, null::text as member_city, null::text as caregiver_name`,
    values,
  );
  if (!result.rows[0]) throw new Error("Vinculo nao encontrado.");
  return mapMembership(result.rows[0]);
}

export async function listChurchMeetingTypes(scope?: DataScope): Promise<ChurchMeetingType[]> {
  if (!isDatabaseReady()) {
    return localChurchMeetingTypes
      .filter((item) => inScope(item.tenantId, scope))
      .map((item) => ({ ...item, occurrenceCount: localChurchOccurrences.filter((occurrence) => occurrence.meetingTypeId === item.id).length }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const values: unknown[] = [];
  const clauses: string[] = [];
  appendScope(clauses, values, scope, "cmt.tenant_id");
  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const result = await ensureDb().query<ChurchMeetingTypeRow>(
    `select cmt.*, count(cmo.id)::text as occurrence_count
       from church_meeting_types cmt
       left join church_meeting_occurrences cmo on cmo.meeting_type_id = cmt.id
       ${where}
      group by cmt.id
      order by cmt.name`,
    values,
  );
  return result.rows.map(mapMeetingType);
}

export async function createChurchMeetingType(input: CreateChurchMeetingTypeInput): Promise<ChurchMeetingType> {
  validateMeetingType(input);
  if (!isDatabaseReady()) {
    if (localChurchMeetingTypes.some((item) => item.tenantId === input.tenantId && item.active && item.name.toLowerCase() === input.name.toLowerCase())) {
      throw new Error("Ja existe um tipo ativo com este nome.");
    }
    const item: ChurchMeetingType = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      name: input.name,
      description: input.description ?? "",
      color: input.color ?? "#2D7FF9",
      active: input.active ?? true,
      recurrenceKind: input.recurrenceKind ?? "none",
      weekday: input.weekday ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      recurrenceStartsOn: input.recurrenceStartsOn ?? null,
      recurrenceEndsOn: input.recurrenceEndsOn ?? null,
      notes: input.notes ?? "",
      createdByTenantUserId: input.createdByTenantUserId ?? null,
      occurrenceCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localChurchMeetingTypes.push(item);
    return item;
  }

  const result = await ensureDb().query<ChurchMeetingTypeRow>(
    `insert into church_meeting_types
       (tenant_id, name, description, color, active, recurrence_kind, weekday, starts_at, ends_at, recurrence_starts_on, recurrence_ends_on, notes, created_by_tenant_user_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     returning *, '0'::text as occurrence_count`,
    [
      input.tenantId,
      input.name,
      input.description ?? "",
      input.color ?? "#2D7FF9",
      input.active ?? true,
      input.recurrenceKind ?? "none",
      input.weekday ?? null,
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.recurrenceStartsOn ?? null,
      input.recurrenceEndsOn ?? null,
      input.notes ?? "",
      input.createdByTenantUserId ?? null,
    ],
  );
  return mapMeetingType(result.rows[0]);
}

function validateMeetingType(input: CreateChurchMeetingTypeInput) {
  if (!input.name.trim()) throw new Error("Nome da reuniao e obrigatorio.");
  if ((input.recurrenceKind ?? "none") === "weekly" && (input.weekday === null || input.weekday === undefined)) {
    throw new Error("Dia da semana e obrigatorio para recorrencia semanal.");
  }
  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
    throw new Error("Horario final deve ser posterior ao inicial.");
  }
}

export async function createChurchOccurrence(input: CreateChurchOccurrenceInput): Promise<ChurchMeetingOccurrence> {
  const type = (await listChurchMeetingTypes({ tenantId: input.tenantId })).find((item) => item.id === input.meetingTypeId);
  if (!type) throw new Error("Tipo de reuniao nao encontrado.");

  if (!isDatabaseReady()) {
    const existing = localChurchOccurrences.find((item) => item.meetingTypeId === input.meetingTypeId && item.occursOn === input.occursOn);
    if (existing) return existing;
    const occurrence: ChurchMeetingOccurrence = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      meetingTypeId: input.meetingTypeId,
      occursOn: input.occursOn,
      startsAt: input.startsAt ?? type.startsAt,
      endsAt: input.endsAt ?? type.endsAt,
      status: "scheduled",
      attendanceClosedAt: null,
      attendanceClosedByTenantUserId: null,
      notes: input.notes ?? "",
      meetingTypeName: type.name,
      meetingTypeColor: type.color,
      attendanceTotals: { unmarked: 0, present: 0, absent: 0, justified: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localChurchOccurrences.push(occurrence);
    return occurrence;
  }

  const result = await ensureDb().query<ChurchOccurrenceRow>(
    `insert into church_meeting_occurrences (tenant_id, meeting_type_id, occurs_on, starts_at, ends_at, notes)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (meeting_type_id, occurs_on) do update set notes = church_meeting_occurrences.notes
     returning *, null::text as meeting_type_name, null::text as meeting_type_color`,
    [input.tenantId, input.meetingTypeId, input.occursOn, input.startsAt ?? type.startsAt, input.endsAt ?? type.endsAt, input.notes ?? ""],
  );
  return mapOccurrence({ ...result.rows[0], meeting_type_name: type.name, meeting_type_color: type.color });
}

export async function generateChurchOccurrences(meetingTypeId: string, scope?: DataScope, weeks = 8): Promise<ChurchMeetingOccurrence[]> {
  const type = (await listChurchMeetingTypes(scope)).find((item) => item.id === meetingTypeId);
  if (!type) throw new Error("Tipo de reuniao nao encontrado.");
  if (type.recurrenceKind !== "weekly" || type.weekday === null) throw new Error("Este tipo nao possui recorrencia semanal.");

  const dates: string[] = [];
  const start = new Date(`${type.recurrenceStartsOn ?? new Date().toISOString().slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) start.setTime(today.getTime());
  while (start.getDay() !== type.weekday) start.setDate(start.getDate() + 1);

  const endLimit = new Date(start);
  endLimit.setDate(endLimit.getDate() + weeks * 7);
  const recurrenceEnd = type.recurrenceEndsOn ? new Date(`${type.recurrenceEndsOn}T00:00:00`) : null;
  for (const cursor = new Date(start); cursor < endLimit; cursor.setDate(cursor.getDate() + 7)) {
    if (recurrenceEnd && cursor > recurrenceEnd) break;
    dates.push(cursor.toISOString().slice(0, 10));
  }

  const created: ChurchMeetingOccurrence[] = [];
  for (const occursOn of dates) {
    created.push(await createChurchOccurrence({ tenantId: type.tenantId, meetingTypeId: type.id, occursOn }));
  }
  return created;
}

export async function listChurchOccurrences(scope?: DataScope): Promise<ChurchMeetingOccurrence[]> {
  if (!isDatabaseReady()) {
    return localChurchOccurrences
      .filter((item) => inScope(item.tenantId, scope))
      .map((item) => ({ ...item, attendanceTotals: attendanceTotals(localChurchAttendance.filter((record) => record.occurrenceId === item.id)) }))
      .sort((a, b) => a.occursOn.localeCompare(b.occursOn));
  }

  const values: unknown[] = [];
  const clauses: string[] = [];
  appendScope(clauses, values, scope, "cmo.tenant_id");
  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const result = await ensureDb().query<ChurchOccurrenceRow>(
    `select cmo.*, cmt.name as meeting_type_name, cmt.color as meeting_type_color
       from church_meeting_occurrences cmo
       join church_meeting_types cmt on cmt.id = cmo.meeting_type_id
       ${where}
      order by cmo.occurs_on desc, cmo.starts_at nulls last`,
    values,
  );
  const occurrences = result.rows.map(mapOccurrence);
  const records = await listChurchAttendanceByOccurrenceIds(occurrences.map((item) => item.id));
  return occurrences.map((item) => ({ ...item, attendanceTotals: attendanceTotals(records.filter((record) => record.occurrenceId === item.id)) }));
}

async function listChurchAttendanceByOccurrenceIds(ids: string[]) {
  if (ids.length === 0) return [];
  if (!isDatabaseReady()) return localChurchAttendance.filter((item) => ids.includes(item.occurrenceId));
  const result = await ensureDb().query<ChurchAttendanceRow>(
    `select car.*, m.name as member_name, m.phone as member_phone
       from church_attendance_records car
       join members m on m.id = car.member_id
      where car.occurrence_id = ANY($1)
      order by m.name`,
    [ids],
  );
  return result.rows.map(mapAttendance);
}

export async function prepareChurchAttendance(occurrenceId: string, scope?: DataScope): Promise<ChurchAttendanceRecord[]> {
  const occurrence = (await listChurchOccurrences(scope)).find((item) => item.id === occurrenceId);
  if (!occurrence) throw new Error("Ocorrencia nao encontrada.");
  if (occurrence.status === "cancelled") throw new Error("Ocorrencia cancelada nao possui chamada.");

  const memberships = (await listChurchMemberships({ tenantId: occurrence.tenantId })).filter((membership) => {
    if (membership.status !== "active") return false;
    if (membership.startedAt && membership.startedAt > occurrence.occursOn) return false;
    if (membership.endedAt && membership.endedAt < occurrence.occursOn) return false;
    return true;
  });

  if (!isDatabaseReady()) {
    for (const membership of memberships) {
      if (localChurchAttendance.some((record) => record.occurrenceId === occurrenceId && record.memberId === membership.memberId)) continue;
      localChurchAttendance.push({
        id: crypto.randomUUID(),
        tenantId: occurrence.tenantId,
        occurrenceId,
        memberId: membership.memberId,
        status: "unmarked",
        notes: "",
        markedByTenantUserId: null,
        markedAt: null,
        memberName: membership.memberName,
        memberPhone: membership.memberPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return localChurchAttendance
      .filter((record) => record.occurrenceId === occurrenceId)
      .sort((a, b) => (a.memberName ?? "").localeCompare(b.memberName ?? ""));
  }

  const db = ensureDb();
  await db.query(
    `insert into church_attendance_records (tenant_id, occurrence_id, member_id)
     select $1, $2, cm.member_id
       from church_memberships cm
      where cm.tenant_id = $1
        and cm.status = 'active'
        and (cm.started_at is null or cm.started_at <= $3)
        and (cm.ended_at is null or cm.ended_at >= $3)
     on conflict (occurrence_id, member_id) do nothing`,
    [occurrence.tenantId, occurrence.id, occurrence.occursOn],
  );
  return listChurchAttendance(occurrenceId, scope);
}

export async function listChurchAttendance(occurrenceId: string, scope?: DataScope): Promise<ChurchAttendanceRecord[]> {
  if (!isDatabaseReady()) {
    const occurrence = localChurchOccurrences.find((item) => item.id === occurrenceId && inScope(item.tenantId, scope));
    if (!occurrence) throw new Error("Ocorrencia nao encontrada.");
    return localChurchAttendance.filter((record) => record.occurrenceId === occurrenceId).sort((a, b) => (a.memberName ?? "").localeCompare(b.memberName ?? ""));
  }

  const values: unknown[] = [occurrenceId];
  const clauses = ["car.occurrence_id = $1"];
  appendScope(clauses, values, scope, "car.tenant_id");
  const result = await ensureDb().query<ChurchAttendanceRow>(
    `select car.*, m.name as member_name, m.phone as member_phone
       from church_attendance_records car
       join members m on m.id = car.member_id
      where ${clauses.join(" and ")}
      order by m.name`,
    values,
  );
  return result.rows.map(mapAttendance);
}

export async function markChurchAttendance(
  occurrenceId: string,
  memberId: string,
  status: ChurchAttendanceStatus,
  notes: string,
  markedByTenantUserId: string | null,
  scope?: DataScope,
): Promise<ChurchAttendanceRecord> {
  if (!["unmarked", "present", "absent", "justified"].includes(status)) {
    throw new Error("Status de presenca invalido.");
  }

  await prepareChurchAttendance(occurrenceId, scope);

  if (!isDatabaseReady()) {
    const record = localChurchAttendance.find((item) => item.occurrenceId === occurrenceId && item.memberId === memberId && inScope(item.tenantId, scope));
    if (!record) throw new Error("Registro de presenca nao encontrado.");
    record.status = status;
    record.notes = notes;
    record.markedByTenantUserId = status === "unmarked" ? null : markedByTenantUserId;
    record.markedAt = status === "unmarked" ? null : new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    return record;
  }

  const values: unknown[] = [
    occurrenceId,
    memberId,
    status,
    notes,
    status === "unmarked" ? null : markedByTenantUserId,
    status === "unmarked" ? null : new Date().toISOString(),
  ];
  const clauses = ["occurrence_id = $1", "member_id = $2"];
  appendScope(clauses, values, scope);
  const result = await ensureDb().query<ChurchAttendanceRow>(
    `update church_attendance_records
        set status = $3,
            notes = $4,
            marked_by_tenant_user_id = $5,
            marked_at = $6
      where ${clauses.join(" and ")}
      returning *, null::text as member_name, null::text as member_phone`,
    values,
  );
  if (!result.rows[0]) throw new Error("Registro de presenca nao encontrado.");
  return mapAttendance(result.rows[0]);
}

export async function closeChurchAttendance(occurrenceId: string, closedByTenantUserId: string | null, scope?: DataScope): Promise<ChurchMeetingOccurrence> {
  const records = await prepareChurchAttendance(occurrenceId, scope);
  if (records.some((record) => record.status === "unmarked")) {
    throw new Error("Ainda ha pessoas sem marcacao na chamada.");
  }

  if (!isDatabaseReady()) {
    const occurrence = localChurchOccurrences.find((item) => item.id === occurrenceId && inScope(item.tenantId, scope));
    if (!occurrence) throw new Error("Ocorrencia nao encontrada.");
    occurrence.status = "completed";
    occurrence.attendanceClosedAt = new Date().toISOString();
    occurrence.attendanceClosedByTenantUserId = closedByTenantUserId;
    return occurrence;
  }

  const values: unknown[] = [occurrenceId, closedByTenantUserId];
  const clauses = ["id = $1"];
  appendScope(clauses, values, scope);
  const result = await ensureDb().query<ChurchOccurrenceRow>(
    `update church_meeting_occurrences
        set status = 'completed',
            attendance_closed_at = now(),
            attendance_closed_by_tenant_user_id = $2
      where ${clauses.join(" and ")}
      returning *, null::text as meeting_type_name, null::text as meeting_type_color`,
    values,
  );
  if (!result.rows[0]) throw new Error("Ocorrencia nao encontrada.");
  return mapOccurrence(result.rows[0]);
}
