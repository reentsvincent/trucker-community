/**
 * Legt Beispiel-Inhalte an, um die Community vorzuführen.
 * Aufruf: pnpm db:seed   (nutzt DATABASE_URL oder das lokale PGlite)
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  createComment,
  createPost,
  createUser,
  ensureTopics,
  saveImage,
} from "../src/community/repository";
import { databaseTargetFromEnv, openDatabase } from "../src/db/database";

const pause = () => new Promise((resolve) => setTimeout(resolve, 20));

const database = await openDatabase(databaseTargetFromEnv());
const db = database.db;
await ensureTopics(db);

const [kalle, moni, andrzej, sabine] = await Promise.all(
  ["Kalle Krause", "Moni Meier", "Andrzej Nowak", "Sabine Wolff"].map((name) =>
    createUser(db, name),
  ),
);
if (!kalle || !moni || !andrzej || !sabine) throw new Error("Mitglieder fehlen");

const recht = await createPost(db, moni.id, {
  kind: "text",
  topicId: "recht",
  body: "Kurze Frage an die Runde: Zählt die Wartezeit an der Rampe bei euch als Arbeitszeit oder schreibt ihr Bereitschaft? Unser Dispo sagt so, die Kontrolle letzte Woche sagte anders.",
});
await createComment(db, kalle.id, {
  postId: recht.id,
  body: "Wenn du vorher nicht weißt, wie lange es dauert, ist es Arbeitszeit. Steht so im ArbZG.",
});
await pause();

const freizeit = await createPost(db, andrzej.id, {
  kind: "image",
  topicId: "freizeit",
  body: "Feierabend am Brenner. Für solche Ausblicke mach ich den Job 🏔️",
  mediaId: (
    await saveImage(db, andrzej.id, {
      mimeType: "image/jpeg",
      data: await readFile(path.join(import.meta.dirname, "demo-brenner.jpg")),
    })
  ).id,
});
await createComment(db, sabine.id, { postId: freizeit.id, body: "Traumhaft! Gute Fahrt dir." });
await pause();

const gehalt = await createPost(db, sabine.id, {
  kind: "styled",
  topicId: "gehalt",
  body: "Endlich! Spesen ab Januar um 4 € pro Tag erhöht 💪",
  background: "sonne",
});
await createComment(db, moni.id, {
  postId: gehalt.id,
  body: "Glückwunsch! Bei welcher Spedition bist du?",
});
await createComment(db, andrzej.id, { postId: gehalt.id, body: "Davon können wir nur träumen 😅" });
await createComment(db, sabine.id, {
  postId: gehalt.id,
  body: "Mittelständler aus OWL, schreib mir gern.",
});
await pause();

const parken = await createPost(db, kalle.id, {
  kind: "text",
  topicId: "parken",
  body: "Autohof Lohfelden ist ab 18 Uhr komplett dicht. Wer Richtung Kassel unterwegs ist: Rastplatz Kassel-Ost hatte vor 20 Minuten noch 4 freie Plätze.",
});
await createComment(db, moni.id, { postId: parken.id, body: "Danke dir! Bin in 15 Minuten da." });
await createComment(db, andrzej.id, { postId: parken.id, body: "Kassel-Ost jetzt auch voll 😕" });

await database.close();
console.log("Beispiel-Inhalte angelegt.");
