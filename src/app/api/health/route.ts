export const dynamic = "force-dynamic";

import { getDbPool, isDatabaseConfigured, isInMemoryFallbackAllowed, isPersistentDatabaseRequired } from "@/lib/db";

export async function GET() {
  const timestamp = new Date().toISOString();
  const dbConfigured = isDatabaseConfigured();
  const fallbackAllowed = isInMemoryFallbackAllowed();
  const databaseRequired = isPersistentDatabaseRequired();

  if (!dbConfigured) {
    const payload = {
      ok: !databaseRequired,
      service: "central-acolhimento-monolith",
      framework: "next",
      timestamp,
      dbConfigured,
      fallbackAllowed,
      databaseRequired,
    };

    return Response.json(payload, { status: databaseRequired ? 503 : 200 });
  }

  try {
    const db = getDbPool();
    if (!db) {
      throw new Error("Pool indisponivel.");
    }

    await db.query("select 1");

    return Response.json({
      ok: true,
      service: "central-acolhimento-monolith",
      framework: "next",
      timestamp,
      dbConfigured: true,
      dbReachable: true,
      fallbackAllowed,
      databaseRequired,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "central-acolhimento-monolith",
        framework: "next",
        timestamp,
        dbConfigured: true,
        dbReachable: false,
        fallbackAllowed,
        databaseRequired,
        error: error instanceof Error ? error.message : "Falha ao conectar no banco.",
      },
      { status: 503 }
    );
  }
}
