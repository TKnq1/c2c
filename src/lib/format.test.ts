import { describe, expect, it } from "vitest";
import { formatBudget, formatCents, formatFollowers, formatPostBy, isRecentlyCreated } from "@/lib/format";

describe("formatCents", () => {
  it("formats whole euros", () => {
    expect(formatCents(25_000)).toBe("250,00 €");
  });

  it("formats fractional cents", () => {
    expect(formatCents(25_050)).toBe("250,50 €");
  });

  it("formats zero", () => {
    expect(formatCents(0)).toBe("0,00 €");
  });
});

describe("formatFollowers", () => {
  it("shows exact counts under 1000", () => {
    expect(formatFollowers(999)).toBe("999");
  });

  it("floors thousands instead of rounding", () => {
    // 1999 must read as 1K+, never 2K+ — rounding up would overstate reach.
    expect(formatFollowers(1_999)).toBe("1K+");
  });

  it("floors millions to one decimal", () => {
    expect(formatFollowers(1_250_000)).toBe("1.2M+");
  });
});

describe("isRecentlyCreated", () => {
  it("is true for something created moments ago", () => {
    expect(isRecentlyCreated(Date.now())).toBe(true);
  });

  it("is false for something created two weeks ago", () => {
    expect(isRecentlyCreated(Date.now() - 14 * 24 * 60 * 60 * 1000)).toBe(false);
  });
});

describe("formatBudget", () => {
  it("shows a range without cents", () => {
    expect(formatBudget(20_000, 40_000)).toBe("200–400 €");
  });

  it("shows a fixed price once", () => {
    expect(formatBudget(25_000, 25_000)).toBe("250 €");
  });

  it("keeps cents when there are some", () => {
    expect(formatBudget(19_950, 19_950)).toBe("199,50 €");
  });

  it("uses German thousands separators", () => {
    expect(formatBudget(150_000, 300_000)).toBe("1.500–3.000 €");
  });

  it("is empty for requests without a budget", () => {
    expect(formatBudget(null, null)).toBeNull();
  });
});

describe("formatPostBy", () => {
  it("reads a stored calendar day in UTC, so it never slips a day", () => {
    const year = new Date().getUTCFullYear();
    expect(formatPostBy(new Date(`${year}-10-15T00:00:00Z`))).toBe("Oct 15");
  });

  it("adds the year when it isn't this one", () => {
    const next = new Date().getUTCFullYear() + 1;
    expect(formatPostBy(new Date(`${next}-01-03T00:00:00Z`))).toBe(`Jan 3, ${next}`);
  });
});
