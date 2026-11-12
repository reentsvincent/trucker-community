"use client";

import { startTransition, useActionState, useState } from "react";
import { setAvatarAction, type FormState } from "@/app/actions";
import type { Author } from "@/community/repository";
import { resizeImage } from "@/lib/resize-image";
import { Avatar } from "./Avatar";

const initial: FormState = { error: null };

/** Profilbild antippen → Foto wählen → wird quadratisch zugeschnitten und hochgeladen. */
export function AvatarUpload({ author }: { author: Author }) {
  const [state, action, pending] = useActionState(setAvatarAction, initial);
  const [error, setError] = useState<string | null>(null);

  async function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const resized = await resizeImage(file, { maxSize: 400, square: true });
      const formData = new FormData();
      formData.set("image", resized);
      startTransition(() => action(formData));
    } catch {
      setError("Dieses Foto konnte nicht geladen werden.");
    }
  }

  return (
    <div className="flex flex-col items-center">
      <label className="relative cursor-pointer" aria-label="Profilbild ändern">
        <Avatar author={author} size="lg" />
        <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-brand text-white">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
            <path d="M9 4 7.5 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L15 4H9Zm3 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
          </svg>
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={pending}
          onChange={(event) => void choose(event.target.files?.[0])}
        />
      </label>
      {pending && <p className="mt-1 text-xs text-muted">Wird hochgeladen …</p>}
      {(error ?? state.error) && <p className="mt-1 text-xs text-danger">{error ?? state.error}</p>}
    </div>
  );
}
