/**
 * Verkleinert ein Foto im Browser, bevor es hochgeladen wird: spart mobile
 * Daten und bleibt unter dem Upload-Limit. Ergebnis ist immer JPEG.
 */
export async function resizeImage(
  file: File,
  { maxSize = 1600, square = false, quality = 0.82 } = {},
): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  // Bei Profilbildern: mittiges Quadrat ausschneiden.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = square ? (bitmap.width - side) / 2 : 0;
  const sy = square ? (bitmap.height - side) / 2 : 0;
  const sw = square ? side : bitmap.width;
  const sh = square ? side : bitmap.height;
  const scale = Math.min(1, maxSize / Math.max(sw, sh));
  const width = Math.round(sw * scale);
  const height = Math.round(sh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Bild konnte nicht verarbeitet werden.");
  context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Bild konnte nicht verarbeitet werden.");
  return new File([blob], "foto.jpg", { type: "image/jpeg" });
}
