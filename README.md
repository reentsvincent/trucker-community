# Trucker Community

> Feature von **cargovibe**: eine Community für LKW-Fahrer. In Themenbereichen (z. B. Parkplätze, Recht & Lenkzeiten, Technik) können Fahrer Beiträge schreiben und kommentieren. Vorbild sind die Truckerforen, die Fahrer heute schon aktiv nutzen.

**Status:** Prototyp mit Oberfläche nach UI-Skizze.

**Live:** https://trucker-community.vercel.app (Vercel, Region Frankfurt; Datenbank: Neon-Postgres, Frankfurt)

## Umfang des Prototyps

- Feed mit Themen-Leiste („Alle Themen“ + einzelne Themen, Menü für alle Themen)
- Drei Beitragsarten: **Text**, **Text auf farbigem Hintergrund** (wie bei Facebook), **Foto**
- Kommentare unter jedem Beitrag; der neueste Kommentar erscheint als Vorschau im Feed
- Profilbilder (Foto-Upload, sonst Initialen)
- Fotos werden im Browser verkleinert und vorerst in Postgres gespeichert
- Anmeldung: vorerst Platzhalter, später der **cargovibe-Login** (`users.external_id` ist dafür reserviert)

Später: Bilder, Likes, Benachrichtigungen, Melden und Moderation.

## Technik

| Bereich     | Technologie                                        |
| ----------- | -------------------------------------------------- |
| Web-App     | Next.js 16 (App Router), TypeScript, Tailwind CSS  |
| Datenbank   | PostgreSQL mit Drizzle; lokal PGlite (eingebettet) |
| Validierung | zod                                                |
| Tests       | Vitest                                             |
| Hosting     | geplant: Vercel + Neon (Frankfurt)                 |

## Entwicklung

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm check         # Formatierung, Linting, Typprüfung, Tests
pnpm db:generate   # nach Schemaänderung: Migration erzeugen
pnpm db:seed       # Beispiel-Beiträge zum Vorführen anlegen
```

Ohne `DATABASE_URL` läuft ein eingebettetes Postgres in `.data/pglite`. Es muss nichts installiert werden.

## Veröffentlichen

```bash
npx vercel deploy --prod   # baut auf Vercel (inkl. Migrationen) und veröffentlicht
```

`DATABASE_URL` setzt die Neon-Integration automatisch. Die Migrationen laufen beim Bauen (`pnpm db:migrate`, siehe [vercel.json](vercel.json)).
