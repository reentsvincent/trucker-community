/** Start-Themenbereiche, angelehnt an große Truckerforen und die UI-Skizze. */
export const DEFAULT_TOPICS = [
  { id: "allgemein", name: "Allgemeines", description: "Alles rund um den Fahreralltag." },
  {
    id: "bewegt",
    name: "Was mich bewegt",
    description: "Familie, Einsamkeit, Stress, Sorgen – Platz für alles, was dich beschäftigt.",
  },
  {
    id: "parken",
    name: "Parkplätze",
    description: "Freie Plätze, Autohöfe, Duschen, Sicherheit über Nacht.",
  },
  {
    id: "strecke",
    name: "Verkehr",
    description: "Baustellen, Sperrungen, Grenzübergänge, Fähren.",
  },
  {
    id: "recht",
    name: "Recht & Lenkzeiten",
    description: "Lenk- und Ruhezeiten, Kontrollen, Bußgelder, Arbeitsrecht.",
  },
  { id: "gehalt", name: "Gehalt", description: "Lohn, Spesen, Zuschläge – was ist fair?" },
  { id: "jobs", name: "Jobs", description: "Erfahrungen mit Speditionen, Stellen, Wechsel." },
  {
    id: "technik",
    name: "Technik",
    description: "Zugmaschinen, Auflieger, Pannen, Werkstätten, Ausstattung.",
  },
  {
    id: "freizeit",
    name: "Sport & Freizeit",
    description: "Fit bleiben unterwegs, Kochen im Lkw, Hobbys.",
  },
] as const;
