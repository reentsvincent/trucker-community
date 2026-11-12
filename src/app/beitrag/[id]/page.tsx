import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPost } from "@/community/repository";
import { AppHeader } from "@/components/AppHeader";
import { TimeAgo } from "@/components/TimeAgo";
import { Avatar } from "@/components/Avatar";
import { CommentForm } from "@/components/CommentForm";
import { FeedSkeleton } from "@/components/Feed";
import { PostCard } from "@/components/PostCard";
import { requestDb } from "@/server/db";
import { getCurrentMemberForPage } from "@/server/session";

export default function PostPage({ params }: PageProps<"/beitrag/[id]">) {
  return (
    <>
      <AppHeader />
      <Suspense fallback={<FeedSkeleton />}>
        <PostView params={params} />
      </Suspense>
    </>
  );
}

async function PostView({ params }: Pick<PageProps<"/beitrag/[id]">, "params">) {
  const { id } = await params;
  const [post, member] = await Promise.all([
    getPost(await requestDb(), id),
    getCurrentMemberForPage(),
  ]);
  if (!post) notFound();

  return (
    <div className="px-4 pt-2">
      <Link href={`/thema/${post.topicId}`} className="mb-3 inline-block text-sm text-brand-ink">
        ← {post.topicName}
      </Link>
      <PostCard post={post} linked={false} />

      <section id="kommentare" className="mt-5 scroll-mt-24">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          {post.commentCount === 1 ? "1 Kommentar" : `${post.commentCount} Kommentare`}
        </h2>
        <ul className="space-y-3">
          {post.comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <Avatar author={comment.author} />
              <div className="min-w-0 flex-1 rounded-2xl bg-surface px-3.5 py-2.5">
                <p className="text-sm">
                  <span className="font-semibold">{comment.author.displayName}</span>{" "}
                  <span className="text-xs text-muted">
                    <TimeAgo date={comment.createdAt} />
                  </span>
                </p>
                <p className="mt-0.5 text-[15px] leading-relaxed whitespace-pre-line">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          {member ? (
            <CommentForm postId={post.id} />
          ) : (
            <Link
              href={`/anmelden?next=/beitrag/${post.id}`}
              className="block rounded-2xl border border-line py-3 text-center text-sm font-medium text-brand-ink"
            >
              Anmelden, um zu kommentieren
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
