import {
  type AnyPgColumn,
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Mitglieder der Community. `externalId` ist für die spätere Anbindung an
 * den cargovibe-Login reserviert (dort die ID des cargovibe-Kontos).
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayName: text("display_name").notNull(),
    externalId: text("external_id"),
    /** Profilbild (hochgeladenes Foto); ohne Bild zeigt die App Initialen. */
    avatarMediaId: uuid("avatar_media_id").references((): AnyPgColumn => media.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_external_id_idx").on(t.externalId)],
);

/** Themenbereiche, z. B. „Parkplätze & Rastanlagen“. Die ID ist der URL-Teil. */
export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Binärdaten (Postgres `bytea`). */
const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  // PGlite liefert Uint8Array, node-postgres Buffer: überall Buffer daraus machen.
  fromDriver: (value) => Buffer.from(value),
});

/**
 * Hochgeladene Bilder. Für den Prototyp direkt in Postgres (kein extra Dienst);
 * die App verkleinert Fotos vor dem Hochladen. Später ggf. Bilderspeicher (z. B. Vercel Blob).
 */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  mimeType: text("mime_type").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    /** `text`: normaler Text, `styled`: kurzer Text auf farbigem Hintergrund, `image`: Bild mit optionalem Text. */
    kind: text("kind", { enum: ["text", "styled", "image"] }).notNull(),
    body: text("body").notNull(),
    /** Nur bei `styled`: Schlüssel des Hintergrunds (siehe community/backgrounds.ts). */
    background: text("background"),
    /** Nur bei `image`. */
    mediaId: uuid("media_id").references(() => media.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Zeitpunkt des letzten Kommentars; danach wird wie in Foren sortiert. */
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("posts_topic_activity_idx").on(t.topicId, t.lastActivityAt),
    index("posts_activity_idx").on(t.lastActivityAt),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_post_idx").on(t.postId, t.createdAt)],
);
