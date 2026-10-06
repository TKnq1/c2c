import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { isBlocked } from "@/lib/moderation";
import { prisma } from "@/lib/prisma";
import { REQUEST_PHOTO_TYPES } from "@/lib/request-photo-types";

// Serves a request's photos (see src/lib/request-photos.ts) — signed-in
// users only, since they're only ever shown inside the app. An id is either
// a RequestImage id, whose bytes never change (so it caches for good), or
// "r_<requestId>" for the one image an older request may carry in its
// legacy imageUrl column.
//
// Who may see them is who may see the request: its brand, a creator while it's
// open (and the brand is active and hasn't blocked them), a creator who already
// has an interest in it, and admins. A closed request's photos are not for
// everyone with a link.
//
// Only raster types are ever served, with nosniff and a sandbox CSP, so an
// uploaded file can't be opened as a page (an SVG could carry script).
const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
};

type Viewer = { id: string; role: string; isAdmin?: boolean | null };

async function mayView(viewer: Viewer, requestId: string): Promise<boolean> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      status: true,
      startup: { select: { userId: true, user: { select: { suspendedAt: true } } } },
      interests: { where: { creator: { userId: viewer.id } }, select: { id: true }, take: 1 },
    },
  });
  if (!request) return false;
  if (hasAdminAccess({ role: viewer.role as "STARTUP" | "CREATOR" | "ADMIN", isAdmin: viewer.isAdmin })) return true;

  const ownerId = request.startup.userId;
  if (ownerId === viewer.id) return true;
  if (await isBlocked(viewer.id, ownerId)) return false;
  if (request.interests.length > 0) return true;
  return viewer.role === "CREATOR" && request.status === "OPEN" && request.startup.user.suspendedAt === null;
}

export async function GET(_request: Request, ctx: RouteContext<"/api/request-images/[id]">) {
  const session = await auth();
  if (!session) return new Response("Not authorized", { status: 401 });
  const { id } = await ctx.params;
  const viewer = { id: session.user.id, role: session.user.role, isAdmin: session.user.isAdmin };

  if (id.startsWith("r_")) {
    const requestId = id.slice(2);
    if (!(await mayView(viewer, requestId))) return new Response("Not found", { status: 404 });
    const request = await prisma.request.findUnique({ where: { id: requestId }, select: { imageUrl: true } });
    const match = request?.imageUrl?.match(/^data:([^;,]+);base64,([\s\S]*)$/);
    if (!match || !REQUEST_PHOTO_TYPES.includes(match[1])) return new Response("Not found", { status: 404 });
    return new Response(Buffer.from(match[2], "base64"), {
      headers: { ...HEADERS, "Content-Type": match[1], "Cache-Control": "private, max-age=3600" },
    });
  }

  const owner = await prisma.requestImage.findUnique({ where: { id }, select: { requestId: true } });
  if (!owner || !(await mayView(viewer, owner.requestId))) return new Response("Not found", { status: 404 });

  const image = await prisma.requestImage.findUnique({ where: { id }, select: { data: true, contentType: true } });
  if (!image || !REQUEST_PHOTO_TYPES.includes(image.contentType)) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(image.data), {
    headers: { ...HEADERS, "Content-Type": image.contentType, "Cache-Control": "private, max-age=3600" },
  });
}
