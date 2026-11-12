import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Feed, FeedSkeleton } from "@/components/Feed";
import { NewPostButton } from "@/components/NewPostButton";
import { TopicBar, TopicBarSkeleton } from "@/components/TopicBar";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <AppHeader />
      <Suspense fallback={<TopicBarSkeleton />}>
        <TopicBar active={null} />
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <HomeFeed searchParams={searchParams} />
      </Suspense>
      <NewPostButton />
    </>
  );
}

async function HomeFeed({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { vor } = await searchParams;
  return <Feed basePath="/" {...(typeof vor === "string" ? { before: vor } : {})} />;
}
