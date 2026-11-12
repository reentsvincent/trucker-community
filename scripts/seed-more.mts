/**
 * Weitere Beispiel-Inhalte quer durch alle Themen, mit über die letzten Tage
 * verteilten Zeitpunkten. Aufruf: pnpm db:seed:mehr
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import {
  createComment,
  createPost,
  createUser,
  ensureTopics,
  saveImage,
  type Author,
} from "../src/community/repository";
import type { BackgroundKey } from "../src/community/backgrounds";
import { databaseTargetFromEnv, openDatabase } from "../src/db/database";
import { comments, posts, users } from "../src/db/schema";

const database = await openDatabase(databaseTargetFromEnv());
const db = database.db;
await ensureTopics(db);

// Vorhandene Mitglieder wiederverwenden, fehlende anlegen.
const names = [
  "Kalle Krause",
  "Moni Meier",
  "Andrzej Nowak",
  "Sabine Wolff",
  "Jürgen Hoffmann",
  "Dennis Bauer",
  "Elena Popescu",
  "Marco Schulz",
  "Tanja Richter",
  "Piotr Kowalski",
];
const existing = await db
  .select({ id: users.id, displayName: users.displayName })
  .from(users)
  .where(inArray(users.displayName, names));
const members = new Map<string, Author>(
  existing.map((u) => [u.displayName, { ...u, avatarUrl: null }]),
);
for (const name of names) if (!members.has(name)) members.set(name, await createUser(db, name));
const m = (name: string) => {
  const member = members.get(name);
  if (!member) throw new Error(`Unbekannt: ${name}`);
  return member.id;
};

const image = async (file: string, owner: string) =>
  (
    await saveImage(db, owner, {
      mimeType: "image/jpeg",
      data: await readFile(path.join(import.meta.dirname, file)),
    })
  ).id;

type Seed = {
  by: string;
  topic: string;
  hoursAgo: number;
  text: string;
  background?: BackgroundKey;
  image?: string;
  comments?: [string, string, number][]; // [Name, Text, Minuten nach dem Beitrag]
};

const SEEDS: Seed[] = [
  {
    by: "Jürgen Hoffmann",
    topic: "strecke",
    hoursAgo: 0.3,
    text: "A7 Richtung Norden: Vollsperrung zwischen Hildesheim und Hannover-Süd nach Unfall. Ableitung über die B6, aber da steht's auch schon. Lieber jetzt Pause machen.",
    comments: [
      ["Dennis Bauer", "Danke, bin grad Höhe Seesen. Mach ich so.", 4],
      ["Tanja Richter", "Laut Polizei bis mindestens 18 Uhr.", 9],
    ],
  },
  {
    by: "Elena Popescu",
    topic: "allgemein",
    hoursAgo: 0.8,
    text: "Guten Morgen von der A3! ☀️ Wer ist noch so früh unterwegs?",
    background: "himmel",
    comments: [
      ["Piotr Kowalski", "Seit 4 Uhr auf der A2 🙋‍♂️", 6],
      ["Kalle Krause", "Moin! Kaffee läuft.", 12],
    ],
  },
  {
    by: "Dennis Bauer",
    topic: "technik",
    hoursAgo: 2,
    text: "Hat jemand Erfahrung mit dem neuen Actros L? Bekomme nächsten Monat einen. Wie ist die Kabine zum Schlafen, und taugt der Abstandsregeltempomat im Stau?",
    comments: [
      [
        "Marco Schulz",
        "Fahre ihn seit einem halben Jahr. Bett ist top, ACC im Stau absolut entspannt.",
        35,
      ],
      [
        "Jürgen Hoffmann",
        "Spiegelkameras sind am Anfang gewöhnungsbedürftig, danach willst du nichts anderes mehr.",
        50,
      ],
      ["Dennis Bauer", "Klingt gut, danke euch!", 70],
    ],
  },
  {
    by: "Andrzej Nowak",
    topic: "freizeit",
    hoursAgo: 3,
    text: "Früh los, dafür so ein Start in den Tag 🌅",
    image: "demo-sonnenaufgang.jpg",
    comments: [["Elena Popescu", "Wunderschön! Wo ist das?", 20]],
  },
  {
    by: "Tanja Richter",
    topic: "recht",
    hoursAgo: 5,
    text: "Kontrolle am Grenzübergang Frankfurt (Oder): Die haben heute ganz genau auf die Ruhezeiten im Fahrzeug geschaut. Regelmäßige Wochenruhe im Lkw ist verboten, da gibt's richtig Bußgeld. Also aufpassen!",
    comments: [
      ["Piotr Kowalski", "Ja, in Polen und Frankreich wird das auch scharf kontrolliert.", 40],
      ["Moni Meier", "Gut zu wissen, danke für die Warnung.", 95],
    ],
  },
  {
    by: "Marco Schulz",
    topic: "gehalt",
    hoursAgo: 7,
    text: "Was bekommt ihr eigentlich so an Spesen im internationalen Verkehr? Bei uns gibt's 32 € pro Tag, finde ich ehrlich gesagt zu wenig.",
    comments: [
      ["Sabine Wolff", "Wir liegen bei 35 €, plus Übernachtungspauschale.", 25],
      [
        "Andrzej Nowak",
        "Kommt stark aufs Land an. Frankreich und Skandinavien sollten deutlich mehr sein.",
        60,
      ],
      [
        "Jürgen Hoffmann",
        "Lass dir die Sätze schriftlich geben. Die gesetzlichen Pauschalen sind je Land festgelegt.",
        120,
      ],
    ],
  },
  {
    by: "Kalle Krause",
    topic: "parken",
    hoursAgo: 9,
    text: "Autohof Wörth am Rhein: abends ab 19 Uhr nix mehr frei, aber das Restaurant ist top und die Duschen sauber. Tipp: lieber schon um 17 Uhr da sein.",
    comments: [["Tanja Richter", "Kann ich bestätigen, Schnitzel ist riesig 😄", 30]],
  },
  {
    by: "Piotr Kowalski",
    topic: "jobs",
    hoursAgo: 12,
    text: "Suche nach 8 Jahren Fernverkehr was im Nahverkehr, damit ich abends zu Hause bin. Raum Hannover. Hat jemand Tipps, welche Firmen fair zahlen?",
    comments: [
      [
        "Jürgen Hoffmann",
        "Schau mal bei den Getränkelogistikern, die suchen ständig und zahlen anständig.",
        45,
      ],
      ["Dennis Bauer", "Viel Erfolg! Hab den Schritt letztes Jahr gemacht und nie bereut.", 80],
    ],
  },
  {
    by: "Sabine Wolff",
    topic: "allgemein",
    hoursAgo: 14,
    text: "Danke an den Kollegen, der mir heute beim Rangieren auf dem engen Hof geholfen hat 🙏",
    background: "lila",
    comments: [["Marco Schulz", "So muss das sein 👍", 15]],
  },
  {
    by: "Moni Meier",
    topic: "parken",
    hoursAgo: 20,
    text: "Nachts auf dem Autohof, alles voll, aber irgendwie hat das was ✨",
    image: "demo-autohof-nacht.jpg",
    comments: [
      ["Kalle Krause", "Hauptsache einen Platz gefunden!", 10],
      ["Elena Popescu", "Sieht richtig gemütlich aus.", 55],
    ],
  },
  {
    by: "Jürgen Hoffmann",
    topic: "technik",
    hoursAgo: 26,
    text: "Kleiner Tipp für den Winter: Standheizung vorher einmal komplett durchlaufen lassen. Hab heute früh gemerkt, dass meine nach dem Sommer nicht mehr anspringt. Werkstatttermin erst nächste Woche…",
    comments: [["Tanja Richter", "Oh nein, bei den Temperaturen gerade. Halt durch!", 60]],
  },
  {
    by: "Elena Popescu",
    topic: "freizeit",
    hoursAgo: 30,
    text: "Wer macht unterwegs Sport? Ich hab mir Widerstandsbänder gekauft, 15 Minuten Training auf dem Parkplatz am Abend tut echt gut. Rücken dankt es mir.",
    comments: [
      ["Dennis Bauer", "Gute Idee! Ich geh abends meistens eine Runde um den Autohof.", 90],
      ["Sabine Wolff", "Schick mal ein paar Übungen!", 150],
    ],
  },
  {
    by: "Dennis Bauer",
    topic: "strecke",
    hoursAgo: 36,
    text: "Brennerpass: ab Freitag wieder Blockabfertigung in Kufstein. Rechnet mit 1–2 Stunden Wartezeit.",
    background: "nacht",
    comments: [["Andrzej Nowak", "Wie jedes Wochenende 🙄", 20]],
  },
  {
    by: "Tanja Richter",
    topic: "gehalt",
    hoursAgo: 44,
    text: "Kleiner Hinweis: Der Mindestlohn steigt ab Januar wieder. Prüft eure Lohnabrechnung, ob auch die Wartezeiten richtig bezahlt werden!",
    comments: [["Moni Meier", "Genau darum ging's ja auch in meiner Frage letztens. Danke!", 40]],
  },
  {
    by: "Marco Schulz",
    topic: "jobs",
    hoursAgo: 52,
    text: "Nach 3 Jahren bei meiner Spedition jetzt endlich Festanstellung mit eigenem Lkw 🚛🎉",
    background: "wald",
    comments: [
      ["Kalle Krause", "Glückwunsch, Marco!", 30],
      ["Elena Popescu", "Verdient! 🎉", 45],
      ["Piotr Kowalski", "Super, viel Spaß mit dem neuen Bock!", 70],
    ],
  },
  {
    by: "Piotr Kowalski",
    topic: "recht",
    hoursAgo: 60,
    text: "Frage: Muss ich die Fahrerkarte stecken, wenn ich nur 10 Minuten auf dem Betriebshof umsetze? Mein Chef sagt nein, ein Kollege sagt ja.",
    comments: [
      [
        "Tanja Richter",
        "Sobald du auf öffentlichen Straßen fährst, ja. Rein auf dem Betriebsgelände ist es umstritten, ich würde sie immer stecken.",
        50,
      ],
    ],
  },
  {
    by: "Kalle Krause",
    topic: "allgemein",
    hoursAgo: 70,
    text: "30 Jahre auf dem Bock heute. Wahnsinn, wie die Zeit vergeht. Danke an alle, die man unterwegs so trifft, ihr macht den Job erst schön.",
    comments: [
      ["Sabine Wolff", "Respekt! Auf die nächsten 30 😄", 25],
      ["Jürgen Hoffmann", "Glückwunsch, Kalle! Wir sind ja fast gleich lang dabei.", 60],
      ["Moni Meier", "Alles Gute! 🎉", 90],
    ],
  },
];

let created = 0;
for (const seed of SEEDS) {
  const author = m(seed.by);
  const postedAt = new Date(Date.now() - seed.hoursAgo * 3600_000);
  const input = seed.image
    ? {
        kind: "image" as const,
        topicId: seed.topic,
        body: seed.text,
        mediaId: await image(seed.image, author),
      }
    : seed.background
      ? {
          kind: "styled" as const,
          topicId: seed.topic,
          body: seed.text,
          background: seed.background,
        }
      : { kind: "text" as const, topicId: seed.topic, body: seed.text };
  const { id } = await createPost(db, author, input);

  let lastActivity = postedAt;
  for (const [name, text, minutes] of seed.comments ?? []) {
    const { id: commentId } = await createComment(db, m(name), { postId: id, body: text });
    const at = new Date(Math.min(postedAt.getTime() + minutes * 60_000, Date.now()));
    await db.update(comments).set({ createdAt: at }).where(eq(comments.id, commentId));
    if (at > lastActivity) lastActivity = at;
  }
  // Zeitpunkte nachträglich setzen, damit der Feed realistisch über die Tage verteilt ist.
  await db
    .update(posts)
    .set({ createdAt: postedAt, lastActivityAt: lastActivity })
    .where(eq(posts.id, id));
  created++;
}

await database.close();
console.log(`${created} weitere Beiträge angelegt.`);
