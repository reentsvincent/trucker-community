import { z } from "zod";

/** Leerzeichen am Rand weg, mehrfache Leerzeilen auf eine kürzen. */
const cleanText = (value: string) => value.trim().replace(/\n{3,}/g, "\n\n");

export const DisplayNameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, "Der Name muss mindestens 2 Zeichen haben.")
      .max(30, "Der Name darf höchstens 30 Zeichen haben."),
  );

export const NewPostSchema = z.object({
  topicId: z.string().min(1, "Bitte einen Themenbereich wählen."),
  title: z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(3, "Der Titel muss mindestens 3 Zeichen haben.")
        .max(120, "Der Titel darf höchstens 120 Zeichen haben."),
    ),
  body: z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, "Bitte einen Text schreiben.")
        .max(5000, "Der Text darf höchstens 5.000 Zeichen haben."),
    ),
});
export type NewPost = z.input<typeof NewPostSchema>;

export const NewCommentSchema = z.object({
  postId: z.uuid("Unbekannter Beitrag."),
  body: z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, "Bitte einen Kommentar schreiben.")
        .max(2000, "Der Kommentar darf höchstens 2.000 Zeichen haben."),
    ),
});
export type NewComment = z.input<typeof NewCommentSchema>;
