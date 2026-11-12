import { redirect } from "next/navigation";
import { Suspense } from "react";
import { listPosts } from "@/community/repository";
import { signOutAction } from "@/app/actions";
import { AppHeader } from "@/components/AppHeader";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FeedSkeleton } from "@/components/Feed";
import { PostCard } from "@/components/PostCard";
import { requestDb } from "@/server/db";
import { getCurrentMemberForPage } from "@/server/session";

export default function ProfilePage() {
  return (
    <>
      <AppHeader />
      <Suspense fallback={<FeedSkeleton />}>
        <Profile />
      </Suspense>
    </>
  );
}

async function Profile() {
  const member = await getCurrentMemberForPage();
  if (!member) redirect("/anmelden?next=/profil");
  const posts = await listPosts(await requestDb(), { authorId: member.id, limit: 50 });

  return (
    <div className="px-4 pt-2">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
        <AvatarUpload author={member} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{member.displayName}</p>
          <p className="text-sm text-muted">
            {posts.length === 1 ? "1 Beitrag" : `${posts.length} Beiträge`}
          </p>
        </div>
        <form action={signOutAction}>
          <button className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium">
            Abmelden
          </button>
        </form>
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-muted">Deine Beiträge</h2>
      {posts.length === 0 ? (
        <p className="text-sm text-muted">Du hast noch nichts gepostet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
