/**
 * Beispiel-Beiträge für den Bereich „Was mich bewegt“.
 * Aufruf: pnpm db:seed:bewegt   (nutzt vorhandene Beispiel-Mitglieder)
 */
import { eq, inArray } from "drizzle-orm";
import { createComment, createPost, ensureTopics } from "../src/community/repository";
import type { BackgroundKey } from "../src/community/backgrounds";
import { databaseTargetFromEnv, openDatabase } from "../src/db/database";
import { comments, posts, users } from "../src/db/schema";

const database = await openDatabase(databaseTargetFromEnv());
const db = database.db;
await ensureTopics(db);

const SEEDS: {
  by: string;
  hoursAgo: number;
  text: string;
  background?: BackgroundKey;
  comments: [string, string, number][];
}[] = [
  {
    by: "Tanja Richter",
    hoursAgo: 6,
    text: "Heute hatte meine Tochter ihren ersten Schultag und ich stand in Lyon an der Rampe. Hab per Video zugeschaut. Manchmal frag ich mich echt, ob der Job das wert ist.",
    comments: [
      [
        "Kalle Krause",
        "Kenn ich gut, hab auch viel verpasst. Was mir geholfen hat: feste Telefonzeiten mit der Familie, jeden Abend um acht.",
        40,
      ],
      [
        "Elena Popescu",
        "Fühl dich gedrückt. Du machst das auch für sie, und das weiß sie bestimmt.",
        75,
      ],
    ],
  },
  {
    by: "Dennis Bauer",
    hoursAgo: 28,
    text: "Manchmal ist es nachts auf dem Parkplatz ganz schön einsam.",
    background: "nacht",
    comments: [
      ["Piotr Kowalski", "Geht vielen so. Schreib einfach hier rein, wir sind da.", 20],
      ["Moni Meier", "Wenn du magst: Ich bin abends meistens online 🙂", 45],
    ],
  },
  {
    by: "Jürgen Hoffmann",
    hoursAgo: 50,
    text: "Hatte die letzten Wochen richtig Druck: Termine, Stau, Dispo ständig am Telefon. Hab gemerkt, dass ich gereizt bin und schlecht schlafe. Was macht ihr, um runterzukommen?",
    comments: [
      [
        "Sabine Wolff",
        "Handy nach Feierabend auf lautlos und 20 Minuten spazieren. Klingt banal, hilft aber.",
        30,
      ],
      [
        "Marco Schulz",
        "Und sprich mit deinem Chef, wenn es dauerhaft zu viel ist. Hab ich gemacht, wurde danach besser.",
        90,
      ],
    ],
  },
];

const names = [...new Set(SEEDS.flatMap((s) => [s.by, ...s.comments.map(([n]) => n)]))];
const found = await db
  .select({ id: users.id, name: users.displayName })
  .from(users)
  .where(inArray(users.displayName, names));
const ids = new Map(found.map((u) => [u.name, u.id]));
const missing = names.filter((n) => !ids.has(n));
if (missing.length)
  throw new Error(
    `Bitte erst pnpm db:seed und db:seed:mehr ausführen. Es fehlen: ${missing.join(", ")}`,
  );

for (const seed of SEEDS) {
  const postedAt = new Date(Date.now() - seed.hoursAgo * 3600_000);
  const input = seed.background
    ? { kind: "styled" as const, topicId: "bewegt", body: seed.text, background: seed.background }
    : { kind: "text" as const, topicId: "bewegt", body: seed.text };
  const { id } = await createPost(db, ids.get(seed.by)!, input);
  let last = postedAt;
  for (const [name, text, minutes] of seed.comments) {
    const { id: commentId } = await createComment(db, ids.get(name)!, { postId: id, body: text });
    const at = new Date(Math.min(postedAt.getTime() + minutes * 60_000, Date.now()));
    await db.update(comments).set({ createdAt: at }).where(eq(comments.id, commentId));
    if (at > last) last = at;
  }
  await db.update(posts).set({ createdAt: postedAt, lastActivityAt: last }).where(eq(posts.id, id));
}

await database.close();
console.log(`${SEEDS.length} Beiträge in „Was mich bewegt“ angelegt.`);
