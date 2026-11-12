"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CommunityError,
  createComment,
  createPost,
  saveImage,
  setAvatar,
} from "@/community/repository";
import type { NewPost } from "@/community/validation";
import { getDb } from "@/server/db";
import { getCurrentMember, signIn, signOut } from "@/server/session";

export interface FormState {
  error: string | null;
}

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

/**
 * Nach jeder Änderung: alle Seiten als veraltet markieren. Ein neuer Kommentar
 * betrifft Feed, Thema, Profil und Beitrag gleichzeitig; sonst zeigt der
 * Browser eine zwischengespeicherte alte Fassung.
 */
function refreshAll() {
  revalidatePath("/", "layout");
}

/** Bekannte Fehler als Text fürs Formular, alles andere weiterwerfen. */
function toFormState(error: unknown): FormState {
  if (error instanceof CommunityError) return { error: error.message };
  throw error;
}

export async function signInAction(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn(field(formData, "displayName"));
  } catch (error) {
    return toFormState(error);
  }
  refreshAll();
  redirect(safeNext(field(formData, "next")));
}

export async function signOutAction(): Promise<void> {
  await signOut();
  refreshAll();
  redirect("/");
}

export async function createPostAction(_state: FormState, formData: FormData): Promise<FormState> {
  const member = await getCurrentMember();
  if (!member) redirect("/anmelden?next=/neu");

  const kind = field(formData, "kind");
  const topicId = field(formData, "topicId");
  const body = field(formData, "body");
  let postId: string;
  try {
    const db = await getDb();
    let input: NewPost;
    if (kind === "image") {
      const file = formData.get("image");
      if (!(file instanceof File) || file.size === 0) return { error: "Bitte ein Foto auswählen." };
      const image = await saveImage(db, member.id, {
        mimeType: file.type,
        data: Buffer.from(await file.arrayBuffer()),
      });
      input = { kind: "image", topicId, body, mediaId: image.id };
    } else if (kind === "styled") {
      input = {
        kind: "styled",
        topicId,
        body,
        background: field(formData, "background") as "lila",
      };
    } else {
      input = { kind: "text", topicId, body };
    }
    postId = (await createPost(db, member.id, input)).id;
  } catch (error) {
    return toFormState(error);
  }
  refreshAll();
  redirect(`/beitrag/${postId}`);
}

export async function createCommentAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const postId = field(formData, "postId");
  const member = await getCurrentMember();
  if (!member) redirect(`/anmelden?next=/beitrag/${postId}`);
  try {
    await createComment(await getDb(), member.id, { postId, body: field(formData, "body") });
  } catch (error) {
    return toFormState(error);
  }
  refreshAll();
  redirect(`/beitrag/${postId}#kommentare`);
}

export async function setAvatarAction(_state: FormState, formData: FormData): Promise<FormState> {
  const member = await getCurrentMember();
  if (!member) redirect("/anmelden?next=/profil");
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Bitte ein Foto auswählen." };
  try {
    await setAvatar(await getDb(), member.id, {
      mimeType: file.type,
      data: Buffer.from(await file.arrayBuffer()),
    });
  } catch (error) {
    return toFormState(error);
  }
  refreshAll();
  redirect("/profil");
}

/** Nur relative Pfade innerhalb der App als Weiterleitung zulassen. */
function safeNext(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
