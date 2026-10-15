import type { Role } from "@prisma/client";
import { isMyTurn, type TurnInput } from "@/lib/deals/queries";
import { isTerminal } from "@/lib/deals/status";

// The filter in the address of the deals list (/dashboard/deals?filter=mine): "mine" are the deals that wait for the person, "active"
// all that are still running, "done" the finished ones. Links from a badge or a notification can land on exactly those.
export const DEAL_FILTERS = ["mine", "active", "done"] as const;
export type DealFilter = (typeof DEAL_FILTERS)[number];

export function parseDealFilter(value: string | string[] | undefined): DealFilter | null {
  const first = Array.isArray(value) ? value[0] : value;
  return (DEAL_FILTERS as readonly string[]).includes(first ?? "") ? (first as DealFilter) : null;
}

export function filterDeals<T extends TurnInput>(deals: T[], filter: DealFilter | null, role: Role): T[] {
  if (!filter) return deals;
  if (filter === "done") return deals.filter((d) => isTerminal(d.status));
  const open = deals.filter((d) => !isTerminal(d.status));
  return filter === "active" ? open : open.filter((d) => isMyTurn(d, role));
}

// An open offer waits for the side that did not make it.
export type OfferTurnInput = { offerRole: Role | null };

export function isOfferMyTurn(offer: OfferTurnInput, role: Role): boolean {
  return offer.offerRole !== null && offer.offerRole !== role;
}

// Open offers under the same filters: they are running, the ones to answer wait for the person, none is finished.
export function filterOffers<T extends OfferTurnInput>(offers: T[], filter: DealFilter | null, role: Role): T[] {
  if (filter === "done") return [];
  return filter === "mine" ? offers.filter((o) => isOfferMyTurn(o, role)) : offers;
}

// How many entries each filter shows, for the numbers on the filter bar. Interested creators without an offer only show under "all".
export function dealCounts<T extends TurnInput, O extends OfferTurnInput>(
  deals: T[],
  role: Role,
  offers: O[] = [],
  interested = 0,
): Record<"all" | DealFilter, number> {
  const count = (filter: DealFilter) => filterDeals(deals, filter, role).length + filterOffers(offers, filter, role).length;
  return {
    all: deals.length + offers.length + interested,
    mine: count("mine"),
    active: count("active"),
    done: count("done"),
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
