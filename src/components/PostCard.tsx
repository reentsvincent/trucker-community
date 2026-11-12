import Link from "next/link";
import { BACKGROUNDS } from "@/community/backgrounds";
import type { PostDetail, PostSummary } from "@/community/repository";
import { TimeAgo } from "./TimeAgo";
import { Avatar } from "./Avatar";

type Post = PostSummary | PostDetail;

/** Beitragskarte nach Skizze: Kopfzeile mit Autor, Zeit und Thema, Inhalt, Kommentarzahl. */
export function PostCard({ post, linked = true }: { post: Post; linked?: boolean }) {
  const text = "excerpt" in post ? post.excerpt : post.body;
  const card = (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <header className="flex items-center gap-2.5 px-4 pt-3 pb-2.5">
        <Avatar author={post.author} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{post.author.displayName}</p>
          <p className="text-xs text-muted">
            <TimeAgo date={post.createdAt} />
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted">
          in <span className="font-medium text-brand-ink">{post.topicName}</span>
        </span>
      </header>

      <PostBody post={post} text={text} />

      <footer className="border-t border-line px-4 py-2.5">
        <p className="text-sm font-medium text-ink">
          {post.commentCount === 1 ? "1 Kommentar" : `${post.commentCount} Kommentare`}
        </p>
        {"latestComment" in post && post.latestComment && (
          <div className="mt-2 flex gap-2">
            <Avatar author={post.latestComment.author} />
            <p className="line-clamp-2 min-w-0 flex-1 rounded-2xl bg-surface px-3 py-2 text-sm">
              <span className="font-semibold">{post.latestComment.author.displayName}</span>{" "}
              {post.latestComment.body}
            </p>
          </div>
        )}
      </footer>
    </article>
  );

  if (!linked) return card;
  return (
    <Link
      href={`/beitrag/${post.id}`}
      className="block rounded-2xl transition-shadow hover:shadow-md"
    >
      {card}
    </Link>
  );
}

function PostBody({ post, text }: { post: Post; text: string }) {
  if (post.kind === "styled") {
    const background = BACKGROUNDS[post.background ?? "lila"] ?? BACKGROUNDS.lila;
    return (
      <div
        className="flex min-h-48 items-center justify-center px-6 py-10 text-center"
        style={{ background: background.css }}
      >
        <p className="text-2xl leading-snug font-bold text-balance whitespace-pre-line text-white">
          {text}
        </p>
      </div>
    );
  }

  if (post.kind === "image" && post.imageUrl) {
    return (
      <div>
        {text && (
          <p className="px-4 pb-3 text-[15px] leading-relaxed whitespace-pre-line">{text}</p>
        )}
        {/* Bilder kommen aus unserer eigenen /media-Route, daher normales <img>. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt=""
          className="max-h-[32rem] w-full bg-surface object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return <p className="px-4 pb-4 text-[15px] leading-relaxed whitespace-pre-line">{text}</p>;
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className="size-9 rounded-full bg-line" />
        <span className="h-3 w-32 rounded bg-line" />
      </div>
      <div className="mt-4 space-y-2">
        <span className="block h-3 w-full rounded bg-line" />
        <span className="block h-3 w-4/5 rounded bg-line" />
      </div>
    </div>
  );
}
