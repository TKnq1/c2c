import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

// Serves a post proof (a screenshot the creator uploaded) to the two parties of the deal and to admins, nobody else.
// Only raster types ever come out of the database (the upload sniffs the bytes), and the response is locked down so the
// file can never be opened as a page.
const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cache-Control": "private, no-store",
};

export async function GET(_request: Request, ctx: RouteContext<"/api/deals/[id]/proofs/[proofId]">) {
  const session = await auth();
  if (!session) return new Response("Not authorized", { status: 401 });
  const { id, proofId } = await ctx.params;

  const proof = await prisma.dealProof.findUnique({
    where: { id: proofId },
    select: {
      contentType: true,
      data: true,
      purgedAt: true,
      post: {
        select: {
          dealId: true,
          deal: { select: { interest: { select: { creator: { select: { userId: true } }, request: { select: { startup: { select: { userId: true } } } } } } } },
        },
      },
    },
  });
  if (!proof || proof.post.dealId !== id) return new Response("Not found", { status: 404 });

  const { creator, request } = proof.post.deal.interest;
  const isParty = session.user.id === creator.userId || session.user.id === request.startup.userId;
  if (!isParty && !hasAdminAccess(session.user)) return new Response("Not found", { status: 404 });

  // Deleted after the retention period (src/lib/deals/retention.ts): gone, not missing.
  if (proof.purgedAt) return new Response("This proof was deleted after the retention period.", { status: 410, headers: HEADERS });

  return new Response(new Uint8Array(proof.data), { headers: { ...HEADERS, "Content-Type": proof.contentType } });
}
