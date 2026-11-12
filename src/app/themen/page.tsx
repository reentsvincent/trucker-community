import Link from "next/link";
import { Suspense } from "react";
import { listTopics } from "@/community/repository";
import { AppHeader } from "@/components/AppHeader";
import { FeedSkeleton } from "@/components/Feed";
import { TimeAgo } from "@/components/TimeAgo";
import { requestDb } from "@/server/db";

/** „Weitere Themen“: alle Themenbereiche mit Beschreibung und Aktivität. */
export default function TopicsPage() {
  return (
    <>
      <AppHeader />
      <div className="px-4">
        <h1 className="text-xl font-bold">Alle Themen</h1>
      </div>
      <Suspense fallback={<FeedSkeleton />}>
        <TopicList />
      </Suspense>
    </>
  );
}

async function TopicList() {
  const topics = await listTopics(await requestDb());
  return (
    <ul className="space-y-3 px-4 pt-4">
      {topics.map((topic) => (
        <li key={topic.id}>
          <Link
            href={`/thema/${topic.id}`}
            className="block rounded-2xl border border-line bg-white px-4 py-3.5 hover:border-brand"
          >
            <p className="font-semibold">{topic.name}</p>
            <p className="text-sm text-muted">{topic.description}</p>
            <p className="mt-1.5 text-xs text-muted">
              {topic.postCount === 1 ? "1 Beitrag" : `${topic.postCount} Beiträge`}
              {topic.lastActivityAt && (
                <>
                  {" · zuletzt "}
                  <TimeAgo date={topic.lastActivityAt} />
                </>
              )}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
