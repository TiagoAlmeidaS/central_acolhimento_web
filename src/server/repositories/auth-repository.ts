import type { Pool, PoolClient, QueryResult } from "pg";
import { getDbPool, isDatabaseConfigured } from "@/lib/db";
import { createTenant } from "@/server/repositories/mvp-repository";
import type {
  AppUser,
  AuthUser,
  LoginInput,
  LoginResult,
  UserMembership,
} from "@/server/domain/mvp";
import { hashPassword, verifyPassword } from "@/server/security/password";

type AppUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password_hash: string;
  active: boolean;
  created_at: string;
};

type MembershipRow = {
  tenant_user_id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_city: string;
  tenant_state: string;
  role: "coordinator" | "caregiver";
  caregiver_id: string | null;
};

type Queryable = Pool | PoolClient;

type LocalAuthRecord = {
  appUser: AppUserRow;
  memberships: UserMembership[];
};

function localHash(password: string) {
  return hashPassword(password);
}

function createInitialLocalAuthStore() {
  return new Map<string, LocalAuthRecord>([
    [
      "tiago@igreja.org",
      {
        appUser: {
          id: "local-app-user-tiago",
          first_name: "Tiago",
          last_name: "Almeida",
          email: "tiago@igreja.org",
          phone: "(83) 99999-0001",
          password_hash: localHash("12345678"),
          active: true,
          created_at: new Date().toISOString(),
        },
        memberships: [
          {
            tenantUserId: "local-tenant-user-tiago-sape",
            tenantId: "1",
            tenantName: "Central Sape",
            tenantCity: "Sape",
            tenantState: "PB",
            role: "coordinator",
            caregiverId: null,
          },
          {
            tenantUserId: "local-tenant-user-tiago-mari",
            tenantId: "2",
            tenantName: "Central Mari",
            tenantCity: "Mari",
            tenantState: "PB",
            role: "coordinator",
            caregiverId: null,
          },
        ],
      },
    ],
    [
      "maria@igreja.org",
      {
        appUser: {
          id: "local-app-user-maria",
          first_name: "Maria",
          last_name: "Oliveira",
          email: "maria@igreja.org",
          phone: "(83) 99999-1111",
          password_hash: localHash("12345678"),
          active: true,
          created_at: new Date().toISOString(),
        },
        memberships: [
          {
            tenantUserId: "local-tenant-user-maria-sape",
            tenantId: "1",
            tenantName: "Central Sape",
            tenantCity: "Sape",
            tenantState: "PB",
            role: "caregiver",
            caregiverId: "1",
          },
        ],
      },
    ],
    [
      "joao@igreja.org",
      {
        appUser: {
          id: "local-app-user-joao",
          first_name: "Joao",
          last_name: "Silva",
          email: "joao@igreja.org",
          phone: "(83) 99999-2222",
          password_hash: localHash("12345678"),
          active: true,
          created_at: new Date().toISOString(),
        },
        memberships: [
          {
            tenantUserId: "local-tenant-user-joao-mari",
            tenantId: "2",
            tenantName: "Central Mari",
            tenantCity: "Mari",
            tenantState: "PB",
            role: "caregiver",
            caregiverId: "2",
          },
        ],
      },
    ],
  ]);
}

const localAuthStore = createInitialLocalAuthStore();

function mapAppUser(row: AppUserRow): AppUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    active: row.active,
    createdAt: row.created_at,
  };
}

function mapAuthUser(row: AppUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
  };
}

function mapMembership(row: MembershipRow): UserMembership {
  return {
    tenantUserId: row.tenant_user_id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    tenantCity: row.tenant_city,
    tenantState: row.tenant_state,
    role: row.role,
    caregiverId: row.caregiver_id,
  };
}

function ensureDb() {
  const db = getDbPool();

  if (!db || !isDatabaseConfigured()) {
    throw new Error("Banco nao configurado para autenticacao local.");
  }

  return db;
}

function getLocalRecordByEmail(email: string) {
  return localAuthStore.get(email.trim().toLowerCase()) ?? null;
}

function getDefaultHomePath(role: UserMembership["role"]) {
  return role === "coordinator" ? "/coord" : "/cuidador";
}

export function resetLocalAuthStore() {
  localAuthStore.clear();
  for (const [key, value] of createInitialLocalAuthStore()) {
    localAuthStore.set(key, value);
  }
}

export async function findAppUserByEmail(email: string) {
  if (!isDatabaseConfigured()) {
    const record = getLocalRecordByEmail(email);
    return record ? mapAppUser(record.appUser) : null;
  }

  const db = ensureDb();
  const result = await db.query<AppUserRow>(
    `select * from app_users where lower(email) = lower($1) limit 1`,
    [email]
  );

  return result.rows[0] ? mapAppUser(result.rows[0]) : null;
}

export async function createAppUser(
  input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  },
  dbOverride?: Queryable
) {
  if (!isDatabaseConfigured()) {
    const nextUser: AppUserRow = {
      id: crypto.randomUUID(),
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      password_hash: hashPassword(input.password),
      active: true,
      created_at: new Date().toISOString(),
    };

    localAuthStore.set(input.email.toLowerCase(), {
      appUser: nextUser,
      memberships: [],
    });

    return mapAppUser(nextUser);
  }

  const db = dbOverride ?? ensureDb();
  const passwordHash = hashPassword(input.password);

  const result = (await db.query(
    `insert into app_users (first_name, last_name, email, phone, password_hash, active)
     values ($1, $2, $3, $4, $5, true)
     returning *`,
    [input.firstName, input.lastName, input.email, input.phone, passwordHash]
  )) as QueryResult<AppUserRow>;

  return mapAppUser(result.rows[0]);
}

export async function registerCoordinatorAccount(input: {
  tenantName: string;
  city: string;
  state: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}) {
  const existingUser = await findAppUserByEmail(input.email);
  if (existingUser) {
    throw new Error("Ja existe uma conta cadastrada com este email.");
  }

  const coordinatorName = `${input.firstName} ${input.lastName}`.trim();

  if (!isDatabaseConfigured()) {
    const tenant = await createTenant({
      name: input.tenantName,
      city: input.city,
      state: input.state,
      status: "active",
      coordinator: coordinatorName,
    });

    const nextUser: AppUserRow = {
      id: crypto.randomUUID(),
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      password_hash: hashPassword(input.password),
      active: true,
      created_at: new Date().toISOString(),
    };

    const membership: UserMembership = {
      tenantUserId: crypto.randomUUID(),
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantCity: tenant.city,
      tenantState: tenant.state,
      role: "coordinator",
      caregiverId: null,
    };

    localAuthStore.set(input.email.toLowerCase(), {
      appUser: nextUser,
      memberships: [membership],
    });

    return {
      user: mapAppUser(nextUser),
      membership,
    };
  }

  const db = ensureDb();
  const client = await db.connect();

  try {
    await client.query("begin");

    const tenantResult = await client.query<{
      id: string;
      name: string;
      city: string;
      state: string;
    }>(
      `insert into tenants (name, city, state, status, coordinator_name)
       values ($1, $2, $3, 'active', $4)
       returning id, name, city, state`,
      [input.tenantName, input.city, input.state, coordinatorName]
    );

    const tenant = tenantResult.rows[0];
    const user = await createAppUser(
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        password: input.password,
      },
      client
    );

    const tenantUserResult = await client.query<{ id: string }>(
      `insert into tenant_users (tenant_id, auth_user_id, app_user_id, name, email, role, active)
       values ($1, $2, $3, $4, $5, 'coordinator', true)
       returning id`,
      [tenant.id, user.id, user.id, coordinatorName, user.email]
    );

    await client.query("commit");

    return {
      user,
      membership: {
        tenantUserId: tenantUserResult.rows[0].id,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantCity: tenant.city,
        tenantState: tenant.state,
        role: "coordinator" as const,
        caregiverId: null,
      },
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listUserMemberships(appUserId: string) {
  if (!isDatabaseConfigured()) {
    const record = Array.from(localAuthStore.values()).find((item) => item.appUser.id === appUserId);
    return record?.memberships ?? [];
  }

  const db = ensureDb();
  const result = await db.query<MembershipRow>(
    `select
        tu.id as tenant_user_id,
        tu.tenant_id,
        t.name as tenant_name,
        t.city as tenant_city,
        t.state as tenant_state,
        tu.role,
        c.id as caregiver_id
      from tenant_users tu
      inner join tenants t on t.id = tu.tenant_id
      left join caregivers c on c.tenant_user_id = tu.id
      where tu.app_user_id = $1
        and tu.active = true
      order by t.name asc, tu.role asc`,
    [appUserId]
  );

  return result.rows.map(mapMembership);
}

export async function authenticateAppUser(input: LoginInput) {
  if (!isDatabaseConfigured()) {
    const record = getLocalRecordByEmail(input.email);
    if (!record || !verifyPassword(input.password, record.appUser.password_hash)) {
      return null;
    }

    return mapAuthUser(record.appUser);
  }

  const db = ensureDb();
  const result = await db.query<AppUserRow>(
    `select * from app_users where lower(email) = lower($1) and active = true limit 1`,
    [input.email]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const isValid = verifyPassword(input.password, row.password_hash);
  if (!isValid) {
    return null;
  }

  return mapAuthUser(row);
}

export async function authenticateLogin(input: LoginInput): Promise<LoginResult | null> {
  const user = await authenticateAppUser(input);
  if (!user) {
    return null;
  }

  const memberships = await listUserMemberships(user.id);
  if (memberships.length === 0) {
    throw new Error("Usuario autenticado, mas sem acesso a nenhum tenant.");
  }

  if (!input.tenantUserId) {
    if (memberships.length > 1) {
      return {
        type: "select-membership",
        user,
        memberships,
      };
    }

    const membership = memberships[0];
    return {
      type: "authenticated",
      session: {
        user,
        membership,
        homePath: getDefaultHomePath(membership.role),
      },
    };
  }

  const selectedMembership = memberships.find((membership) => membership.tenantUserId === input.tenantUserId);
  if (!selectedMembership) {
    throw new Error("O tenant selecionado nao pertence a este usuario.");
  }

  return {
    type: "authenticated",
    session: {
      user,
      membership: selectedMembership,
      homePath: getDefaultHomePath(selectedMembership.role),
    },
  };
}
