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
  // Further paths that belong to this destination (the Deals tab also covers its Payments and Invoices pages).
  covers?: string[];
};

export type NavCounts = { unreadCount: number; unreadMessages: number; pendingPayments: number; dealsToDo?: number; dealsVisible?: boolean };

type Labels = (id: NavId) => string;

export const DEALS_HREF = "/dashboard/deals";
export const INVOICES_HREF = "/dashboard/invoices";
export const BUSINESS_HREF = "/dashboard/business";

const homeOf = (role: Role) => (role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator");
export const paymentsHrefOf = (role: Role) => `${homeOf(role)}/payments`;
const settingsHrefOf = (role: Role) => `${homeOf(role)}/settings`;
export const discoverHrefOf = (role: Role) => `${homeOf(role)}/discover`;

// Everything the app offers, in sidebar order. Where brand deals are on, the money badges collapse into the one on Deals: it
// counts what waits for this person, deals and payments alike, and Payments itself carries none.
export function appLinks(role: Role, showDeals: boolean, counts: NavCounts, label: Labels): NavLink[] {
  const { unreadMessages, pendingPayments, dealsToDo = 0 } = counts;
  const link = (href: string, id: NavId, badge: number): NavLink => ({ href, id, label: label(id), badge });
  return [
    link(homeOf(role), role === "STARTUP" ? "requests" : "feed", 0),
    link(discoverHrefOf(role), "discover", 0),
    link("/dashboard/messages", "messages", unreadMessages),
    ...(showDeals ? [dealsLink(dealsToDo + pendingPayments, dealsToDo, label)] : []),
    link(paymentsHrefOf(role), "payments", showDeals ? 0 : pendingPayments),
    link(settingsHrefOf(role), "settings", 0),
  ];
}

function dealsLink(badge: number, dealsToDo: number, label: Labels): NavLink {
  return {
    href: DEALS_HREF,
    id: "deals",
    label: label("deals"),
    badge,
    // With something waiting the link opens straight onto it.
    target: dealsToDo > 0 ? `${DEALS_HREF}?filter=mine` : undefined,
    covers: [INVOICES_HREF, BUSINESS_HREF],
  };
}

// The phone's tab bar. Where brand deals are on it holds four tabs: home, messages, deals, account. Discover sits in the header
// then, and Payments and Invoices are tabs on the Deals pages (see DealsTabs). Without deals nothing changes.
export function tabLinks(role: Role, showDeals: boolean, counts: NavCounts, label: Labels): NavLink[] {
  const all = appLinks(role, showDeals, counts, label);
  if (!showDeals) return all;
  const tabs = all.filter((l) => l.id === "requests" || l.id === "feed" || l.id === "messages" || l.id === "deals");
  return [
    ...tabs.map((l) => (l.id === "deals" ? { ...l, covers: [...(l.covers ?? []), paymentsHrefOf(role)] } : l)),
    { href: settingsHrefOf(role), id: "account", label: label("account"), badge: 0 },
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
