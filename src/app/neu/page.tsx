import { redirect } from "next/navigation";
import { Suspense } from "react";
import { listTopics } from "@/community/repository";
import { AppHeader } from "@/components/AppHeader";
import { Composer } from "@/components/Composer";
import { FeedSkeleton } from "@/components/Feed";
import { requestDb } from "@/server/db";
import { getCurrentMemberForPage } from "@/server/session";

export default function NewPostPage({ searchParams }: PageProps<"/neu">) {
  return (
    <>
      <AppHeader />
      <div className="px-4 pt-2">
        <h1 className="mb-4 text-xl font-bold">Neuer Beitrag</h1>
        <Suspense fallback={<FeedSkeleton />}>
          <ComposerLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function ComposerLoader({ searchParams }: Pick<PageProps<"/neu">, "searchParams">) {
  const [member, { thema }, topics] = await Promise.all([
    getCurrentMemberForPage(),
    searchParams,
    requestDb().then(listTopics),
  ]);
  if (!member) redirect("/anmelden?next=/neu");
  const defaultTopic =
    typeof thema === "string" && topics.some((t) => t.id === thema) ? thema : (topics[0]?.id ?? "");
  return (
    <Composer topics={topics.map(({ id, name }) => ({ id, name }))} defaultTopic={defaultTopic} />
  );
}
