import { assertDatabaseConfigured, getDbPool, isDatabaseConfigured, isInMemoryFallbackAllowed } from "@/lib/db";
import type {
  CaregiverSignupChannel,
  CaregiverSignupChannelUse,
  CreateCaregiverSignupChannelInput,
  RegisterCaregiverSignupChannelInput,
} from "@/server/domain/mvp";
import {
  appendLocalUserMembership,
  createAppUser,
  findAppUserByEmail,
} from "@/server/repositories/auth-repository";
import { createCaregiver, listTenants } from "@/server/repositories/mvp-repository";
import { generateInvitationToken, hashPassword } from "@/server/security/password";

type SignupChannelRow = {
  id: string;
  tenant_id: string;
  created_by_tenant_user_id: string | null;
  role: "coordinator" | "caregiver";
  name: string;
  token: string;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  require_approval: boolean;
  allowed_email_domain: string | null;
  created_at: string;
  tenant_name?: string | null;
  tenant_city?: string | null;
  tenant_state?: string | null;
};

type SignupChannelUseRow = {
  id: string;
  channel_id: string;
  tenant_id: string;
  app_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password_hash: string | null;
  status: "submitted" | "approved" | "rejected";
  approved_at: string | null;
  approved_by_tenant_user_id: string | null;
  created_at: string;
};

type LocalSignupChannelUseRecord = CaregiverSignupChannelUse & {
  passwordHash: string | null;
};

const localSignupChannels = new Map<string, CaregiverSignupChannel>();
const localSignupChannelUses = new Map<string, LocalSignupChannelUseRecord>();

function buildSignupUrl(token: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "";

  const path = `/cadastro/cuidador/${token}`;
  if (!baseUrl) {
    return path;
  }

  const normalizedBase = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  return `${normalizedBase}${path}`;
}

function normalizeEmailDomain(value: string | null | undefined) {
  if (!value) return null;
  return value.trim().toLowerCase().replace(/^@+/, "") || null;
}

function assertAllowedEmailDomain(email: string, allowedEmailDomain: string | null) {
  const normalizedAllowed = normalizeEmailDomain(allowedEmailDomain);
  if (!normalizedAllowed) {
    return;
  }

  const [, domain = ""] = email.toLowerCase().split("@");
  if (domain !== normalizedAllowed) {
    throw new Error(`Este canal aceita apenas e-mails do dominio ${normalizedAllowed}.`);
  }
}

function mapSignupChannel(row: SignupChannelRow): CaregiverSignupChannel {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    role: row.role,
    name: row.name,
    token: row.token,
    active: row.active,
    expiresAt: row.expires_at,
    maxUses: row.max_uses !== null ? Number(row.max_uses) : null,
    usesCount: Number(row.uses_count ?? 0),
    requireApproval: !!row.require_approval,
    allowedEmailDomain: row.allowed_email_domain,
    signupUrl: buildSignupUrl(row.token),
    tenantName: row.tenant_name ?? null,
    tenantCity: row.tenant_city ?? null,
    tenantState: row.tenant_state ?? null,
    createdAt: row.created_at,
  };
}

function mapSignupChannelUse(row: SignupChannelUseRow): CaregiverSignupChannelUse {
  return {
    id: row.id,
    channelId: row.channel_id,
    tenantId: row.tenant_id,
    appUserId: row.app_user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    approvedAt: row.approved_at,
    approvedByTenantUserId: row.approved_by_tenant_user_id,
    createdAt: row.created_at,
  };
}

function ensureDb() {
  assertDatabaseConfigured("canais globais de cadastro");
  const db = getDbPool();
  if (!db) {
    throw new Error("Nao foi possivel inicializar o pool do banco para canais globais de cadastro.");
  }
  return db;
}

function assertSignupChannelUsable(channel: CaregiverSignupChannel) {
  if (!channel.active) {
    throw new Error("Este canal de cadastro esta inativo.");
  }

  if (channel.expiresAt) {
    const expiresAt = new Date(channel.expiresAt);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
      throw new Error("Este canal de cadastro expirou.");
    }
  }

  if (channel.maxUses !== null && channel.usesCount >= channel.maxUses) {
    throw new Error("Este canal atingiu o limite de cadastros.");
  }
}

function findLocalChannelById(channelId: string) {
  return Array.from(localSignupChannels.values()).find((channel) => channel.id === channelId) ?? null;
}

function findLocalPendingUseByEmail(tenantId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return Array.from(localSignupChannelUses.values()).find(
    (item) => item.tenantId === tenantId && item.email.toLowerCase() === normalizedEmail && item.status === "submitted"
  );
}

async function enrichLocalChannels(channels: CaregiverSignupChannel[]) {
  const tenants = await listTenants();
  const tenantMap = new Map(tenants.map((tenant) => [tenant.id, tenant]));

  return channels.map((channel) => {
    const tenant = tenantMap.get(channel.tenantId);
    return {
      ...channel,
      tenantName: tenant?.name ?? channel.tenantName ?? null,
      tenantCity: tenant?.city ?? channel.tenantCity ?? null,
      tenantState: tenant?.state ?? channel.tenantState ?? null,
    };
  });
}

export async function listCaregiverSignupChannels(tenantId?: string) {
  if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
    const channels = Array.from(localSignupChannels.values())
      .filter((channel) => !tenantId || channel.tenantId === tenantId)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return enrichLocalChannels(channels);
  }

  const db = ensureDb();
  const values: string[] = [];
  let where = "";
  if (tenantId) {
    values.push(tenantId);
    where = "where sc.tenant_id = $1";
  }

  const result = await db.query<SignupChannelRow>(
    `select
        sc.*,
        t.name as tenant_name,
        t.city as tenant_city,
        t.state as tenant_state
      from caregiver_signup_channels sc
      inner join tenants t on t.id = sc.tenant_id
      ${where}
      order by sc.created_at desc`,
    values
  );

  return result.rows.map(mapSignupChannel);
}

export async function getCaregiverSignupChannelByToken(token: string) {
  if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
    const channel = localSignupChannels.get(token) ?? null;
    if (!channel) return null;
    const [enriched] = await enrichLocalChannels([channel]);
    return enriched ?? null;
  }

  const db = ensureDb();
  const result = await db.query<SignupChannelRow>(
    `select
        sc.*,
        t.name as tenant_name,
        t.city as tenant_city,
        t.state as tenant_state
      from caregiver_signup_channels sc
      inner join tenants t on t.id = sc.tenant_id
      where sc.token = $1
      limit 1`,
    [token]
  );

  return result.rows[0] ? mapSignupChannel(result.rows[0]) : null;
}

export async function getCaregiverSignupChannelById(channelId: string) {
  if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
    const channel = findLocalChannelById(channelId);
    if (!channel) return null;
    const [enriched] = await enrichLocalChannels([channel]);
    return enriched ?? null;
  }

  const db = ensureDb();
  const result = await db.query<SignupChannelRow>(
    `select
        sc.*,
        t.name as tenant_name,
        t.city as tenant_city,
        t.state as tenant_state
      from caregiver_signup_channels sc
      inner join tenants t on t.id = sc.tenant_id
      where sc.id = $1
      limit 1`,
    [channelId]
  );

  return result.rows[0] ? mapSignupChannel(result.rows[0]) : null;
}

export async function createCaregiverSignupChannel(input: CreateCaregiverSignupChannelInput) {
  const token = generateInvitationToken();
  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const channel: CaregiverSignupChannel = {
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    role: input.role ?? "caregiver",
    name: input.name,
    token,
    active: true,
    expiresAt,
    maxUses: input.maxUses ?? null,
    usesCount: 0,
    requireApproval: input.requireApproval ?? true,
    allowedEmailDomain: normalizeEmailDomain(input.allowedEmailDomain),
    signupUrl: buildSignupUrl(token),
    createdAt: new Date().toISOString(),
  };

  if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
    localSignupChannels.set(token, channel);
    const [enriched] = await enrichLocalChannels([channel]);
    return enriched;
  }

  const db = ensureDb();
  const result = await db.query<SignupChannelRow>(
    `insert into caregiver_signup_channels
      (tenant_id, created_by_tenant_user_id, role, name, token, active, expires_at, max_uses, uses_count, require_approval, allowed_email_domain)
     values ($1, $2, $3, $4, $5, true, $6, $7, 0, $8, $9)
     returning *`,
    [
      input.tenantId,
      input.createdByTenantUserId ?? null,
      input.role ?? "caregiver",
      input.name,
      token,
      expiresAt,
      input.maxUses ?? null,
      input.requireApproval ?? true,
      normalizeEmailDomain(input.allowedEmailDomain),
    ]
  );

  const stored = mapSignupChannel(result.rows[0]);
  const tenant = (await listTenants({ tenantId: stored.tenantId }))[0];
  return {
    ...stored,
    tenantName: tenant?.name ?? null,
    tenantCity: tenant?.city ?? null,
    tenantState: tenant?.state ?? null,
  };
}

export async function listCaregiverSignupChannelUses(channelId: string) {
  if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
    return Array.from(localSignupChannelUses.values())
      .filter((item) => item.channelId === channelId)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .map(({ passwordHash: _passwordHash, ...rest }) => rest);
  }

  const db = ensureDb();
  const result = await db.query<SignupChannelUseRow>(
    `select * from caregiver_signup_channel_uses where channel_id = $1 order by created_at desc`,
    [channelId]
  );
  return result.rows.map(mapSignupChannelUse);
}

async function createTenantUserAndCaregiver(input: {
  tenantId: string;
  appUserId: string;
  role: "coordinator" | "caregiver";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dbOverride?: {
    query: (text: string, values?: any[]) => Promise<any>;
  };
}) {
  const fullName = `${input.firstName} ${input.lastName}`.trim();

  if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
    const tenantUserId = crypto.randomUUID();
    const caregiver = await createCaregiver({
      tenantId: input.tenantId,
      tenantUserId,
      name: fullName,
      phone: input.phone,
      email: input.email,
      active: true,
      notes: "",
    });
    const tenant = (await listTenants({ tenantId: input.tenantId }))[0];
    appendLocalUserMembership(input.email, {
      tenantUserId,
      tenantId: input.tenantId,
      tenantName: tenant?.name ?? "Central",
      tenantCity: tenant?.city ?? "",
      tenantState: tenant?.state ?? "",
      role: input.role,
      caregiverId: caregiver.id,
    });
    return { tenantUserId, caregiverId: caregiver.id };
  }

  const db = input.dbOverride ?? ensureDb();
  const tenantUserResult = (await db.query(
    `insert into tenant_users (tenant_id, auth_user_id, app_user_id, name, email, role, active)
     values ($1, $2, $3, $4, $5, $6, true)
     returning id`,
    [input.tenantId, input.appUserId, input.appUserId, fullName, input.email, input.role]
  )) as { rows: Array<{ id: string }> };

  const tenantUserId = tenantUserResult.rows[0]?.id;
  const caregiverResult = (await db.query(
    `insert into caregivers (tenant_id, tenant_user_id, name, phone, email, active, notes)
     values ($1, $2, $3, $4, $5, true, '')
     returning id`,
    [input.tenantId, tenantUserId, fullName, input.phone, input.email]
  )) as { rows: Array<{ id: string }> };

  return {
    tenantUserId,
    caregiverId: caregiverResult.rows[0]?.id ?? null,
  };
}

export async function registerCaregiverViaSignupChannel(token: string, input: RegisterCaregiverSignupChannelInput) {
  const channel = await getCaregiverSignupChannelByToken(token);
  if (!channel) {
    throw new Error("Canal de cadastro nao encontrado.");
  }

  assertSignupChannelUsable(channel);
  assertAllowedEmailDomain(input.email, channel.allowedEmailDomain);

  const existingUser = await findAppUserByEmail(input.email);
  if (existingUser) {
    throw new Error("Ja existe uma conta cadastrada com este email.");
  }

  if (channel.requireApproval) {
    if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
      if (findLocalPendingUseByEmail(channel.tenantId, input.email)) {
        throw new Error("Ja existe uma solicitacao pendente para este e-mail.");
      }

      const useRecord: LocalSignupChannelUseRecord = {
        id: crypto.randomUUID(),
        channelId: channel.id,
        tenantId: channel.tenantId,
        appUserId: null,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        status: "submitted",
        approvedAt: null,
        approvedByTenantUserId: null,
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword(input.password),
      };
      localSignupChannelUses.set(useRecord.id, useRecord);
      localSignupChannels.set(token, {
        ...channel,
        usesCount: channel.usesCount + 1,
      });

      return {
        status: "submitted" as const,
        channel: localSignupChannels.get(token)!,
        use: { ...useRecord, passwordHash: undefined } as unknown as CaregiverSignupChannelUse,
      };
    }

    const db = ensureDb();
    const pendingUse = await db.query<{ id: string }>(
      `select id from caregiver_signup_channel_uses
       where tenant_id = $1 and lower(email) = lower($2) and status = 'submitted'
       limit 1`,
      [channel.tenantId, input.email]
    );
    if (pendingUse.rows[0]) {
      throw new Error("Ja existe uma solicitacao pendente para este e-mail.");
    }

    const useResult = await db.query<SignupChannelUseRow>(
      `insert into caregiver_signup_channel_uses
         (channel_id, tenant_id, app_user_id, first_name, last_name, email, phone, password_hash, status, approved_at, approved_by_tenant_user_id)
       values ($1, $2, null, $3, $4, $5, $6, $7, 'submitted', null, null)
       returning *`,
      [channel.id, channel.tenantId, input.firstName, input.lastName, input.email, input.phone, hashPassword(input.password)]
    );
    await db.query(`update caregiver_signup_channels set uses_count = uses_count + 1 where id = $1`, [channel.id]);
    const refreshedChannel = await getCaregiverSignupChannelById(channel.id);

    return {
      status: "submitted" as const,
      channel: refreshedChannel!,
      use: mapSignupChannelUse(useResult.rows[0]),
    };
  }

  if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
    const appUser = await createAppUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      password: input.password,
      active: true,
    });
    await createTenantUserAndCaregiver({
      tenantId: channel.tenantId,
      appUserId: appUser.id,
      role: channel.role,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
    });

    const useRecord: LocalSignupChannelUseRecord = {
      id: crypto.randomUUID(),
      channelId: channel.id,
      tenantId: channel.tenantId,
      appUserId: appUser.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedByTenantUserId: null,
      createdAt: new Date().toISOString(),
      passwordHash: null,
    };
    localSignupChannelUses.set(useRecord.id, useRecord);
    localSignupChannels.set(token, {
      ...channel,
      usesCount: channel.usesCount + 1,
    });

    return {
      status: "approved" as const,
      channel: localSignupChannels.get(token)!,
      use: { ...useRecord, passwordHash: undefined } as unknown as CaregiverSignupChannelUse,
      appUser,
    };
  }

  const db = ensureDb();
  const client = await db.connect();
  try {
    await client.query("begin");
    const appUser = await createAppUser(
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        password: input.password,
        active: true,
      },
      client
    );

    await createTenantUserAndCaregiver({
      tenantId: channel.tenantId,
      appUserId: appUser.id,
      role: channel.role,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      dbOverride: client,
    });

    const useResult = await client.query<SignupChannelUseRow>(
      `insert into caregiver_signup_channel_uses
        (channel_id, tenant_id, app_user_id, first_name, last_name, email, phone, password_hash, status, approved_at, approved_by_tenant_user_id)
       values ($1, $2, $3, $4, $5, $6, $7, null, 'approved', now(), null)
       returning *`,
      [channel.id, channel.tenantId, appUser.id, input.firstName, input.lastName, input.email, input.phone]
    );

    await client.query(
      `update caregiver_signup_channels set uses_count = uses_count + 1 where id = $1`,
      [channel.id]
    );

    await client.query("commit");
    const refreshedChannel = await getCaregiverSignupChannelById(channel.id);

    return {
      status: "approved" as const,
      channel: refreshedChannel!,
      use: mapSignupChannelUse(useResult.rows[0]),
      appUser,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function toggleCaregiverSignupChannel(channelId: string) {
  const channel = await getCaregiverSignupChannelById(channelId);
  if (!channel) {
    throw new Error("Canal de cadastro nao encontrado.");
  }

  if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
    const current = findLocalChannelById(channelId);
    if (!current) throw new Error("Canal de cadastro nao encontrado.");
    const next = { ...current, active: !current.active };
    localSignupChannels.set(current.token, next);
    const [enriched] = await enrichLocalChannels([next]);
    return enriched;
  }

  const db = ensureDb();
  const result = await db.query<SignupChannelRow>(
    `update caregiver_signup_channels set active = not active where id = $1 returning *`,
    [channelId]
  );
  const stored = mapSignupChannel(result.rows[0]);
  return {
    ...stored,
    tenantName: channel.tenantName ?? null,
    tenantCity: channel.tenantCity ?? null,
    tenantState: channel.tenantState ?? null,
  };
}

export async function approveCaregiverSignupChannelUse(channelId: string, useId: string, approvedByTenantUserId: string) {
  const channel = await getCaregiverSignupChannelById(channelId);
  if (!channel) {
    throw new Error("Canal de cadastro nao encontrado.");
  }

  if (!isDatabaseConfigured() && isInMemoryFallbackAllowed()) {
    const useRecord = localSignupChannelUses.get(useId);
    if (!useRecord || useRecord.channelId !== channelId) {
      throw new Error("Solicitacao nao encontrada.");
    }
    if (useRecord.status !== "submitted" || !useRecord.passwordHash) {
      throw new Error("Solicitacao nao esta disponivel para aprovacao.");
    }
    if (await findAppUserByEmail(useRecord.email)) {
      throw new Error("Ja existe uma conta cadastrada com este email.");
    }

    const appUser = await createAppUser({
      firstName: useRecord.firstName,
      lastName: useRecord.lastName,
      email: useRecord.email,
      phone: useRecord.phone,
      passwordHash: useRecord.passwordHash,
      active: true,
    });
    await createTenantUserAndCaregiver({
      tenantId: channel.tenantId,
      appUserId: appUser.id,
      role: channel.role,
      firstName: useRecord.firstName,
      lastName: useRecord.lastName,
      email: useRecord.email,
      phone: useRecord.phone,
    });

    const nextUse: LocalSignupChannelUseRecord = {
      ...useRecord,
      appUserId: appUser.id,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedByTenantUserId,
      passwordHash: null,
    };
    localSignupChannelUses.set(useId, nextUse);
    return {
      use: { ...nextUse, passwordHash: undefined } as unknown as CaregiverSignupChannelUse,
      appUser,
    };
  }

  const db = ensureDb();
  const client = await db.connect();
  try {
    await client.query("begin");
    const useResult = await client.query<SignupChannelUseRow>(
      `select * from caregiver_signup_channel_uses where id = $1 and channel_id = $2 limit 1`,
      [useId, channelId]
    );
    const useRow = useResult.rows[0];
    if (!useRow) {
      throw new Error("Solicitacao nao encontrada.");
    }
    if (useRow.status !== "submitted" || !useRow.password_hash) {
      throw new Error("Solicitacao nao esta disponivel para aprovacao.");
    }
    if (await findAppUserByEmail(useRow.email)) {
      throw new Error("Ja existe uma conta cadastrada com este email.");
    }

    const appUser = await createAppUser(
      {
        firstName: useRow.first_name,
        lastName: useRow.last_name,
        email: useRow.email,
        phone: useRow.phone,
        passwordHash: useRow.password_hash,
        active: true,
      },
      client
    );

    await createTenantUserAndCaregiver({
      tenantId: channel.tenantId,
      appUserId: appUser.id,
      role: channel.role,
      firstName: useRow.first_name,
      lastName: useRow.last_name,
      email: useRow.email,
      phone: useRow.phone,
      dbOverride: client,
    });

    const approvalResult = await client.query<SignupChannelUseRow>(
      `update caregiver_signup_channel_uses
          set app_user_id = $2,
              status = 'approved',
              approved_at = now(),
              approved_by_tenant_user_id = $3,
              password_hash = null
        where id = $1
        returning *`,
      [useId, appUser.id, approvedByTenantUserId]
    );

    await client.query("commit");
    return {
      use: mapSignupChannelUse(approvalResult.rows[0]),
      appUser,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
