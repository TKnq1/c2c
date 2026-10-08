import { prisma } from "@/lib/prisma";
import { exclusivityIssues, findExclusivityConflicts, type ExclusivityDeal } from "@/lib/compliance/exclusivity";
import type { Issue } from "@/lib/deals/issues";
import { parseTerms } from "@/lib/deals/terms";

type DealForExclusivity = {
  id: string;
  startupId: string;
  terms: unknown;
  scheduledFor: Date | null;
  postWindowStart: Date | null;
  postWindowEnd: Date | null;
  posts: { publishedAt: Date | null; status: string }[];
};

function dayStart(iso: string | null): Date | null {
  return iso ? new Date(`${iso}T00:00:00Z`) : null;
}

function dayEnd(iso: string | null): Date | null {
  return iso ? new Date(`${iso}T23:59:59.999Z`) : null;
}

export function toExclusivityDeal(deal: DealForExclusivity, override: { scheduledFor?: Date | null; publishedAt?: Date | null } = {}): ExclusivityDeal {
  const terms = parseTerms(deal.terms);
  const live = deal.posts.filter((p) => p.status !== "REMOVED" && p.status !== "REJECTED" && p.publishedAt).map((p) => p.publishedAt as Date);
  const earliest = live.length > 0 ? new Date(Math.min(...live.map((d) => d.getTime()))) : null;
  return {
    id: deal.id,
    startupId: deal.startupId,
    brandName: terms.brandName,
    productCategory: terms.productCategory,
    exclusivity: terms.exclusivity,
    publishedAt: override.publishedAt ?? earliest,
    scheduledFor: override.scheduledFor ?? deal.scheduledFor,
    windowStart: deal.postWindowStart ?? dayStart(terms.workflow.postingWindowStart),
    windowEnd: deal.postWindowEnd ?? dayEnd(terms.workflow.postingWindowEnd),
  };
}

// Exclusivity findings for one deal against the creator's other deals. Without an exact date only the posting windows
// can be compared, and those findings are warnings; with `override` (a date the creator just chose) they are errors.
export async function exclusivityIssuesFor(dealId: string, override: { scheduledFor?: Date | null; publishedAt?: Date | null } = {}): Promise<Issue[]> {
  const select = { id: true, startupId: true, creatorId: true, terms: true, scheduledFor: true, postWindowStart: true, postWindowEnd: true, posts: { select: { publishedAt: true, status: true } } } as const;
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select });
  if (!deal) return [];
  const others = await prisma.deal.findMany({
    where: { creatorId: deal.creatorId, id: { not: dealId }, status: { notIn: ["CANCELLED", "CONTRACT_PENDING"] } },
    select,
  });
  const candidate = toExclusivityDeal(deal, override);
  const existing = others.map((d) => toExclusivityDeal(d));
  return exclusivityIssues(candidate, findExclusivityConflicts(candidate, existing));
}
