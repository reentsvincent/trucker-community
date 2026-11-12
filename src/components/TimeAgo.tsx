"use client";

import { timeAgo } from "@/lib/time";

/**
 * Relative Zeit („vor 5 Minuten“). Läuft im Browser, weil die aktuelle Uhrzeit
 * nicht in vorab gerenderte Seiten eingebacken werden darf.
 */
export function TimeAgo({ date }: { date: Date | string }) {
  const value = typeof date === "string" ? new Date(date) : date;
  return (
    <time dateTime={value.toISOString()} suppressHydrationWarning>
      {timeAgo(value)}
    </time>
  );
}
