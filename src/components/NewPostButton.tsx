import Link from "next/link";

/** Schwebender Knopf zum Schreiben, gut mit dem Daumen erreichbar. */
export function NewPostButton({ topicId }: { topicId?: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-xl justify-end p-5">
      <Link
        href={topicId ? `/neu?thema=${topicId}` : "/neu"}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-brand px-5 py-3.5 font-semibold text-white shadow-lg shadow-brand/40"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Beitrag
      </Link>
    </div>
  );
}
