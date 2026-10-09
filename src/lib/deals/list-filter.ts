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

// How many deals each filter shows, for the numbers on the filter bar.
export function dealCounts<T extends Pick<DealListItem, "status" | "brandSignedAt" | "creatorSignedAt">>(deals: T[], role: Role): Record<"all" | DealFilter, number> {
  return {
    all: deals.length,
    mine: filterDeals(deals, "mine", role).length,
    active: filterDeals(deals, "active", role).length,
    done: filterDeals(deals, "done", role).length,
  };
}

// From this many deals on, a brand's list is grouped by campaign: one brand runs the same request with many creators.
export const GROUP_BY_CAMPAIGN_FROM = 6;

// The deals of one campaign (request) together, in the order the campaigns first appear in the list.
export function groupByCampaign<T extends { interest: { request: { id: string; title: string } } }>(deals: T[]): { requestId: string; title: string; deals: T[] }[] {
  const groups = new Map<string, { requestId: string; title: string; deals: T[] }>();
  for (const deal of deals) {
    const { id, title } = deal.interest.request;
    const group = groups.get(id) ?? { requestId: id, title, deals: [] };
    group.deals.push(deal);
    groups.set(id, group);
  }
  return [...groups.values()];
}
