import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const pooledConnectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "";

let pool: Pool | null = null;

function shouldUseSsl(connectionString: string) {
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

function sanitizeConnectionStringForSslOptions(connectionString: string) {
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

export function isDatabaseConfigured() {
  return Boolean(pooledConnectionString);
}

export function isPersistentDatabaseRequired() {
  if (process.env.REQUIRE_DATABASE === "true") {
    return true;
  }

  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function isInMemoryFallbackAllowed() {
  if (process.env.ALLOW_IN_MEMORY_FALLBACK === "true") {
    return true;
  }

  if (process.env.ALLOW_IN_MEMORY_FALLBACK === "false") {
    return false;
  }

  return !isPersistentDatabaseRequired();
}

export function getDatabaseUnavailableMessage(context?: string) {
  const suffix = context ? ` para ${context}` : "";
  return `Banco de dados obrigatorio nao configurado${suffix}. Defina POSTGRES_URL ou DATABASE_URL no ambiente atual.`;
}

export function assertDatabaseConfigured(context?: string) {
  if (!isDatabaseConfigured()) {
    throw new Error(getDatabaseUnavailableMessage(context));
  }
}

export function getDbPool() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!pool) {
    const sanitizedConnectionString = sanitizeConnectionStringForSslOptions(pooledConnectionString);
    pool = new Pool({
      connectionString: sanitizedConnectionString,
      ssl: shouldUseSsl(pooledConnectionString) ? { rejectUnauthorized: false } : false,
      max: 5,
    });

    attachDatabasePool(pool);
  }

  return pool;
}
