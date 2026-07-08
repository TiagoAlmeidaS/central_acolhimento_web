import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  REQUIRE_DATABASE: process.env.REQUIRE_DATABASE,
  ALLOW_IN_MEMORY_FALLBACK: process.env.ALLOW_IN_MEMORY_FALLBACK,
  POSTGRES_URL: process.env.POSTGRES_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
};

async function loadDbModule() {
  vi.resetModules();
  return import("@/lib/db");
}

afterEach(() => {
  Object.assign(process.env, originalEnv);
});

describe("database configuration policy", () => {
  it("allows in-memory fallback in test mode when no database is configured", async () => {
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL_NON_POOLING;
    delete process.env.VERCEL;
    delete process.env.REQUIRE_DATABASE;
    delete process.env.ALLOW_IN_MEMORY_FALLBACK;
    Object.assign(process.env, { NODE_ENV: "test" });

    const db = await loadDbModule();

    expect(db.isDatabaseConfigured()).toBe(false);
    expect(db.isPersistentDatabaseRequired()).toBe(false);
    expect(db.isInMemoryFallbackAllowed()).toBe(true);
  });

  it("blocks in-memory fallback in production-like environments", async () => {
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL_NON_POOLING;
    delete process.env.ALLOW_IN_MEMORY_FALLBACK;
    Object.assign(process.env, { NODE_ENV: "production", VERCEL: "1" });

    const db = await loadDbModule();

    expect(db.isDatabaseConfigured()).toBe(false);
    expect(db.isPersistentDatabaseRequired()).toBe(true);
    expect(db.isInMemoryFallbackAllowed()).toBe(false);
    expect(() => db.assertDatabaseConfigured("teste")).toThrow(
      "Banco de dados obrigatorio nao configurado para teste. Defina POSTGRES_URL ou DATABASE_URL no ambiente atual."
    );
  });
});
