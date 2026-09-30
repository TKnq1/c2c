import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REQUEST_PHOTO_TYPES } from "@/lib/request-photo-types";

// Serves a request's photos (see src/lib/request-photos.ts) — signed-in
// users only, since they're only ever shown inside the app. An id is either
// a RequestImage id, whose bytes never change (so it caches for good), or
// "r_<requestId>" for the one image an older request may carry in its
// legacy imageUrl column.
//
// Only raster types are ever served, with nosniff and a sandbox CSP, so an
// uploaded file can't be opened as a page (an SVG could carry script).
const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
};

export async function GET(_request: Request, ctx: RouteContext<"/api/request-images/[id]">) {
  const session = await auth();
  if (!session) return new Response("Not authorized", { status: 401 });
  const { id } = await ctx.params;

  if (id.startsWith("r_")) {
    const request = await prisma.request.findUnique({ where: { id: id.slice(2) }, select: { imageUrl: true } });
    const match = request?.imageUrl?.match(/^data:([^;,]+);base64,([\s\S]*)$/);
    if (!match || !REQUEST_PHOTO_TYPES.includes(match[1])) return new Response("Not found", { status: 404 });
    return new Response(Buffer.from(match[2], "base64"), {
      headers: { ...HEADERS, "Content-Type": match[1], "Cache-Control": "private, max-age=3600" },
    });
  }

  const image = await prisma.requestImage.findUnique({ where: { id }, select: { data: true, contentType: true } });
  if (!image || !REQUEST_PHOTO_TYPES.includes(image.contentType)) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(image.data), {
    headers: { ...HEADERS, "Content-Type": image.contentType, "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
