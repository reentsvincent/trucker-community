import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Database } from "@/db/database";
import {
  CommunityError,
  createComment,
  createPost,
  createUser,
  ensureTopics,
  findUser,
  getPost,
  getTopic,
  listPosts,
  listTopics,
} from "./repository";
import { DEFAULT_TOPICS } from "./topics";

let database: Database;
const db = () => database.db;

beforeEach(async () => {
  database = await openDatabase({ kind: "pglite" });
  await ensureTopics(db());
});

afterEach(async () => {
  await database.close();
});

async function member(name = "Kalle") {
  return createUser(db(), name);
}

describe("Themenbereiche", () => {
  it("legt die Start-Themen in fester Reihenfolge an", async () => {
    const topics = await listTopics(db());
    expect(topics.map((t) => t.id)).toEqual(DEFAULT_TOPICS.map((t) => t.id));
    expect(topics[0]).toMatchObject({ postCount: 0, lastActivityAt: null });
  });

  it("kann mehrfach ausgeführt werden, ohne doppelt anzulegen", async () => {
    await ensureTopics(db());
    expect(await listTopics(db())).toHaveLength(DEFAULT_TOPICS.length);
  });

  it("zählt Beiträge pro Themenbereich", async () => {
    const author = await member();
    await createPost(db(), author.id, {
      topicId: "parken",
      title: "Autohof Lohfelden",
      body: "Voll ab 18 Uhr.",
    });
    expect(await getTopic(db(), "parken")).toMatchObject({ postCount: 1 });
    expect(await getTopic(db(), "recht")).toMatchObject({ postCount: 0 });
    expect(await getTopic(db(), "gibt-es-nicht")).toBeNull();
  });
});

describe("Mitglieder", () => {
  it("bereinigt den Namen", async () => {
    expect((await createUser(db(), "  Kalle   der  Fahrer ")).displayName).toBe("Kalle der Fahrer");
  });

  it("lehnt zu kurze Namen ab", async () => {
    await expect(createUser(db(), " K ")).rejects.toThrow("mindestens 2 Zeichen");
  });

  it("findet Mitglieder nur über gültige IDs", async () => {
    const created = await member();
    expect(await findUser(db(), created.id)).toEqual(created);
    expect(await findUser(db(), "kein-uuid")).toBeNull();
  });
});

describe("Beiträge", () => {
  it("speichert einen Beitrag und zeigt ihn mit Autor und Thema", async () => {
    const author = await member();
    const { id } = await createPost(db(), author.id, {
      topicId: "technik",
      title: "  Retarder   pfeift ",
      body: "Seit gestern pfeift der Retarder bei 80.\n\n\n\nKennt das wer?",
    });

    const post = await getPost(db(), id);
    expect(post).toMatchObject({
      title: "Retarder pfeift",
      body: "Seit gestern pfeift der Retarder bei 80.\n\nKennt das wer?",
      topicId: "technik",
      topicName: "Technik & Fahrzeuge",
      author,
      commentCount: 0,
      comments: [],
    });
  });

  it("lehnt unbekannte Themen und leere Texte ab", async () => {
    const author = await member();
    await expect(
      createPost(db(), author.id, { topicId: "gibt-es-nicht", title: "Hallo", body: "Text" }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      createPost(db(), author.id, { topicId: "parken", title: "Hallo", body: "   " }),
    ).rejects.toThrow(CommunityError);
  });

  it("kürzt lange Texte in der Übersicht", async () => {
    const author = await member();
    await createPost(db(), author.id, {
      topicId: "plauderecke",
      title: "Lang",
      body: "Wort ".repeat(100),
    });
    const [summary] = await listPosts(db());
    expect(summary?.excerpt.length).toBeLessThanOrEqual(160);
    expect(summary?.excerpt.endsWith("…")).toBe(true);
  });

  it("liefert unbekannte oder kaputte IDs als nicht gefunden", async () => {
    expect(await getPost(db(), "00000000-0000-4000-8000-000000000000")).toBeNull();
    expect(await getPost(db(), "quatsch")).toBeNull();
  });
});

describe("Kommentare", () => {
  it("hängt Kommentare in zeitlicher Reihenfolge an", async () => {
    const author = await member("Kalle");
    const other = await member("Moni");
    const { id } = await createPost(db(), author.id, {
      topicId: "parken",
      title: "Frage",
      body: "Wo parken in Hamburg?",
    });

    await createComment(db(), other.id, { postId: id, body: "Autohof Stillhorn." });
    await createComment(db(), author.id, { postId: id, body: "Danke!" });

    const post = await getPost(db(), id);
    expect(post?.commentCount).toBe(2);
    expect(post?.comments.map((c) => [c.author.displayName, c.body])).toEqual([
      ["Moni", "Autohof Stillhorn."],
      ["Kalle", "Danke!"],
    ]);
  });

  it("schiebt kommentierte Beiträge nach oben", async () => {
    const author = await member();
    const older = await createPost(db(), author.id, {
      topicId: "parken",
      title: "Älterer",
      body: "a",
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await createPost(db(), author.id, { topicId: "parken", title: "Neuerer", body: "b" });
    expect((await listPosts(db())).map((p) => p.title)).toEqual(["Neuerer", "Älterer"]);

    await new Promise((resolve) => setTimeout(resolve, 5));
    await createComment(db(), author.id, { postId: older.id, body: "Push" });

    const list = await listPosts(db());
    expect(list.map((p) => p.title)).toEqual(["Älterer", "Neuerer"]);
    expect(list[0]?.commentCount).toBe(1);
  });

  it("lehnt Kommentare zu unbekannten Beiträgen ab", async () => {
    const author = await member();
    await expect(
      createComment(db(), author.id, {
        postId: "00000000-0000-4000-8000-000000000000",
        body: "Hallo",
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("Beitragsliste", () => {
  it("filtert nach Thema und blättert mit „before“", async () => {
    const author = await member();
    for (const title of ["Eins", "Zwei", "Drei"]) {
      await createPost(db(), author.id, { topicId: "jobs", title, body: "x" });
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    await createPost(db(), author.id, { topicId: "recht", title: "Anderes Thema", body: "x" });

    const firstPage = await listPosts(db(), { topicId: "jobs", limit: 2 });
    expect(firstPage.map((p) => p.title)).toEqual(["Drei", "Zwei"]);

    const nextPage = await listPosts(db(), {
      topicId: "jobs",
      limit: 2,
      before: firstPage.at(-1)?.lastActivityAt,
    });
    expect(nextPage.map((p) => p.title)).toEqual(["Eins"]);
  });
});
