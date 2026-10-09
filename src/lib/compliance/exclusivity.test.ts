import { describe, expect, it } from "vitest";
import {
  competesWith,
  exclusivityIssues,
  findExclusivityConflicts,
  protectedRange,
  publicationRange,
  type ExclusivityDeal,
} from "@/lib/compliance/exclusivity";

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

function deal(partial: Partial<ExclusivityDeal> & { id: string }): ExclusivityDeal {
  return {
    startupId: partial.id,
    brandName: `Brand ${partial.id}`,
    productCategory: "Cosmetics",
    exclusivity: { enabled: false, categories: [], competitors: [], daysBefore: 0, daysAfter: 0 },
    publishedAt: null,
    scheduledFor: null,
    windowStart: null,
    windowEnd: null,
    ...partial,
  };
}

const exclusive = (daysBefore: number, daysAfter: number, extra: Partial<ExclusivityDeal["exclusivity"]> = {}) => ({
  enabled: true,
  categories: [],
  competitors: [],
  daysBefore,
  daysAfter,
  ...extra,
});

describe("publicationRange", () => {
  it("prefers the live date, then the planned date, then the window", () => {
    expect(publicationRange(deal({ id: "a", publishedAt: day("2026-10-10"), scheduledFor: day("2026-10-12") }))?.start).toEqual(day("2026-10-10"));
    expect(publicationRange(deal({ id: "a", scheduledFor: day("2026-10-12") }))?.start).toEqual(day("2026-10-12"));
    expect(publicationRange(deal({ id: "a", windowStart: day("2026-10-01"), windowEnd: day("2026-10-20") }))).toEqual({ start: day("2026-10-01"), end: day("2026-10-20") });
    expect(publicationRange(deal({ id: "a" }))).toBeNull();
  });
});

describe("protectedRange", () => {
  it("spreads the days before and after the publication", () => {
    const range = protectedRange(deal({ id: "a", scheduledFor: day("2026-10-20"), exclusivity: exclusive(7, 14) }));
    expect(range?.start).toEqual(day("2026-10-13"));
    expect(range?.end).toEqual(day("2026-11-03"));
  });

  it("is null when there is no exclusivity or nothing is planned yet", () => {
    expect(protectedRange(deal({ id: "a", scheduledFor: day("2026-10-20") }))).toBeNull();
    expect(protectedRange(deal({ id: "a", exclusivity: exclusive(7, 14) }))).toBeNull();
  });
});

describe("competesWith", () => {
  it("falls back to the holder's own category, and also matches named competitors", () => {
    const holder = deal({ id: "h", exclusivity: exclusive(0, 10), productCategory: "Cosmetics" });
    expect(competesWith(holder, { brandName: "Other", productCategory: "cosmetics" })).toBe(true);
    expect(competesWith(holder, { brandName: "Other", productCategory: "Electronics" })).toBe(false);
    const named = deal({ id: "h", exclusivity: exclusive(0, 10, { competitors: ["Rival  GmbH"] }) });
    expect(competesWith(named, { brandName: "rival gmbh", productCategory: "Electronics" })).toBe(true);
  });

  it("uses the listed categories instead of the own one when there are any", () => {
    const holder = deal({ id: "h", exclusivity: exclusive(0, 10, { categories: ["Supplements"] }) });
    expect(competesWith(holder, { brandName: "x", productCategory: "Cosmetics" })).toBe(false);
    expect(competesWith(holder, { brandName: "x", productCategory: "Supplements" })).toBe(true);
  });
});

describe("findExclusivityConflicts", () => {
  it("blocks a competitor's post inside the days after an existing exclusive post", () => {
    const existing = deal({ id: "a", scheduledFor: day("2026-10-10"), exclusivity: exclusive(0, 14) });
    const candidate = deal({ id: "b", scheduledFor: day("2026-10-20") });
    const conflicts = findExclusivityConflicts(candidate, [existing]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ dealId: "a", direction: "BLOCKED_BY_EXISTING" });
    expect(findExclusivityConflicts(deal({ id: "b", scheduledFor: day("2026-11-01") }), [existing])).toEqual([]);
  });

  it("blocks a post inside the days before as well", () => {
    const existing = deal({ id: "a", scheduledFor: day("2026-10-20"), exclusivity: exclusive(7, 0) });
    expect(findExclusivityConflicts(deal({ id: "b", scheduledFor: day("2026-10-15") }), [existing])).toHaveLength(1);
    expect(findExclusivityConflicts(deal({ id: "b", scheduledFor: day("2026-10-05") }), [existing])).toEqual([]);
  });

  it("also reports when the candidate's own exclusivity would cover an existing post", () => {
    const existing = deal({ id: "a", scheduledFor: day("2026-10-12") });
    const candidate = deal({ id: "b", scheduledFor: day("2026-10-10"), exclusivity: exclusive(0, 7) });
    expect(findExclusivityConflicts(candidate, [existing])[0]).toMatchObject({ dealId: "a", direction: "BLOCKS_EXISTING" });
  });

  it("ignores other categories, the same brand and the deal itself", () => {
    const existing = deal({ id: "a", scheduledFor: day("2026-10-10"), exclusivity: exclusive(0, 14) });
    expect(findExclusivityConflicts(deal({ id: "b", scheduledFor: day("2026-10-12"), productCategory: "Electronics" }), [existing])).toEqual([]);
    expect(findExclusivityConflicts(deal({ id: "b", startupId: "a", scheduledFor: day("2026-10-12") }), [existing])).toEqual([]);
    expect(findExclusivityConflicts(existing, [existing])).toEqual([]);
  });

  it("compares posting windows when no exact date is known, and only warns", () => {
    const existing = deal({ id: "a", windowStart: day("2026-10-01"), windowEnd: day("2026-10-10"), exclusivity: exclusive(0, 30) });
    const candidate = deal({ id: "b", windowStart: day("2026-10-20"), windowEnd: day("2026-10-25") });
    const conflicts = findExclusivityConflicts(candidate, [existing]);
    expect(conflicts).toHaveLength(1);
    expect(exclusivityIssues(candidate, conflicts).map((i) => i.severity)).toEqual(["warning"]);
    const exact = { ...candidate, scheduledFor: day("2026-10-22") };
    expect(exclusivityIssues(exact, findExclusivityConflicts(exact, [existing])).map((i) => i.severity)).toEqual(["error"]);
  });
});
