/** Themen, in denen persönliche und seelische Dinge besprochen werden. */
export const SUPPORT_TOPICS = new Set(["bewegt"]);

/**
 * Hinweis im Bereich „Was mich bewegt“: Umgangston und Hilfe in Krisen.
 * TelefonSeelsorge: kostenlos, anonym, rund um die Uhr.
 */
export function SupportNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="rounded-2xl border border-brand/30 bg-surface px-4 py-3.5 text-sm leading-relaxed">
      {!compact && (
        <p className="mb-2">
          Hier ist Platz für alles, was dich beschäftigt. <strong>Hör zu, sei respektvoll</strong>{" "}
          und urteile nicht – oft hilft es schon, dass jemand antwortet.
        </p>
      )}
      <p>
        <strong>Geht es dir gerade nicht gut?</strong> Die TelefonSeelsorge ist kostenlos, anonym
        und rund um die Uhr erreichbar:{" "}
        <a
          href="tel:08001110111"
          className="font-semibold whitespace-nowrap text-brand-ink underline"
        >
          0800 111 0 111
        </a>{" "}
        oder{" "}
        <a
          href="tel:08001110222"
          className="font-semibold whitespace-nowrap text-brand-ink underline"
        >
          0800 111 0 222
        </a>
        . Im Notfall:{" "}
        <a href="tel:112" className="font-semibold text-brand-ink underline">
          112
        </a>
        .
      </p>
    </aside>
  );
}
