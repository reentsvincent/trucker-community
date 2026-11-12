"use client";

import { useActionState } from "react";
import { signInAction, type FormState } from "@/app/actions";

const initial: FormState = { error: null };

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  return (
    <form action={action} className="mt-5 space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-sm font-medium">Vor- und Nachname</span>
        <input
          name="displayName"
          required
          minLength={2}
          maxLength={40}
          autoComplete="name"
          placeholder="z. B. Kalle Krause"
          className="mt-1 w-full rounded-xl border border-line px-3.5 py-3 text-base outline-none focus:border-brand"
        />
      </label>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton pending={pending}>Los geht&apos;s</SubmitButton>
    </form>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={pending}
      className="w-full rounded-xl bg-brand py-3.5 font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Einen Moment …" : children}
    </button>
  );
}
