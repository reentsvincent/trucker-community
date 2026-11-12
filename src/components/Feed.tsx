import Link from "next/link";
import { listPosts } from "@/community/repository";
import { requestDb } from "@/server/db";
import { PostCard, PostCardSkeleton } from "./PostCard";

const PAGE_SIZE = 20;

/** Feed: zuletzt aktive Beiträge zuerst, mit „Ältere Beiträge“ zum Weiterblättern. */
export async function Feed({
  topicId,
  before,
  basePath,
}: {
  topicId?: string;
  before?: string;
  basePath: string;
}) {
  const beforeDate = before ? new Date(before) : undefined;
  const posts = await listPosts(await requestDb(), {
    ...(topicId ? { topicId } : {}),
    ...(beforeDate && !Number.isNaN(beforeDate.getTime()) ? { before: beforeDate } : {}),
    limit: PAGE_SIZE,
  });

  if (posts.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-lg font-semibold">
          {before ? "Keine älteren Beiträge" : "Noch nichts los hier"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {before
            ? "Du bist ganz unten angekommen."
            : "Schreib den ersten Beitrag in diesem Thema."}
        </p>
      </div>
    );
  }

  const last = posts.at(-1);
  return (
    <div className="space-y-4 px-4 pt-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {posts.length === PAGE_SIZE && last && (
        <Link
          href={`${basePath}?vor=${encodeURIComponent(last.lastActivityAt.toISOString())}`}
          className="block rounded-2xl border border-line py-3 text-center text-sm font-medium text-brand-ink"
        >
          Ältere Beiträge
        </Link>
      )}
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4">
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  );
}
