import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "";

let pool: Pool | null = null;

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
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
      max: 5,
    });

    attachDatabasePool(pool);
  }

  return pool;
}
