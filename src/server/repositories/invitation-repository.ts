import { getDbPool, isDatabaseConfigured } from "@/lib/db";
import type {
  AcceptCaregiverInvitationInput,
  CaregiverInvitation,
  CreateCaregiverInvitationInput,
} from "@/server/domain/mvp";
import { createAppUser, findAppUserByEmail } from "@/server/repositories/auth-repository";
import { generateInvitationToken } from "@/server/security/password";

type InvitationRow = {
  id: string;
  tenant_id: string;
  created_by_tenant_user_id: string | null;
  accepted_app_user_id: string | null;
  role: "coordinator" | "caregiver";
  email: string | null;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

const localInvitations = new Map<string, CaregiverInvitation>();

function buildInviteUrl(token: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "";

  const path = `/convite/${token}`;
  if (!baseUrl) {
    return path;
  }

  const normalizedBase = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  return `${normalizedBase}${path}`;
}

function mapInvitation(row: InvitationRow): CaregiverInvitation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    role: row.role,
    email: row.email,
    token: row.token,
    status: row.status,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    inviteUrl: buildInviteUrl(row.token),
    createdAt: row.created_at,
  };
}

function ensureDb() {
  const db = getDbPool();
  if (!db || !isDatabaseConfigured()) {
    throw new Error("Banco nao configurado para convites.");
  }
  return db;
}

function assertInvitationIsUsable(invitation: CaregiverInvitation) {
  if (invitation.status !== "pending") {
    throw new Error("Este convite nao esta mais disponivel.");
  }

  const expiresAt = new Date(invitation.expiresAt);
  if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
    throw new Error("Este convite expirou.");
  }
}

export async function listCaregiverInvitations(tenantId?: string) {
  if (!isDatabaseConfigured()) {
    const invitations = Array.from(localInvitations.values());
    return tenantId ? invitations.filter((invitation) => invitation.tenantId === tenantId) : invitations;
  }

  const db = ensureDb();
  const values: string[] = [];
  let where = "";
  if (tenantId) {
    values.push(tenantId);
    where = "where tenant_id = $1";
  }

  const result = await db.query<InvitationRow>(
    `select * from caregiver_invitations ${where} order by created_at desc`,
    values
  );

  return result.rows.map(mapInvitation);
}

export async function createCaregiverInvitation(input: CreateCaregiverInvitationInput) {
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 7));

  if (!isDatabaseConfigured()) {
    const invitation: CaregiverInvitation = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      role: "caregiver",
      email: input.email ?? null,
      token,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      acceptedAt: null,
      inviteUrl: buildInviteUrl(token),
      createdAt: new Date().toISOString(),
    };
    localInvitations.set(token, invitation);
    return invitation;
  }

  const db = ensureDb();
  const result = await db.query<InvitationRow>(
    `insert into caregiver_invitations
      (tenant_id, created_by_tenant_user_id, accepted_app_user_id, role, email, token, status, expires_at)
     values ($1, $2, null, 'caregiver', $3, $4, 'pending', $5)
     returning *`,
    [input.tenantId, input.createdByTenantUserId ?? null, input.email ?? null, token, expiresAt.toISOString()]
  );

  return mapInvitation(result.rows[0]);
}

export async function getCaregiverInvitationByToken(token: string) {
  if (!isDatabaseConfigured()) {
    return localInvitations.get(token) ?? null;
  }

  const db = ensureDb();
  const result = await db.query<InvitationRow>(
    `select * from caregiver_invitations where token = $1 limit 1`,
    [token]
  );

  return result.rows[0] ? mapInvitation(result.rows[0]) : null;
}

export async function acceptCaregiverInvitation(token: string, input: AcceptCaregiverInvitationInput) {
  const invitation = await getCaregiverInvitationByToken(token);
  if (!invitation) {
    throw new Error("Convite nao encontrado.");
  }

  assertInvitationIsUsable(invitation);

  if (invitation.email && invitation.email.toLowerCase() !== input.email.toLowerCase()) {
    throw new Error("Este convite foi emitido para outro email.");
  }

  const existingUser = await findAppUserByEmail(input.email);
  if (existingUser) {
    throw new Error("Ja existe uma conta cadastrada com este email.");
  }

  if (!isDatabaseConfigured()) {
    const appUser = await createAppUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      password: input.password,
    });

    const fullName = `${input.firstName} ${input.lastName}`.trim();
    const nextInvitation: CaregiverInvitation = {
      ...invitation,
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    };
    localInvitations.set(token, nextInvitation);

    return {
      invitation: nextInvitation,
      appUser,
      tenantUserId: crypto.randomUUID(),
      caregiverName: fullName,
    };
  }

  const db = ensureDb();
  const client = await db.connect();

  try {
    await client.query("begin");

    const appUser = await createAppUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      password: input.password,
    }, client);

    const fullName = `${input.firstName} ${input.lastName}`.trim();

    const tenantUserResult = await client.query<{ id: string }>(
      `insert into tenant_users (tenant_id, auth_user_id, app_user_id, name, email, role, active)
       values ($1, $2, $3, $4, $5, 'caregiver', true)
       returning id`,
      [invitation.tenantId, appUser.id, appUser.id, fullName, appUser.email]
    );

    const tenantUserId = tenantUserResult.rows[0]?.id;

    await client.query(
      `insert into caregivers (tenant_id, tenant_user_id, name, phone, email, active, notes)
       values ($1, $2, $3, $4, $5, true, '')`,
      [invitation.tenantId, tenantUserId, fullName, input.phone, input.email]
    );

    const invitationResult = await client.query<InvitationRow>(
      `update caregiver_invitations
          set status = 'accepted',
              accepted_at = now(),
              accepted_app_user_id = $2
        where token = $1
        returning *`,
      [token, appUser.id]
    );

    await client.query("commit");

    return {
      invitation: mapInvitation(invitationResult.rows[0]),
      appUser,
      tenantUserId,
      caregiverName: fullName,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
