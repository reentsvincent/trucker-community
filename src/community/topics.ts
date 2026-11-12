/** Start-Themenbereiche, angelehnt an die Kategorien großer Truckerforen. */
export const DEFAULT_TOPICS = [
  {
    id: "parken",
    name: "Parkplätze & Rastanlagen",
    description: "Freie Plätze, Autohöfe, Duschen, Sicherheit über Nacht.",
  },
  {
    id: "strecke",
    name: "Verkehr & Strecken",
    description: "Baustellen, Sperrungen, Grenzübergänge, Fähren.",
  },
  {
    id: "recht",
    name: "Recht & Lenkzeiten",
    description: "Lenk- und Ruhezeiten, Kontrollen, Bußgelder, Arbeitsrecht.",
  },
  {
    id: "technik",
    name: "Technik & Fahrzeuge",
    description: "Zugmaschinen, Auflieger, Pannen, Werkstätten, Ausstattung.",
  },
  {
    id: "jobs",
    name: "Jobs & Speditionen",
    description: "Erfahrungen mit Arbeitgebern, Stellen, Lohn und Spesen.",
  },
  {
    id: "plauderecke",
    name: "Plauderecke",
    description: "Alles, was sonst noch auf dem Bock passiert.",
  },
] as const;
