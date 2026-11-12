# Trucker Community

> Feature von **cargovibe**: eine Community für LKW-Fahrer. In Themenbereichen (z. B. Parkplätze, Recht & Lenkzeiten, Technik) können Fahrer Beiträge schreiben und kommentieren. Vorbild sind die Truckerforen, die Fahrer heute schon aktiv nutzen.

**Status:** Prototyp. Datenmodell und Logik stehen, die Oberfläche folgt (nach UI-Skizze).

## Umfang des Prototyps

- Themenbereiche mit Beitragszahl und letzter Aktivität
- Beiträge (Titel + Text), sortiert nach letzter Aktivität wie in Foren
- Kommentare unter Beiträgen
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
```

Ohne `DATABASE_URL` läuft ein eingebettetes Postgres in `.data/pglite`. Es muss nichts installiert werden.
