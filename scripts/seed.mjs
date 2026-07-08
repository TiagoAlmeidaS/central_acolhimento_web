import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFile = path.resolve(__dirname, "..", "supabase", "seed.sql");

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

async function main() {
  if (process.env.SKIP_DB_SEED === "true") {
    console.log("[seed] skipped because SKIP_DB_SEED=true");
    return;
  }

  const connectionString = getConnectionString();
  if (!connectionString) {
    console.log("[seed] skipped because no Postgres connection string is configured");
    return;
  }

  const sql = await readFile(seedFile, "utf8");
  const client = new Client({
    connectionString: sanitizeConnectionStringForSslOptions(connectionString),
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  try {
    await client.query(sql);
    console.log("[seed] done");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("[seed] failed");
  console.error(error);
  process.exit(1);
});
