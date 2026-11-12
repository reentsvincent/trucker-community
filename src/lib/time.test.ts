import { expect, it } from "vitest";
import { timeAgo } from "./time";

const now = new Date("2026-11-12T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

it.each([
  [10, "gerade eben"],
  [5 * 60, "vor 5 Minuten"],
  [29 * 60, "vor 29 Minuten"],
  [2 * 3600, "vor 2 Stunden"],
  [26 * 3600, "gestern"],
  [3 * 86400, "vor 3 Tagen"],
  [15 * 86400, "vor 2 Wochen"],
])("%i Sekunden → %s", (seconds, text) => {
  expect(timeAgo(ago(seconds), now)).toBe(text);
});
