import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "..", "supabase", "migrations");
const migrationPrefixAllowlist = ["202607"];
const migrationTable = "public.schema_migrations";
const advisoryLockKey = 447311902;

function getConnectionString() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    ""
  );
}

function shouldUseSsl(connectionString) {
  if (connectionString.includes("sslmode=disable")) {
    return false;
  }

  try {
    const { hostname } = new URL(connectionString);
    return !["localhost", "127.0.0.1", "postgres"].includes(hostname);
  } catch {
    return !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");
  }
}

function sanitizeConnectionStringForSslOptions(connectionString) {
  if (!connectionString) {
    return connectionString;
  }

  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    url.searchParams.delete("sslrootcert");
    return url.toString();
  } catch {
    return connectionString
      .replace(/([?&])sslmode=[^&]*&?/i, "$1")
      .replace(/([?&])sslcert=[^&]*&?/i, "$1")
      .replace(/([?&])sslkey=[^&]*&?/i, "$1")
      .replace(/([?&])sslrootcert=[^&]*&?/i, "$1")
      .replace(/[?&]$/i, "");
  }
}

function checksum(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function listActiveMigrations() {
  const files = await readdir(migrationsDir);

  return files
    .filter((file) => file.endsWith(".sql"))
    .filter((file) => migrationPrefixAllowlist.some((prefix) => file.startsWith(prefix)))
    .sort((left, right) => left.localeCompare(right));
}

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists ${migrationTable} (
      id bigserial primary key,
      name text not null unique,
      checksum text not null,
      executed_at timestamptz not null default now()
    )
  `);
}

async function applyMigration(client, name, sql) {
  const hash = checksum(sql);
  const existing = await client.query(`select checksum from ${migrationTable} where name = $1 limit 1`, [name]);

  if (existing.rows[0]) {
    if (existing.rows[0].checksum !== hash) {
      throw new Error(`Migration ${name} foi alterada apos ja ter sido aplicada. Crie uma nova migration.`);
    }

    console.log(`[migrate] skipping ${name}`);
    return;
  }

  console.log(`[migrate] applying ${name}`);
  const disableTransaction = sql.includes("-- migrate:disable-transaction") || sql.includes("-- no-transaction");

  if (disableTransaction) {
    try {
      await client.query(sql);
      await client.query(`insert into ${migrationTable} (name, checksum) values ($1, $2)`, [name, hash]);
    } catch (error) {
      throw error;
    }
  } else {
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(`insert into ${migrationTable} (name, checksum) values ($1, $2)`, [name, hash]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
}

async function main() {
  if (process.env.SKIP_DB_MIGRATIONS === "true") {
    console.log("[migrate] skipped because SKIP_DB_MIGRATIONS=true");
    return;
  }

  const connectionString = getConnectionString();

  if (!connectionString) {
    console.log("[migrate] skipped because no Postgres connection string is configured");
    return;
  }

  const migrations = await listActiveMigrations();

  if (migrations.length === 0) {
    console.log("[migrate] no active migrations found");
    return;
  }

  const client = new Client({
    connectionString: sanitizeConnectionStringForSslOptions(connectionString),
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  try {
    await client.query("select pg_advisory_lock($1)", [advisoryLockKey]);
    await ensureMigrationTable(client);

    for (const file of migrations) {
      const fullPath = path.join(migrationsDir, file);
      const sql = await readFile(fullPath, "utf8");
      await applyMigration(client, file, sql);
    }

    console.log("[migrate] done");
  } finally {
    try {
      await client.query("select pg_advisory_unlock($1)", [advisoryLockKey]);
    } catch {
      // noop
    }

    await client.end();
  }
}

main().catch((error) => {
  console.error("[migrate] failed");
  console.error(error);
  process.exit(1);
});
