/** Farbige Hintergründe für „Text auf Bild“-Beiträge (wie Status-Posts). */
export const BACKGROUNDS = {
  lila: { label: "cargovibe", css: "linear-gradient(135deg, #A085FF 0%, #6E4FE0 100%)" },
  nacht: { label: "Nachtfahrt", css: "linear-gradient(135deg, #1F2340 0%, #3B2F7A 100%)" },
  sonne: { label: "Sonnenaufgang", css: "linear-gradient(135deg, #FF9A62 0%, #E5484D 100%)" },
  wald: { label: "Landstraße", css: "linear-gradient(135deg, #3DBE8B 0%, #1E7A5E 100%)" },
  himmel: { label: "Himmel", css: "linear-gradient(135deg, #5AB4FF 0%, #3D6BE0 100%)" },
} as const;

export type BackgroundKey = keyof typeof BACKGROUNDS;
export const BACKGROUND_KEYS = Object.keys(BACKGROUNDS) as [BackgroundKey, ...BackgroundKey[]];
