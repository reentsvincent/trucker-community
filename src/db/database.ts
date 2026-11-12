import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import pg from "pg";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface Database {
  db: Db;
  close(): Promise<void>;
}

export type DatabaseTarget =
  /** Echtes Postgres, z. B. Neon auf Vercel. */
  | { kind: "postgres"; url: string }
  /** Eingebettetes Postgres (PGlite) für Entwicklung; ohne `dataDir` nur im Arbeitsspeicher. */
  | { kind: "pglite"; dataDir?: string };

const migrationsFolder = path.join(process.cwd(), "drizzle");

export interface OpenOptions {
  /** Schema beim Öffnen migrieren. Auf Vercel passiert das beim Bauen. */
  migrate?: boolean;
}

export async function openDatabase(
  target: DatabaseTarget,
  { migrate = true }: OpenOptions = {},
): Promise<Database> {
  if (target.kind === "postgres") {
    const pool = new pg.Pool({ connectionString: target.url, max: 5 });
    const db = drizzleNodePg(pool, { schema });
    if (migrate) await migrateNodePg(db, { migrationsFolder });
    return { db, close: () => pool.end() };
  }

  // PGlite legt fehlende übergeordnete Ordner nicht selbst an.
  if (target.dataDir) await mkdir(target.dataDir, { recursive: true });
  const client = new PGlite(target.dataDir);
  const db = drizzlePglite(client, { schema });
  if (migrate) await migratePglite(db, { migrationsFolder });
  return { db, close: () => client.close() };
}

/** Ohne DATABASE_URL: eingebettetes Postgres im Projektordner (.data/pglite). */
export function databaseTargetFromEnv(env: NodeJS.ProcessEnv = process.env): DatabaseTarget {
  return env.DATABASE_URL
    ? { kind: "postgres", url: env.DATABASE_URL }
    : { kind: "pglite", dataDir: env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite") };
}
