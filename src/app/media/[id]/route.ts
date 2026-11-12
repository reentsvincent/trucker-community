import { getImage } from "@/community/repository";
import { requestDb } from "@/server/db";

/** Liefert hochgeladene Bilder aus. Bilder ändern sich nie, daher lange cachebar. */
export async function GET(_request: Request, context: RouteContext<"/media/[id]">) {
  const { id } = await context.params;
  const image = await getImage(await requestDb(), id);
  if (!image) return new Response("Bild nicht gefunden", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "content-type": image.mimeType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
