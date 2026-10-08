import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEAL_SECTIONS, NOTICE_SECTION, dealHref, linkWithSection } from "@/lib/deals/sections";
import { NOTICE_TEXT, type NoticeKey } from "@/lib/deals/notices";

describe("dealHref", () => {
  it("links to the deal, and to a part of its page", () => {
    expect(dealHref("d1")).toBe("/dashboard/deals/d1");
    expect(dealHref("d1", "drafts")).toBe("/dashboard/deals/d1#drafts");
  });
});

describe("linkWithSection", () => {
  it("opens a deal at the part its notice is about", () => {
    expect(linkWithSection("/dashboard/deals/d1", "draft_submitted")).toBe("/dashboard/deals/d1#drafts");
    expect(linkWithSection("/dashboard/deals/d1", "post_removed_creator")).toBe("/dashboard/deals/d1#posts");
    expect(linkWithSection("/dashboard/deals/d1", "dispute_opened")).toBe("/dashboard/deals/d1#dispute");
    expect(linkWithSection("/dashboard/deals/d1", "escrow_due")).toBe("/dashboard/deals/d1#escrow");
  });

  it("leaves other links alone", () => {
    expect(linkWithSection("/dashboard/invoices/i1", "invoice_issued_brand")).toBe("/dashboard/invoices/i1");
    expect(linkWithSection("/dashboard/creator/payments", "payout_blocked")).toBe("/dashboard/creator/payments");
    expect(linkWithSection("/dashboard/deals/d1#timeline", "draft_submitted")).toBe("/dashboard/deals/d1#timeline");
    expect(linkWithSection("/dashboard/deals/d1?x=1", "draft_submitted")).toBe("/dashboard/deals/d1?x=1");
    expect(linkWithSection("/dashboard/deals", "draft_submitted")).toBe("/dashboard/deals");
  });

  it("leaves a notice without a section at the top of the deal", () => {
    expect(linkWithSection("/dashboard/deals/d1", "payout_released_creator")).toBe("/dashboard/deals/d1");
  });
});

describe("the sections", () => {
  it("only name notices and sections that exist", () => {
    for (const [key, section] of Object.entries(NOTICE_SECTION)) {
      expect(key in NOTICE_TEXT, key).toBe(true);
      expect(DEAL_SECTIONS, key).toContain(section);
    }
    expect(Object.keys(NOTICE_SECTION).length).toBeGreaterThan(20);
    const typed: NoticeKey[] = Object.keys(NOTICE_SECTION) as NoticeKey[];
    expect(typed.length).toBe(Object.keys(NOTICE_SECTION).length);
  });

  it("are the ids the deal page puts on its parts", () => {
    // A link to #drafts only works if a part of the page has that id: the two are kept in step here.
    const panels = readFileSync(join(process.cwd(), "src/components/deals/panels.tsx"), "utf8");
    for (const section of DEAL_SECTIONS) expect(panels, section).toMatch(new RegExp(`<Section[^>]*\\bid="${section}"`));
  });
});
