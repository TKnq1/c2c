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
    expect(ids(tabLinks("CREATOR", true, counts(), label))).toEqual(["feed", "messages", "deals", "account"]);
    expect(ids(tabLinks("STARTUP", true, counts(), label))).toEqual(["requests", "messages", "deals", "account"]);
  });

  it("keeps the payments badge where there is no Deals tab to carry it", () => {
    const tabs = tabLinks("CREATOR", false, counts({ pendingPayments: 2 }), label);
    expect(tabs.find((l) => l.id === "payments")?.badge).toBe(2);
  });

  it("shows one badge per tab: messages unread, deals and payments waiting on you together", () => {
    const tabs = tabLinks("CREATOR", true, counts({ unreadMessages: 3, pendingPayments: 1, dealsToDo: 2 }), label);
    expect(tabs.map((l) => [l.id, l.badge])).toEqual([
      ["feed", 0],
      ["messages", 3],
      ["deals", 3],
      ["account", 0],
    ]);
    // Payments, wherever it is still listed, carries nothing.
    expect(appLinks("CREATOR", true, counts({ pendingPayments: 1 }), label).find((l) => l.id === "payments")?.badge).toBe(0);
  });

  it("opens the Deals tab on the deals that wait for you, and plainly when none do", () => {
    const waiting = tabLinks("STARTUP", true, counts({ dealsToDo: 1 }), label).find((l) => l.id === "deals");
    expect(waiting?.target).toBe("/dashboard/deals?filter=mine");
    const idle = tabLinks("STARTUP", true, counts({ pendingPayments: 4 }), label).find((l) => l.id === "deals");
    expect(idle?.target).toBeUndefined();
    expect(idle?.badge).toBe(4);
  });
});

describe("the current destination", () => {
  const tabs = tabLinks("CREATOR", true, counts(), label);
  const all = appLinks("CREATOR", true, counts(), label);

  it("treats the Payments and Invoices pages as part of Deals", () => {
    expect(activeHrefFor(tabs, "/dashboard/deals")).toBe("/dashboard/deals");
    expect(activeHrefFor(tabs, "/dashboard/deals/abc")).toBe("/dashboard/deals");
    expect(activeHrefFor(tabs, "/dashboard/creator/payments")).toBe("/dashboard/deals");
    expect(activeHrefFor(tabs, "/dashboard/invoices/xyz")).toBe("/dashboard/deals");
    expect(activeHrefFor(tabs, "/dashboard/business")).toBe("/dashboard/deals");
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
    // The sidebar has a Payments entry of its own, which stays the current one on that page.
    expect(activeHrefFor(all, "/dashboard/creator/payments")).toBe("/dashboard/creator/payments");
    expect(activeHrefFor(all, "/dashboard/invoices")).toBe("/dashboard/deals");
  });

  it("does not match a path that merely starts with the same letters", () => {
    expect(activeHrefFor(tabs, "/dashboard/dealsx")).toBeUndefined();
  });
});
