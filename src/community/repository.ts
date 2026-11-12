import { and, asc, count, desc, eq, lt, max, sql } from "drizzle-orm";
import type { output, ZodType } from "zod";
import type { Db } from "@/db/database";
import { comments, posts, topics, users } from "@/db/schema";
import { DEFAULT_TOPICS } from "./topics";
import {
  DisplayNameSchema,
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
}

export interface TopicSummary {
  id: string;
  name: string;
  description: string;
  postCount: number;
  lastActivityAt: Date | null;
}

export interface PostSummary {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  excerpt: string;
  author: Author;
  createdAt: Date;
  lastActivityAt: Date;
  commentCount: number;
}

export interface CommentView {
  id: string;
  body: string;
  author: Author;
  createdAt: Date;
}

export interface PostDetail extends Omit<PostSummary, "excerpt"> {
  body: string;
  comments: CommentView[];
}

const EXCERPT_LENGTH = 160;

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
  return row;
}

export async function findUser(db: Db, id: string): Promise<Author | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, id));
  return row ?? null;
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
  limit?: number;
  /** Für „Ältere laden“: nur Beiträge mit älterer letzter Aktivität. */
  before?: Date;
}

/** Beiträge, zuletzt aktive zuerst (wie in Foren üblich). */
export async function listPosts(db: Db, options: ListPostsOptions = {}): Promise<PostSummary[]> {
  const { topicId, limit = 20, before } = options;
  const commentCounts = db
    .select({ postId: comments.postId, total: count(comments.id).as("total") })
    .from(comments)
    .groupBy(comments.postId)
    .as("comment_counts");

  const filters = [
    topicId ? eq(posts.topicId, topicId) : undefined,
    before ? lt(posts.lastActivityAt, before) : undefined,
  ].filter((filter) => filter !== undefined);

  const rows = await db
    .select({
      id: posts.id,
      topicId: posts.topicId,
      topicName: topics.name,
      title: posts.title,
      body: posts.body,
      authorId: users.id,
      authorName: users.displayName,
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

  return rows.map(({ body, authorId, authorName, ...row }) => ({
    ...row,
    excerpt: excerpt(body),
    author: { id: authorId, displayName: authorName },
  }));
}

export async function getPost(db: Db, id: string): Promise<PostDetail | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({
      id: posts.id,
      topicId: posts.topicId,
      topicName: topics.name,
      title: posts.title,
      body: posts.body,
      authorId: users.id,
      authorName: users.displayName,
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
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.postId, id))
    .orderBy(asc(comments.createdAt), asc(comments.id));

  const { authorId, authorName, ...post } = row;
  return {
    ...post,
    author: { id: authorId, displayName: authorName },
    commentCount: commentRows.length,
    comments: commentRows.map(({ authorId: cid, authorName: cname, ...comment }) => ({
      ...comment,
      author: { id: cid, displayName: cname },
    })),
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

  const [row] = await db
    .insert(posts)
    .values({ topicId: data.topicId, authorId, title: data.title, body: data.body })
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

// ---------------------------------------------------------------------------

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
