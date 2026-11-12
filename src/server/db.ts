import { connection } from "next/server";
import { ensureTopics } from "@/community/repository";
import { databaseTargetFromEnv, openDatabase, type Db } from "@/db/database";

/**
 * Eine Datenbankverbindung pro Server-Prozess. Im Entwicklungsmodus überlebt
 * sie Hot-Reloads (globalThis), sonst würden mehrere PGlite-Instanzen
 * gleichzeitig auf denselben Ordner zugreifen.
 */
const globalForDb = globalThis as unknown as { communityDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.communityDb ??= (async () => {
    const onVercel = Boolean(process.env.VERCEL);
    if (onVercel && !process.env.DATABASE_URL) {
      throw new Error("Auf Vercel muss DATABASE_URL gesetzt sein (z. B. Neon-Postgres).");
    }
    // Auf Vercel laufen Migrationen beim Bauen, lokal beim ersten Zugriff.
    const { db } = await openDatabase(databaseTargetFromEnv(), { migrate: !onVercel });
    await ensureTopics(db);
    return db;
  })();
  return globalForDb.communityDb;
}

/** Für Seiten: Daten immer frisch zur Anfragezeit laden, nie beim Bauen einfrieren. */
export async function requestDb(): Promise<Db> {
  await connection();
  return getDb();
}
