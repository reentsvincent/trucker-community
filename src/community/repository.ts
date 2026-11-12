import { and, asc, count, desc, eq, inArray, lt, max, sql } from "drizzle-orm";
import type { output, ZodType } from "zod";
import type { Db } from "@/db/database";
import { comments, media, posts, topics, users } from "@/db/schema";
import type { BackgroundKey } from "./backgrounds";
import { DEFAULT_TOPICS } from "./topics";
import {
  DisplayNameSchema,
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  NewCommentSchema,
  NewPostSchema,
  type NewComment,
  type NewPost,
} from "./validation";

export class CommunityError extends Error {
  constructor(
    readonly code: "not_found" | "invalid",
    message: string,
  ) {
    super(message);
    this.name = "CommunityError";
  }
}

export interface Author {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface TopicSummary {
  id: string;
  name: string;
  description: string;
  postCount: number;
  lastActivityAt: Date | null;
}

export type PostKind = "text" | "styled" | "image";

export interface PostSummary {
  id: string;
  topicId: string;
  topicName: string;
  kind: PostKind;
  /** Im Feed gekürzt (nur bei normalen Text-Beiträgen), sonst vollständig. */
  excerpt: string;
  background: BackgroundKey | null;
  /** URL des Bildes bei Bild-Beiträgen. */
  imageUrl: string | null;
  author: Author;
  createdAt: Date;
  lastActivityAt: Date;
  commentCount: number;
  /** Neuester Kommentar als Vorschau im Feed. */
  latestComment: CommentView | null;
}

export interface CommentView {
  id: string;
  body: string;
  author: Author;
  createdAt: Date;
}

export interface PostDetail extends Omit<PostSummary, "excerpt" | "latestComment"> {
  body: string;
  comments: CommentView[];
}

const EXCERPT_LENGTH = 280;

/** Legt fehlende Start-Themenbereiche an und aktualisiert Namen/Beschreibungen. */
export async function ensureTopics(db: Db): Promise<void> {
  await db
    .insert(topics)
    .values(DEFAULT_TOPICS.map((topic, index) => ({ ...topic, sortOrder: index })))
    .onConflictDoUpdate({
      target: topics.id,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        sortOrder: sql`excluded.sort_order`,
      },
    });
}

export async function createUser(db: Db, displayName: string): Promise<Author> {
  const name = parse(DisplayNameSchema, displayName);
  const [row] = await db
    .insert(users)
    .values({ displayName: name })
    .returning({ id: users.id, displayName: users.displayName });
  if (!row) throw new Error("Mitglied wurde nicht angelegt.");
  return { ...row, avatarUrl: null };
}

export async function findUser(db: Db, id: string): Promise<Author | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({ id: users.id, displayName: users.displayName, avatarMediaId: users.avatarMediaId })
    .from(users)
    .where(eq(users.id, id));
  return row ? toAuthor(row.id, row.displayName, row.avatarMediaId) : null;
}

export async function listTopics(db: Db): Promise<TopicSummary[]> {
  const rows = await db
    .select({
      id: topics.id,
      name: topics.name,
      description: topics.description,
      postCount: count(posts.id),
      lastActivityAt: max(posts.lastActivityAt),
    })
    .from(topics)
    .leftJoin(posts, eq(posts.topicId, topics.id))
    .groupBy(topics.id)
    .orderBy(asc(topics.sortOrder));
  return rows.map((row) => ({ ...row, lastActivityAt: toDate(row.lastActivityAt) }));
}

export async function getTopic(db: Db, id: string): Promise<TopicSummary | null> {
  const all = await listTopics(db);
  return all.find((topic) => topic.id === id) ?? null;
}

export interface ListPostsOptions {
  topicId?: string;
  authorId?: string;
  limit?: number;
  /** Für „Ältere laden“: nur Beiträge mit älterer letzter Aktivität. */
  before?: Date;
}

/** Beiträge, zuletzt aktive zuerst (wie in Foren üblich). */
export async function listPosts(db: Db, options: ListPostsOptions = {}): Promise<PostSummary[]> {
  const { topicId, authorId, limit = 20, before } = options;
  const commentCounts = db
    .select({ postId: comments.postId, total: count(comments.id).as("total") })
    .from(comments)
    .groupBy(comments.postId)
    .as("comment_counts");

  const filters = [
    topicId ? eq(posts.topicId, topicId) : undefined,
    authorId ? eq(posts.authorId, authorId) : undefined,
    before ? lt(posts.lastActivityAt, before) : undefined,
  ].filter((filter) => filter !== undefined);

  const rows = await db
    .select({
      id: posts.id,
      topicId: posts.topicId,
      topicName: topics.name,
      kind: posts.kind,
      body: posts.body,
      background: posts.background,
      mediaId: posts.mediaId,
      authorId: users.id,
      authorName: users.displayName,
      authorAvatar: users.avatarMediaId,
      createdAt: posts.createdAt,
      lastActivityAt: posts.lastActivityAt,
      commentCount: sql<number>`coalesce(${commentCounts.total}, 0)`.mapWith(Number),
    })
    .from(posts)
    .innerJoin(topics, eq(topics.id, posts.topicId))
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(commentCounts, eq(commentCounts.postId, posts.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(posts.lastActivityAt), desc(posts.id))
    .limit(Math.min(Math.max(limit, 1), 50));

  const latest = await latestComments(
    db,
    rows.filter((row) => row.commentCount > 0).map((row) => row.id),
  );

  return rows.map(({ body, authorId, authorName, authorAvatar, mediaId, background, ...row }) => ({
    ...row,
    excerpt: row.kind === "text" ? excerpt(body) : body,
    background: background as BackgroundKey | null,
    imageUrl: mediaUrl(mediaId),
    author: toAuthor(authorId, authorName, authorAvatar),
    latestComment: latest.get(row.id) ?? null,
  }));
}

export async function getPost(db: Db, id: string): Promise<PostDetail | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({
      id: posts.id,
      topicId: posts.topicId,
      topicName: topics.name,
      kind: posts.kind,
      body: posts.body,
      background: posts.background,
      mediaId: posts.mediaId,
      authorId: users.id,
      authorName: users.displayName,
      authorAvatar: users.avatarMediaId,
      createdAt: posts.createdAt,
      lastActivityAt: posts.lastActivityAt,
    })
    .from(posts)
    .innerJoin(topics, eq(topics.id, posts.topicId))
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(eq(posts.id, id));
  if (!row) return null;

  const commentRows = await db
    .select({
      id: comments.id,
      body: comments.body,
      authorId: users.id,
      authorName: users.displayName,
      authorAvatar: users.avatarMediaId,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.postId, id))
    .orderBy(asc(comments.createdAt), asc(comments.id));

  const { authorId, authorName, authorAvatar, mediaId, background, ...post } = row;
  return {
    ...post,
    background: background as BackgroundKey | null,
    imageUrl: mediaUrl(mediaId),
    author: toAuthor(authorId, authorName, authorAvatar),
    commentCount: commentRows.length,
    comments: commentRows.map(toCommentView),
  };
}

export async function createPost(
  db: Db,
  authorId: string,
  input: NewPost,
): Promise<{ id: string }> {
  const data = parse(NewPostSchema, input);
  const [topic] = await db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.id, data.topicId));
  if (!topic) throw new CommunityError("not_found", "Diesen Themenbereich gibt es nicht.");

  if (data.kind === "image") {
    const [image] = await db
      .select({ ownerId: media.ownerId })
      .from(media)
      .where(eq(media.id, data.mediaId));
    // Nur eigene, hochgeladene Bilder dürfen verwendet werden.
    if (!image || image.ownerId !== authorId) {
      throw new CommunityError("invalid", "Das Bild wurde nicht gefunden. Bitte neu auswählen.");
    }
  }

  const [row] = await db
    .insert(posts)
    .values({
      topicId: data.topicId,
      authorId,
      kind: data.kind,
      body: data.body,
      background: data.kind === "styled" ? data.background : null,
      mediaId: data.kind === "image" ? data.mediaId : null,
    })
    .returning({ id: posts.id });
  if (!row) throw new Error("Beitrag wurde nicht gespeichert.");
  return row;
}

export async function createComment(
  db: Db,
  authorId: string,
  input: NewComment,
): Promise<{ id: string }> {
  const data = parse(NewCommentSchema, input);
  return db.transaction(async (tx) => {
    // Der Beitrag rückt mit jedem Kommentar nach oben, wie in Foren üblich.
    const updated = await tx
      .update(posts)
      .set({ lastActivityAt: sql`now()` })
      .where(eq(posts.id, data.postId))
      .returning({ id: posts.id });
    if (updated.length === 0)
      throw new CommunityError("not_found", "Diesen Beitrag gibt es nicht mehr.");

    const [row] = await tx
      .insert(comments)
      .values({ postId: data.postId, authorId, body: data.body })
      .returning({ id: comments.id });
    if (!row) throw new Error("Kommentar wurde nicht gespeichert.");
    return row;
  });
}

export interface UploadedImage {
  mimeType: string;
  data: Buffer;
}

/** Speichert ein Bild und liefert seine ID für einen Bild-Beitrag. */
export async function saveImage(
  db: Db,
  ownerId: string,
  image: UploadedImage,
): Promise<{ id: string; url: string }> {
  if (!(IMAGE_TYPES as readonly string[]).includes(image.mimeType)) {
    throw new CommunityError("invalid", "Bitte ein Foto im Format JPEG, PNG oder WebP wählen.");
  }
  if (image.data.byteLength === 0 || image.data.byteLength > MAX_IMAGE_BYTES) {
    throw new CommunityError("invalid", "Das Bild ist zu groß (höchstens 3 MB).");
  }
  const [row] = await db
    .insert(media)
    .values({ ownerId, mimeType: image.mimeType, data: image.data })
    .returning({ id: media.id });
  if (!row) throw new Error("Bild wurde nicht gespeichert.");
  return { id: row.id, url: mediaUrl(row.id) as string };
}

/** Setzt ein neues Profilbild (ersetzt das alte). */
export async function setAvatar(db: Db, userId: string, image: UploadedImage): Promise<Author> {
  const saved = await saveImage(db, userId, image);
  const [row] = await db
    .update(users)
    .set({ avatarMediaId: saved.id })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      displayName: users.displayName,
      avatarMediaId: users.avatarMediaId,
    });
  if (!row) throw new CommunityError("not_found", "Mitglied nicht gefunden.");
  return toAuthor(row.id, row.displayName, row.avatarMediaId);
}

export async function getImage(db: Db, id: string): Promise<UploadedImage | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({ mimeType: media.mimeType, data: media.data })
    .from(media)
    .where(eq(media.id, id));
  return row ?? null;
}

// ---------------------------------------------------------------------------

interface CommentRow {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: Date;
}

function toCommentView({
  authorId,
  authorName,
  authorAvatar,
  ...comment
}: CommentRow): CommentView {
  return { ...comment, author: toAuthor(authorId, authorName, authorAvatar) };
}

/** Neuester Kommentar je Beitrag (für die Vorschau im Feed), in einer Abfrage. */
async function latestComments(db: Db, postIds: string[]): Promise<Map<string, CommentView>> {
  if (postIds.length === 0) return new Map();
  const rows = await db
    .selectDistinctOn([comments.postId], {
      postId: comments.postId,
      id: comments.id,
      body: comments.body,
      authorId: users.id,
      authorName: users.displayName,
      authorAvatar: users.avatarMediaId,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(inArray(comments.postId, postIds))
    .orderBy(comments.postId, desc(comments.createdAt), desc(comments.id));
  return new Map(rows.map(({ postId, ...row }) => [postId, toCommentView(row)]));
}

function toAuthor(id: string, displayName: string, avatarMediaId: string | null): Author {
  return { id, displayName, avatarUrl: mediaUrl(avatarMediaId) };
}

function mediaUrl(id: string | null): string | null {
  return id ? `/media/${id}` : null;
}

function parse<T extends ZodType>(schema: T, input: unknown): output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new CommunityError("invalid", result.error.issues[0]?.message ?? "Ungültige Eingabe.");
  }
  return result.data;
}

function excerpt(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length <= EXCERPT_LENGTH ? flat : `${flat.slice(0, EXCERPT_LENGTH - 1).trimEnd()}…`;
}

function toDate(value: Date | string | null): Date | null {
  if (value === null) return null;
  return value instanceof Date ? value : new Date(value);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
