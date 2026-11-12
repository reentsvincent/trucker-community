import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTopic } from "@/community/repository";
import { AppHeader } from "@/components/AppHeader";
import { Feed, FeedSkeleton } from "@/components/Feed";
import { NewPostButton } from "@/components/NewPostButton";
import { SUPPORT_TOPICS, SupportNotice } from "@/components/SupportNotice";
import { TopicBar, TopicBarSkeleton } from "@/components/TopicBar";
import { requestDb } from "@/server/db";

export default function TopicPage(props: PageProps<"/thema/[id]">) {
  return (
    <>
      <AppHeader />
      <Suspense fallback={<TopicBarSkeleton />}>
        <ActiveTopicBar params={props.params} />
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <TopicFeed {...props} />
      </Suspense>
    </>
  );
}

async function ActiveTopicBar({ params }: Pick<PageProps<"/thema/[id]">, "params">) {
  const { id } = await params;
  return <TopicBar active={id} />;
}

async function TopicFeed({ params, searchParams }: PageProps<"/thema/[id]">) {
  const [{ id }, { vor }] = await Promise.all([params, searchParams]);
  const topic = await getTopic(await requestDb(), id);
  if (!topic) notFound();
  return (
    <>
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold">{topic.name}</h1>
        <p className="text-sm text-muted">{topic.description}</p>
        {SUPPORT_TOPICS.has(topic.id) && (
          <div className="mt-3">
            <SupportNotice />
          </div>
        )}
      </div>
      <Feed
        topicId={topic.id}
        basePath={`/thema/${topic.id}`}
        {...(typeof vor === "string" ? { before: vor } : {})}
      />
      <NewPostButton topicId={topic.id} />
    </>
  );
}
