import { z } from "zod";
import { BACKGROUND_KEYS } from "./backgrounds";

/** Leerzeichen am Rand weg, mehrfache Leerzeilen auf eine kürzen. */
const cleanText = (value: string) => value.trim().replace(/\n{3,}/g, "\n\n");

const text = (min: number, max: number, minMessage: string) =>
  z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(min, minMessage)
        .max(max, `Höchstens ${max.toLocaleString("de-DE")} Zeichen.`),
    );

export const DisplayNameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, "Der Name muss mindestens 2 Zeichen haben.")
      .max(40, "Der Name darf höchstens 40 Zeichen haben."),
  );

const topicId = z.string().min(1, "Bitte ein Thema wählen.");

export const NewPostSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    topicId,
    body: text(1, 5000, "Bitte einen Text schreiben."),
  }),
  z.object({
    kind: z.literal("styled"),
    topicId,
    // Kurz, damit der Text groß auf den Hintergrund passt.
    body: text(1, 200, "Bitte einen Text schreiben."),
    background: z.enum(BACKGROUND_KEYS, "Bitte einen Hintergrund wählen."),
  }),
  z.object({
    kind: z.literal("image"),
    topicId,
    body: text(0, 2000, ""),
    mediaId: z.uuid("Bitte ein Bild auswählen."),
  }),
]);
export type NewPost = z.input<typeof NewPostSchema>;

export const NewCommentSchema = z.object({
  postId: z.uuid("Unbekannter Beitrag."),
  body: text(1, 2000, "Bitte einen Kommentar schreiben."),
});
export type NewComment = z.input<typeof NewCommentSchema>;

/** Erlaubte Bildformate; die App wandelt Fotos vor dem Hochladen in JPEG um. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
