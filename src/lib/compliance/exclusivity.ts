import { errorIssue, warningIssue, type Issue } from "@/lib/deals/issues";

// Exclusivity and non-compete windows: "no competing brand N days before / after publication". A brand sets it in the
// briefing; once a deal exists it binds the creator for the window around the publication date, and it also keeps the
// brand from being the competitor in somebody else's window.

export const EXCLUSIVITY_MAX_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ExclusivityTerms = {
  enabled: boolean;
  // Product categories that count as competing. Empty with enabled: the deal's own category.
  categories: string[];
  // Brand names that count as competing, whatever their category.
  competitors: string[];
  daysBefore: number;
  daysAfter: number;
};

export const NO_EXCLUSIVITY: ExclusivityTerms = { enabled: false, categories: [], competitors: [], daysBefore: 0, daysAfter: 0 };

export function validateExclusivityTerms(terms: ExclusivityTerms): Issue[] {
  if (!terms.enabled) return [];
  const issues: Issue[] = [];
  if (terms.daysBefore <= 0 && terms.daysAfter <= 0) issues.push(errorIssue("EXCLUSIVITY_DAYS_REQUIRED", "exclusivityDaysAfter"));
  if (terms.daysBefore > EXCLUSIVITY_MAX_DAYS || terms.daysAfter > EXCLUSIVITY_MAX_DAYS) {
    issues.push(errorIssue("EXCLUSIVITY_DAYS_TOO_LONG", "exclusivityDaysAfter", { max: EXCLUSIVITY_MAX_DAYS }));
  }
  return issues;
}

// A deal as the check sees it. Dates are the best knowledge there is: the live date, else the planned date, else the
// posting window, else nothing (then it cannot clash with anything yet).
export type ExclusivityDeal = {
  id: string;
  startupId: string;
  brandName: string;
  productCategory: string;
  exclusivity: ExclusivityTerms;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  windowStart: Date | null;
  windowEnd: Date | null;
};

export type DateRange = { start: Date; end: Date };

export function publicationRange(deal: Pick<ExclusivityDeal, "publishedAt" | "scheduledFor" | "windowStart" | "windowEnd">): DateRange | null {
  const exact = deal.publishedAt ?? deal.scheduledFor;
  if (exact) return { start: exact, end: exact };
  if (deal.windowStart && deal.windowEnd) return { start: deal.windowStart, end: deal.windowEnd };
  if (deal.windowEnd) return { start: deal.windowEnd, end: deal.windowEnd };
  return null;
}

// The days around the publication in which competitors are shut out.
export function protectedRange(deal: ExclusivityDeal): DateRange | null {
  if (!deal.exclusivity.enabled) return null;
  const published = publicationRange(deal);
  if (!published) return null;
  return {
    start: new Date(published.start.getTime() - deal.exclusivity.daysBefore * DAY_MS),
    end: new Date(published.end.getTime() + deal.exclusivity.daysAfter * DAY_MS),
  };
}

function normaliseName(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

// Whether `other` is a competitor under `holder`'s exclusivity terms.
export function competesWith(holder: ExclusivityDeal, other: Pick<ExclusivityDeal, "brandName" | "productCategory">): boolean {
  const { categories, competitors } = holder.exclusivity;
  const scope = categories.length > 0 ? categories : [holder.productCategory];
  if (scope.some((c) => normaliseName(c) === normaliseName(other.productCategory))) return true;
  return competitors.some((c) => normaliseName(c) === normaliseName(other.brandName));
}

export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start.getTime() <= b.end.getTime() && b.start.getTime() <= a.end.getTime();
}

export type ExclusivityConflict = {
  dealId: string;
  brandName: string;
  // BLOCKED_BY_EXISTING: the other deal's window covers this deal's publication.
  // BLOCKS_EXISTING: this deal's window would cover the other deal's publication.
  direction: "BLOCKED_BY_EXISTING" | "BLOCKS_EXISTING";
  rangeStart: Date;
  rangeEnd: Date;
};

// Compares a deal with the creator's other deals. Deals of the same brand never clash with each other.
export function findExclusivityConflicts(candidate: ExclusivityDeal, others: ExclusivityDeal[]): ExclusivityConflict[] {
  const conflicts: ExclusivityConflict[] = [];
  const candidatePublication = publicationRange(candidate);
  const candidateProtected = protectedRange(candidate);

  for (const other of others) {
    if (other.id === candidate.id || other.startupId === candidate.startupId) continue;

    const otherProtected = protectedRange(other);
    if (otherProtected && candidatePublication && competesWith(other, candidate) && rangesOverlap(otherProtected, candidatePublication)) {
      conflicts.push({ dealId: other.id, brandName: other.brandName, direction: "BLOCKED_BY_EXISTING", rangeStart: otherProtected.start, rangeEnd: otherProtected.end });
      continue;
    }

    const otherPublication = publicationRange(other);
    if (candidateProtected && otherPublication && competesWith(candidate, other) && rangesOverlap(candidateProtected, otherPublication)) {
      conflicts.push({ dealId: other.id, brandName: other.brandName, direction: "BLOCKS_EXISTING", rangeStart: candidateProtected.start, rangeEnd: candidateProtected.end });
    }
  }
  return conflicts;
}

// Conflicts as issues. They are errors once the deal being checked has an exact publication date (the creator picked a day
// inside somebody's window, or inside the window this deal's own exclusivity spans), and warnings while only the posting
// window is known: then the creator can still choose a day outside the protected range.
export function exclusivityIssues(candidate: ExclusivityDeal, conflicts: ExclusivityConflict[]): Issue[] {
  const exact = Boolean(candidate.publishedAt ?? candidate.scheduledFor);
  return conflicts.map((conflict) => {
    const code = conflict.direction === "BLOCKED_BY_EXISTING" ? "EXCLUSIVITY_CONFLICT_EXISTING" : "EXCLUSIVITY_CONFLICT_OTHER_DEAL";
    const params = { brand: conflict.brandName };
    return exact ? errorIssue(code, "scheduledFor", params) : warningIssue(code, "scheduledFor", params);
  });
}
