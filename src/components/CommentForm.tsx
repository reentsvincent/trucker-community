"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCommentAction, type FormState } from "@/app/actions";

const initial: FormState = { error: null };

export function CommentForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(createCommentAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Nach erfolgreichem Absenden (keine Fehlermeldung) Feld leeren.
  useEffect(() => {
    if (!pending && state.error === null) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={action} className="flex items-end gap-2">
      <input type="hidden" name="postId" value={postId} />
      <div className="flex-1">
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={2}
          placeholder="Kommentar schreiben …"
          className="w-full resize-none rounded-2xl border border-line px-3.5 py-2.5 text-base outline-none focus:border-brand"
        />
        {state.error && <p className="mt-1 text-sm text-danger">{state.error}</p>}
      </div>
      <button
        disabled={pending}
        className="mb-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "…" : "Senden"}
      </button>
    </form>
  );
}
