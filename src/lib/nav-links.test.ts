import { describe, expect, it } from "vitest";
import { activeHrefFor, appLinks, tabLinks, type NavCounts } from "@/lib/nav-links";

const label = (id: string) => id;
const counts = (over: Partial<NavCounts> = {}): NavCounts => ({ unreadCount: 0, unreadMessages: 0, pendingPayments: 0, ...over });
const ids = (links: { id: string }[]) => links.map((l) => l.id);

describe("the tab bar", () => {
  it("is unchanged where brand deals are off", () => {
    expect(ids(tabLinks("CREATOR", false, counts(), label))).toEqual(["feed", "discover", "messages", "payments", "settings"]);
    expect(ids(tabLinks("STARTUP", false, counts(), label))).toEqual(["requests", "discover", "messages", "payments", "settings"]);
  });

  it("holds four tabs where brand deals are on", () => {
    expect(ids(tabLinks("CREATOR", true, counts(), label))).toEqual(["feed", "discover", "messages", "deals", "account"]);
    expect(ids(tabLinks("STARTUP", true, counts(), label))).toEqual(["requests", "discover", "messages", "deals", "account"]);
  });

  it("keeps the payments badge where there is no Deals tab to carry it", () => {
    const tabs = tabLinks("CREATOR", false, counts({ pendingPayments: 2 }), label);
    expect(tabs.find((l) => l.id === "payments")?.badge).toBe(2);
  });

  it("shows one badge per tab: messages unread, deals and payments waiting on you together", () => {
    const tabs = tabLinks("CREATOR", true, counts({ unreadMessages: 3, pendingPayments: 1, dealsToDo: 2 }), label);
    expect(tabs.map((l) => [l.id, l.badge])).toEqual([
      ["feed", 0],
      ["discover", 0],
      ["messages", 3],
      ["deals", 3],
      ["account", 0],
    ]);
    // The sidebar lists no Payments page then: the money lives under Deals.
    expect(ids(appLinks("CREATOR", true, counts({ pendingPayments: 1 }), label))).not.toContain("payments");
    expect(ids(appLinks("CREATOR", false, counts(), label))).toContain("payments");
  });

  it("opens the Deals tab on the deals that wait for you, and plainly when none do", () => {
    const waiting = tabLinks("STARTUP", true, counts({ dealsToDo: 1 }), label).find((l) => l.id === "deals");
    expect(waiting?.target).toBe("/dashboard/deals?filter=mine");
    const idle = tabLinks("STARTUP", true, counts({ pendingPayments: 4 }), label).find((l) => l.id === "deals");
    expect(idle?.target).toBeUndefined();
    const offer = tabLinks("CREATOR", true, counts({ pendingPayments: 1, offersToDo: 1 }), label).find((l) => l.id === "deals");
    expect(offer?.target).toBe("/dashboard/deals?filter=mine");
    expect(idle?.badge).toBe(4);
  });
});

describe("the current destination", () => {
  const tabs = tabLinks("CREATOR", true, counts(), label);
  const all = appLinks("CREATOR", true, counts(), label);

  it("treats the Invoices page (and the old Payments address) as part of Deals", () => {
    expect(activeHrefFor(tabs, "/dashboard/deals")).toBe("/dashboard/deals");
    expect(activeHrefFor(tabs, "/dashboard/deals/abc")).toBe("/dashboard/deals");
    expect(activeHrefFor(tabs, "/dashboard/creator/payments")).toBe("/dashboard/deals");
    expect(activeHrefFor(tabs, "/dashboard/invoices/xyz")).toBe("/dashboard/deals");
  });

  it("puts the business details under the account", () => {
    expect(activeHrefFor(tabs, "/dashboard/business")).toBe("/dashboard/creator/settings");
    expect(activeHrefFor(all, "/dashboard/business")).toBe("/dashboard/creator/settings");
  });

  it("keeps the other tabs apart", () => {
    expect(activeHrefFor(tabs, "/dashboard/creator")).toBe("/dashboard/creator");
    expect(activeHrefFor(tabs, "/dashboard/messages/abc")).toBe("/dashboard/messages");
    expect(activeHrefFor(tabs, "/dashboard/creator/settings")).toBe("/dashboard/creator/settings");
    expect(activeHrefFor(tabs, "/dashboard/notifications")).toBeUndefined();
  });

  it("lets the longer path win, so Discover is not mistaken for home", () => {
    expect(activeHrefFor(all, "/dashboard/creator/discover/abc")).toBe("/dashboard/creator/discover");
    expect(activeHrefFor(all, "/dashboard/creator/matches")).toBe("/dashboard/creator");
    expect(activeHrefFor(appLinks("CREATOR", false, counts(), label), "/dashboard/creator/payments")).toBe("/dashboard/creator/payments");
    expect(activeHrefFor(all, "/dashboard/invoices")).toBe("/dashboard/deals");
  });

  it("does not match a path that merely starts with the same letters", () => {
    expect(activeHrefFor(tabs, "/dashboard/dealsx")).toBeUndefined();
  });
});
