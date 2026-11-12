import Link from "next/link";
import { listTopics } from "@/community/repository";
import { requestDb } from "@/server/db";

/** Themen-Chips nach Skizze: „Alle Themen“, einzelne Themen, rechts Menü für alle Themen. */
export async function TopicBar({ active }: { active: string | null }) {
  const topics = await listTopics(await requestDb());
  return (
    <nav aria-label="Themen" className="flex items-center gap-2 border-b border-line px-4 pb-3">
      <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
        <Chip href="/" active={active === null}>
          Alle Themen
        </Chip>
        {topics.map((topic) => (
          <Chip key={topic.id} href={`/thema/${topic.id}`} active={active === topic.id}>
            {topic.name}
          </Chip>
        ))}
      </div>
      <Link
        href="/themen"
        aria-label="Alle Themen anzeigen"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M5 7h14M5 12h14M5 17h9" />
        </svg>
      </Link>
    </nav>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "border-brand bg-brand text-white"
          : "border-line bg-white text-ink hover:border-brand"
      }`}
    >
      {children}
    </Link>
  );
}

export function TopicBarSkeleton() {
  return (
    <div className="flex gap-2 border-b border-line px-4 pb-3">
      {[96, 72, 88, 64].map((width) => (
        <span key={width} className="h-8 shrink-0 rounded-full bg-line" style={{ width }} />
      ))}
    </div>
  );
}
