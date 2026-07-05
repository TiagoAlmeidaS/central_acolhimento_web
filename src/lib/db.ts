import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
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

export function isDatabaseConfigured() {
  return Boolean(connectionString);
}

export function getDbPool() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
      max: 5,
    });

    attachDatabasePool(pool);
  }

  return pool;
}
