import type { Author } from "@/community/repository";
import { avatarColor, initials } from "@/lib/avatar";

const SIZES = { sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-20 text-2xl" } as const;

/** Rundes Profilbild: hochgeladenes Foto oder, falls keins da ist, Initialen. */
export function Avatar({ author, size = "sm" }: { author: Author; size?: keyof typeof SIZES }) {
  if (author.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={author.avatarUrl}
        alt=""
        className={`shrink-0 rounded-full object-cover ${SIZES[size]}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${SIZES[size]}`}
      style={{ backgroundColor: avatarColor(author.id) }}
    >
      {initials(author.displayName)}
    </span>
  );
}
