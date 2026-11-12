import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite, type PGliteOptions } from "@electric-sql/pglite";
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
  const client = new PGlite(target.dataDir, await pgliteAssets());
  const db = drizzlePglite(client, { schema });
  if (migrate) await migratePglite(db, { migrationsFolder });
  return { db, close: () => client.close() };
}

/**
 * PGlite lädt seine WebAssembly-Dateien normalerweise über `new URL(…, import.meta.url)`.
 * Innerhalb von Next.js scheitert das (fremdes URL-Objekt). Deshalb laden wir
 * die Dateien selbst über normale Pfade und reichen sie durch.
 */
let assets:
  Promise<Pick<PGliteOptions, "pgliteWasmModule" | "initdbWasmModule" | "fsBundle">> | undefined;
function pgliteAssets() {
  assets ??= (async () => {
    const dir = path.join(process.cwd(), "node_modules", "@electric-sql", "pglite", "dist");
    const [pglite, initdb, data] = await Promise.all([
      readFile(path.join(dir, "pglite.wasm")),
      readFile(path.join(dir, "initdb.wasm")),
      readFile(path.join(dir, "pglite.data")),
    ]);
    return {
      pgliteWasmModule: await WebAssembly.compile(pglite),
      initdbWasmModule: await WebAssembly.compile(initdb),
      fsBundle: new Blob([data]),
    };
  })();
  return assets;
}

/** Ohne DATABASE_URL: eingebettetes Postgres im Projektordner (.data/pglite). */
export function databaseTargetFromEnv(env: NodeJS.ProcessEnv = process.env): DatabaseTarget {
  return env.DATABASE_URL
    ? { kind: "postgres", url: env.DATABASE_URL }
    : { kind: "pglite", dataDir: env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite") };
}
