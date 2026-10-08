import type { Role } from "@prisma/client";
import { isMyTurn, type DealListItem } from "@/lib/deals/queries";
import { isTerminal } from "@/lib/deals/status";

// The filter in the address of the deals list (/dashboard/deals?filter=mine): "mine" are the deals that wait for the person, "active"
// all that are still running, "done" the finished ones. Links from a badge or a notification can land on exactly those.
export const DEAL_FILTERS = ["mine", "active", "done"] as const;
export type DealFilter = (typeof DEAL_FILTERS)[number];

export function parseDealFilter(value: string | string[] | undefined): DealFilter | null {
  const first = Array.isArray(value) ? value[0] : value;
  return (DEAL_FILTERS as readonly string[]).includes(first ?? "") ? (first as DealFilter) : null;
}

export function filterDeals<T extends Pick<DealListItem, "status" | "brandSignedAt" | "creatorSignedAt">>(deals: T[], filter: DealFilter | null, role: Role): T[] {
  if (!filter) return deals;
  if (filter === "done") return deals.filter((d) => isTerminal(d.status));
  const open = deals.filter((d) => !isTerminal(d.status));
  return filter === "active" ? open : open.filter((d) => isMyTurn(d, role));
}
