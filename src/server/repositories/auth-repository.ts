import type { Pool, PoolClient, QueryResult } from "pg";
import { getDbPool, isDatabaseConfigured } from "@/lib/db";
import type { AppUser, LoginInput } from "@/server/domain/mvp";
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

type Queryable = Pool | PoolClient;

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

function ensureDb() {
  const db = getDbPool();

  if (!db || !isDatabaseConfigured()) {
    throw new Error("Banco nao configurado para autenticacao local.");
  }

  return db;
}

export async function findAppUserByEmail(email: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = ensureDb();
  const result = await db.query<AppUserRow>(
    `select * from app_users where lower(email) = lower($1) limit 1`,
    [email]
  );

  return result.rows[0] ? mapAppUser(result.rows[0]) : null;
}

export async function createAppUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}, dbOverride?: Queryable) {
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

export async function authenticateAppUser(input: LoginInput) {
  if (!isDatabaseConfigured()) {
    if (input.email && input.password) {
      return {
        id: "local-user",
        email: input.email,
        firstName: "Modo",
        lastName: "Local",
      };
    }

    return null;
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

  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
  };
}
