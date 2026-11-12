/** Initialen aus „Vorname Nachname“: „KK“. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const PALETTE = ["#A085FF", "#6E4FE0", "#3DBE8B", "#FF9A62", "#5AB4FF", "#E5484D", "#1F2340"];

/** Feste Farbe pro Mitglied, damit man Leute im Feed wiedererkennt. */
export function avatarColor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length] ?? "#A085FF";
}
