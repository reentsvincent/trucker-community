/**
 * Bringt das Datenbankschema auf den neuesten Stand und legt die Themen an.
 * Läuft auf Vercel beim Bauen (vor `next build`), lokal bei Bedarf.
 * Bei Neon die direkte Verbindung nutzen: Schemaänderungen über den Pool sind unzuverlässig.
 */
import { ensureTopics } from "../src/community/repository";
import { databaseTargetFromEnv, openDatabase } from "../src/db/database";

const env = { ...process.env };
if (env.DATABASE_URL_UNPOOLED) env.DATABASE_URL = env.DATABASE_URL_UNPOOLED;

const target = databaseTargetFromEnv(env);
const database = await openDatabase(target);
await ensureTopics(database.db);
await database.close();
console.log(`Migrationen ausgeführt (${target.kind}).`);
