import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { HOUR, takeToken } from "@/lib/rate-limit";
import { renderContractPdf } from "@/lib/deals/contract-pdf";
import { parseTaxSnapshot } from "@/lib/deals/parties";
import { parseTerms } from "@/lib/deals/terms";

// The contract of a deal as a PDF, for the two parties and for admins, nobody else. Built from the frozen terms, so every download
// of the same deal is the same file (until a signature or the fee changes what the document says about them).
const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cache-Control": "private, no-store",
};

export async function GET(_request: Request, ctx: RouteContext<"/api/deals/[id]/contract">) {
  const session = await auth();
  if (!session) return new Response("Not authorized", { status: 401 });
  const { id } = await ctx.params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      interest: {
        select: {
          payoutCents: true,
          platformFeeCents: true,
          creator: { select: { userId: true } },
          request: { select: { startup: { select: { userId: true } } } },
        },
      },
    },
  });
  if (!deal) return new Response("Not found", { status: 404 });

  const { creator, request } = deal.interest;
  const viewer = session.user.id === request.startup.userId ? "STARTUP" : session.user.id === creator.userId ? "CREATOR" : hasAdminAccess(session.user) ? "ADMIN" : null;
  if (!viewer) return new Response("Not found", { status: 404 });
  if (!(await takeToken("contract-pdf", session.user.id, 60, HOUR))) return new Response("Too many downloads. Try again later.", { status: 429 });

  const terms = parseTerms(deal.terms);
  const pdf = await renderContractPdf({
    dealId: deal.id,
    termsHash: deal.termsHash,
    terms,
    snapshot: parseTaxSnapshot(deal.taxSnapshot),
    viewer,
    payoutCents: deal.interest.payoutCents ?? terms.payoutCents,
    feeCents: deal.interest.platformFeeCents ?? terms.platformFeeCents,
    createdAt: deal.createdAt,
    brandSignedAt: deal.brandSignedAt,
    creatorSignedAt: deal.creatorSignedAt,
  });
  return new Response(Buffer.from(pdf), {
    headers: { ...HEADERS, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="comtor-vertrag-${deal.id}.pdf"` },
  });
}
