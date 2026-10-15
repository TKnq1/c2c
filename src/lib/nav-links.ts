import type { Role } from "@prisma/client";

// Which destinations the navigation shows, and which of them is the current one. Pure, so the rules (which tabs where brand deals
// are on, which badge sits where) are tested without rendering the bar.

export type NavId = "requests" | "feed" | "discover" | "messages" | "deals" | "payments" | "settings" | "account" | "matches" | "notifications";

export type NavLink = {
  // The page the link stands for; what the current path is matched against.
  href: string;
  id: NavId;
  label: string;
  badge: number;
  // Where the link goes when that is not `href` itself (the Deals tab opens the list of deals that wait for you).
  target?: string;
  // Further paths that belong to this destination (the Deals tab also covers its Invoices page).
  covers?: string[];
};

// pendingPayments includes offersToDo: the offers that wait for an answer, which sit on the Deals list where there is one.
export type NavCounts = { unreadCount: number; unreadMessages: number; pendingPayments: number; dealsToDo?: number; offersToDo?: number; dealsVisible?: boolean };

type Labels = (id: NavId) => string;

export const DEALS_HREF = "/dashboard/deals";
export const INVOICES_HREF = "/dashboard/invoices";
export const BUSINESS_HREF = "/dashboard/business";

const homeOf = (role: Role) => (role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator");
export const paymentsHrefOf = (role: Role) => `${homeOf(role)}/payments`;
const PAYMENTS_HREFS = [paymentsHrefOf("STARTUP"), paymentsHrefOf("CREATOR")] as const;
const settingsHrefOf = (role: Role) => `${homeOf(role)}/settings`;
export const discoverHrefOf = (role: Role) => `${homeOf(role)}/discover`;

// Everything the app offers, in sidebar order. Where brand deals are on, the money lives under Deals (the Payments page
// forwards there) and its badge counts what waits for this person, deals and payments alike; without them Payments is
// where the money is. The business details belong to the settings.
export function appLinks(role: Role, showDeals: boolean, counts: NavCounts, label: Labels): NavLink[] {
  const { unreadMessages, pendingPayments, dealsToDo = 0, offersToDo = 0 } = counts;
  const link = (href: string, id: NavId, badge: number): NavLink => ({ href, id, label: label(id), badge });
  return [
    link(homeOf(role), role === "STARTUP" ? "requests" : "feed", 0),
    link(discoverHrefOf(role), "discover", 0),
    link("/dashboard/messages", "messages", unreadMessages),
    ...(showDeals ? [dealsLink(dealsToDo + pendingPayments, dealsToDo + offersToDo, label)] : []),
    ...(showDeals ? [] : [link(paymentsHrefOf(role), "payments", pendingPayments)]),
    { ...link(settingsHrefOf(role), "settings", 0), covers: [BUSINESS_HREF] },
  ];
}

function dealsLink(badge: number, onDealsList: number, label: Labels): NavLink {
  return {
    href: DEALS_HREF,
    id: "deals",
    label: label("deals"),
    badge,
    // With a deal or an offer waiting the link opens straight onto it.
    target: onDealsList > 0 ? `${DEALS_HREF}?filter=mine` : undefined,
    covers: [INVOICES_HREF, PAYMENTS_HREFS[0], PAYMENTS_HREFS[1]],
  };
}

// The phone's tab bar, five tabs either way: home, Discover, messages, then deals and account where brand deals are on (Invoices
// is a tab on the Deals pages then, see DealsTabs), or Payments and settings where they are not.
export function tabLinks(role: Role, showDeals: boolean, counts: NavCounts, label: Labels): NavLink[] {
  const all = appLinks(role, showDeals, counts, label);
  if (!showDeals) return all;
  const tabs = all.filter((l) => l.id === "requests" || l.id === "feed" || l.id === "discover" || l.id === "messages" || l.id === "deals");
  return [
    ...tabs,
    { href: settingsHrefOf(role), id: "account", label: label("account"), badge: 0, covers: [BUSINESS_HREF] },
  ];
}

// Longest path wins, so /dashboard/startup/discover/xyz belongs to Discover and not to the more general home
// (/dashboard/startup), which still has to catch /dashboard/startup/requests/[id] and /dashboard/startup/new.
export function activeHrefFor(links: NavLink[], pathname: string): string | undefined {
  let best: { href: string; length: number } | undefined;
  for (const l of links) {
    for (const path of [l.href, ...(l.covers ?? [])]) {
      if ((pathname === path || pathname.startsWith(`${path}/`)) && (!best || path.length > best.length)) best = { href: l.href, length: path.length };
    }
  }
  return best?.href;
}
