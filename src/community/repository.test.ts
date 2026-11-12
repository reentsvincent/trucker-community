import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Database } from "@/db/database";
import {
  CommunityError,
  createComment,
  createPost,
  createUser,
  ensureTopics,
  findUser,
  getImage,
  getPost,
  getTopic,
  listPosts,
  listTopics,
  saveImage,
} from "./repository";
import { DEFAULT_TOPICS } from "./topics";

let database: Database;
const db = () => database.db;
const pause = () => new Promise((resolve) => setTimeout(resolve, 5));

beforeEach(async () => {
  database = await openDatabase({ kind: "pglite" });
  await ensureTopics(db());
});

afterEach(async () => {
  await database.close();
});

const member = (name = "Kalle Krause") => createUser(db(), name);
const textPost = (authorId: string, body: string, topicId = "allgemein") =>
  createPost(db(), authorId, { kind: "text", topicId, body });
const jpeg = () => ({ mimeType: "image/jpeg", data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) });

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
    await textPost(author.id, "Autohof Lohfelden voll ab 18 Uhr.", "parken");
    expect(await getTopic(db(), "parken")).toMatchObject({ postCount: 1 });
    expect(await getTopic(db(), "recht")).toMatchObject({ postCount: 0 });
    expect(await getTopic(db(), "gibt-es-nicht")).toBeNull();
  });
});

describe("Mitglieder", () => {
  it("bereinigt den Namen", async () => {
    expect((await createUser(db(), "  Kalle   Krause ")).displayName).toBe("Kalle Krause");
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

describe("Text-Beiträge", () => {
  it("speichert einen Beitrag und zeigt ihn mit Autor und Thema", async () => {
    const author = await member();
    const { id } = await createPost(db(), author.id, {
      kind: "text",
      topicId: "technik",
      body: "  Seit gestern pfeift der Retarder bei 80.\n\n\n\nKennt das wer?  ",
    });

    expect(await getPost(db(), id)).toMatchObject({
      kind: "text",
      body: "Seit gestern pfeift der Retarder bei 80.\n\nKennt das wer?",
      topicId: "technik",
      topicName: "Technik",
      background: null,
      imageUrl: null,
      author,
      commentCount: 0,
      comments: [],
    });
  });

  it("lehnt unbekannte Themen und leere Texte ab", async () => {
    const author = await member();
    await expect(textPost(author.id, "Hallo", "gibt-es-nicht")).rejects.toMatchObject({
      code: "not_found",
    });
    await expect(textPost(author.id, "   ")).rejects.toThrow(CommunityError);
  });

  it("kürzt lange Texte im Feed", async () => {
    const author = await member();
    await textPost(author.id, "Wort ".repeat(200));
    const [summary] = await listPosts(db());
    expect(summary?.excerpt.length).toBeLessThanOrEqual(280);
    expect(summary?.excerpt.endsWith("…")).toBe(true);
  });

  it("liefert unbekannte oder kaputte IDs als nicht gefunden", async () => {
    expect(await getPost(db(), "00000000-0000-4000-8000-000000000000")).toBeNull();
    expect(await getPost(db(), "quatsch")).toBeNull();
  });
});

describe("Text auf Hintergrund", () => {
  it("speichert den gewählten Hintergrund", async () => {
    const author = await member();
    const { id } = await createPost(db(), author.id, {
      kind: "styled",
      topicId: "gehalt",
      body: "Endlich Spesen erhöht!",
      background: "sonne",
    });
    expect(await getPost(db(), id)).toMatchObject({ kind: "styled", background: "sonne" });
  });

  it("verlangt einen bekannten Hintergrund und kurzen Text", async () => {
    const author = await member();
    await expect(
      createPost(db(), author.id, {
        kind: "styled",
        topicId: "gehalt",
        body: "Hallo",
        background: "rosa" as "lila",
      }),
    ).rejects.toThrow("Hintergrund");
    await expect(
      createPost(db(), author.id, {
        kind: "styled",
        topicId: "gehalt",
        body: "x".repeat(201),
        background: "lila",
      }),
    ).rejects.toThrow("Höchstens 200 Zeichen");
  });
});

describe("Bild-Beiträge", () => {
  it("speichert ein Bild und verknüpft es mit dem Beitrag", async () => {
    const author = await member();
    const image = await saveImage(db(), author.id, jpeg());
    const { id } = await createPost(db(), author.id, {
      kind: "image",
      topicId: "freizeit",
      body: "",
      mediaId: image.id,
    });

    expect(await getPost(db(), id)).toMatchObject({
      kind: "image",
      imageUrl: `/media/${image.id}`,
    });
    expect(await getImage(db(), image.id)).toEqual(jpeg());
  });

  it("erlaubt nur eigene Bilder", async () => {
    const author = await member();
    const stranger = await member("Fremder Mann");
    const image = await saveImage(db(), stranger.id, jpeg());
    await expect(
      createPost(db(), author.id, {
        kind: "image",
        topicId: "freizeit",
        body: "",
        mediaId: image.id,
      }),
    ).rejects.toThrow("Bild wurde nicht gefunden");
  });

  it("lehnt falsche Formate und zu große Bilder ab", async () => {
    const author = await member();
    await expect(
      saveImage(db(), author.id, { mimeType: "image/gif", data: Buffer.from([1]) }),
    ).rejects.toThrow("JPEG, PNG oder WebP");
    await expect(
      saveImage(db(), author.id, { mimeType: "image/jpeg", data: Buffer.alloc(4 * 1024 * 1024) }),
    ).rejects.toThrow("zu groß");
  });
});

describe("Kommentare", () => {
  it("hängt Kommentare in zeitlicher Reihenfolge an", async () => {
    const author = await member("Kalle Krause");
    const other = await member("Moni Meier");
    const { id } = await textPost(author.id, "Wo parken in Hamburg?", "parken");

    await createComment(db(), other.id, { postId: id, body: "Autohof Stillhorn." });
    await createComment(db(), author.id, { postId: id, body: "Danke!" });

    const post = await getPost(db(), id);
    expect(post?.commentCount).toBe(2);
    expect(post?.comments.map((c) => [c.author.displayName, c.body])).toEqual([
      ["Moni Meier", "Autohof Stillhorn."],
      ["Kalle Krause", "Danke!"],
    ]);
  });

  it("schiebt kommentierte Beiträge nach oben", async () => {
    const author = await member();
    const older = await textPost(author.id, "Älterer");
    await pause();
    await textPost(author.id, "Neuerer");
    expect((await listPosts(db())).map((p) => p.excerpt)).toEqual(["Neuerer", "Älterer"]);

    await pause();
    await createComment(db(), author.id, { postId: older.id, body: "Push" });

    const list = await listPosts(db());
    expect(list.map((p) => p.excerpt)).toEqual(["Älterer", "Neuerer"]);
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
  it("filtert nach Thema und Autor und blättert mit „before“", async () => {
    const author = await member();
    const other = await member("Moni Meier");
    for (const body of ["Eins", "Zwei", "Drei"]) {
      await textPost(author.id, body, "jobs");
      await pause();
    }
    await textPost(other.id, "Anderes Thema", "recht");

    const firstPage = await listPosts(db(), { topicId: "jobs", limit: 2 });
    expect(firstPage.map((p) => p.excerpt)).toEqual(["Drei", "Zwei"]);

    const nextPage = await listPosts(db(), {
      topicId: "jobs",
      limit: 2,
      before: firstPage.at(-1)?.lastActivityAt,
    });
    expect(nextPage.map((p) => p.excerpt)).toEqual(["Eins"]);

    expect((await listPosts(db(), { authorId: other.id })).map((p) => p.excerpt)).toEqual([
      "Anderes Thema",
    ]);
  });
});
