"use client";

import { startTransition, useActionState, useState } from "react";
import { createPostAction, type FormState } from "@/app/actions";
import { BACKGROUNDS, BACKGROUND_KEYS, type BackgroundKey } from "@/community/backgrounds";
import { resizeImage } from "@/lib/resize-image";

const initial: FormState = { error: null };
type Kind = "text" | "styled" | "image";

const KINDS: { kind: Kind; label: string }[] = [
  { kind: "text", label: "Text" },
  { kind: "styled", label: "Text auf Bild" },
  { kind: "image", label: "Foto" },
];

export function Composer({
  topics,
  defaultTopic,
}: {
  topics: { id: string; name: string }[];
  defaultTopic: string;
}) {
  const [state, action, pending] = useActionState(createPostAction, initial);
  const [kind, setKind] = useState<Kind>("text");
  const [topicId, setTopicId] = useState(defaultTopic);
  const [body, setBody] = useState("");
  const [background, setBackground] = useState<BackgroundKey>("lila");
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  async function chooseImage(file: File | undefined) {
    if (!file) return;
    setImageError(null);
    setPreparing(true);
    try {
      const resized = await resizeImage(file);
      if (image) URL.revokeObjectURL(image.preview);
      setImage({ file: resized, preview: URL.createObjectURL(resized) });
    } catch {
      setImageError("Dieses Foto konnte nicht geladen werden. Bitte ein anderes wählen.");
    } finally {
      setPreparing(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("topicId", topicId);
    formData.set("body", body);
    if (kind === "styled") formData.set("background", background);
    if (kind === "image" && image) formData.set("image", image.file);
    startTransition(() => action(formData));
  }

  const busy = pending || preparing;
  const maxLength = kind === "styled" ? 200 : kind === "image" ? 2000 : 5000;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1">
        {KINDS.map((option) => (
          <button
            key={option.kind}
            type="button"
            role="tab"
            aria-selected={kind === option.kind}
            onClick={() => setKind(option.kind)}
            className={`rounded-xl py-2.5 text-sm font-semibold ${
              kind === option.kind ? "bg-brand text-white shadow" : "text-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-sm font-medium">Thema</span>
        <select
          value={topicId}
          onChange={(event) => setTopicId(event.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-3 text-base outline-none focus:border-brand"
        >
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      </label>

      {kind === "styled" ? (
        <div className="space-y-3">
          <div
            className="flex min-h-56 items-center justify-center rounded-2xl p-5"
            style={{ background: BACKGROUNDS[background].css }}
          >
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={maxLength}
              rows={4}
              placeholder="Was gibt's Neues?"
              className="w-full resize-none bg-transparent text-center text-2xl font-bold text-white outline-none placeholder:text-white/70"
            />
          </div>
          <div className="flex gap-2" aria-label="Hintergrund wählen">
            {BACKGROUND_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                aria-label={BACKGROUNDS[key].label}
                aria-pressed={background === key}
                onClick={() => setBackground(key)}
                className={`size-10 rounded-full ring-offset-2 ${background === key ? "ring-2 ring-brand" : ""}`}
                style={{ background: BACKGROUNDS[key].css }}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {kind === "image" && (
            <div>
              {image ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.preview}
                    alt="Vorschau"
                    className="max-h-96 w-full rounded-2xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white"
                  >
                    Entfernen
                  </button>
                </div>
              ) : (
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-brand/50 bg-surface text-brand-ink">
                  <span className="text-base font-semibold">
                    {preparing ? "Foto wird vorbereitet …" : "Foto auswählen"}
                  </span>
                  <span className="text-xs text-muted">aus der Galerie oder mit der Kamera</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => void chooseImage(event.target.files?.[0])}
                  />
                </label>
              )}
              {imageError && <p className="mt-1 text-sm text-danger">{imageError}</p>}
            </div>
          )}
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={maxLength}
            rows={kind === "image" ? 3 : 7}
            placeholder={
              kind === "image" ? "Text zum Foto (optional)" : "Was möchtest du erzählen?"
            }
            className="w-full resize-none rounded-2xl border border-line px-3.5 py-3 text-base outline-none focus:border-brand"
          />
        </>
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        disabled={busy || (kind === "image" ? !image : body.trim() === "")}
        className="w-full rounded-xl bg-brand py-3.5 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Wird gepostet …" : "Posten"}
      </button>
    </form>
  );
}
