import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentMemberForPage } from "@/server/session";
import { Avatar } from "./Avatar";

/** Kopf nach Skizze: Titelkarte links, Profil rechts. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-white/90 px-4 pt-4 pb-3 backdrop-blur">
      <Link
        href="/"
        className="flex flex-1 flex-col rounded-2xl bg-brand px-4 py-2.5 text-white shadow-sm shadow-brand/30"
      >
        <span className="text-lg leading-tight font-bold tracking-tight">Trucker Community</span>
        <span className="flex items-center gap-1.5 text-xs text-white/85">
          by
          <Image
            src="/cargovibe-logo.png"
            alt="cargovibe"
            width={76}
            height={20}
            // Logo ist lila; auf lila Grund weiß darstellen.
            className="h-auto w-[76px] brightness-0 invert"
            priority
          />
        </span>
      </Link>
      <Suspense fallback={<span className="size-12 rounded-full bg-line" />}>
        <ProfileButton />
      </Suspense>
    </header>
  );
}

async function ProfileButton() {
  const member = await getCurrentMemberForPage();
  if (!member) {
    return (
      <Link
        href="/anmelden"
        className="flex size-12 items-center justify-center rounded-full border-2 border-brand text-brand-ink"
        aria-label="Anmelden"
      >
        <PersonIcon />
      </Link>
    );
  }
  return (
    <Link href="/profil" aria-label={`Profil von ${member.displayName}`} className="rounded-full">
      <Avatar author={member} size="md" />
    </Link>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6v1H4z" />
    </svg>
  );
}
