import { prisma } from "@/lib/prisma";

// A request's photos are served by /api/request-images/[id] rather than
// inlined, so a feed of requests only carries short URLs, not megabytes of
// image data.

// Add to a request query to get the photo ids in order — pair it with
// `omit: { imageUrl: true }` so the legacy data URI isn't loaded either.
export const requestPhotoIds = {
  images: { select: { id: true }, orderBy: { position: "asc" } },
} as const;

export function requestPhotoUrl(imageId: string) {
  return `/api/request-images/${imageId}`;
}

// Requests from before photos existed may still carry one image in the old
// Request.imageUrl column; the image route serves those under "r_<id>".
export function legacyRequestPhotoUrl(requestId: string) {
  return `/api/request-images/r_${requestId}`;
}

// Photo URLs for a batch of requests, cover first. Only requests with no
// photos cost an extra (id-only) query, to find the ones with a legacy image.
export async function photoUrlsByRequestId(requests: { id: string; images: { id: string }[] }[]) {
  const urls = new Map(requests.map((r) => [r.id, r.images.map((i) => requestPhotoUrl(i.id))]));
  const bare = requests.filter((r) => r.images.length === 0).map((r) => r.id);
  if (bare.length > 0) {
    const legacy = await prisma.request.findMany({
      where: { id: { in: bare }, imageUrl: { not: null } },
      select: { id: true },
    });
    for (const { id } of legacy) urls.set(id, [legacyRequestPhotoUrl(id)]);
  }
  return urls;
}

// A brand's rating from creators' reviews — what the card shows under its
// name, here for the New request form's live preview.
export async function brandRating(startupId: string) {
  const agg = await prisma.review.aggregate({
    where: { startupId, authorRole: "CREATOR" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return { average: agg._avg.rating ?? 0, count: agg._count._all };
}
