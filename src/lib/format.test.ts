import { describe, expect, it } from "vitest";
import { formatBudget, formatCents, formatFollowers, formatPostBy, formatRelativeTime, isRecentlyCreated } from "@/lib/format";

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

describe("formatRelativeTime", () => {
  const tz = "Europe/Berlin";
  const now = Date.parse("2026-10-01T15:00:00+02:00");
  const ago = (ms: number) => formatRelativeTime(now - ms, now, tz);
  const MIN = 60_000;

  it("says just now under a minute", () => {
    expect(ago(30_000)).toBe("Just now");
  });
  it("treats a timestamp slightly in the future as just now", () => {
    expect(formatRelativeTime(now + 5_000, now, tz)).toBe("Just now");
  });
  it("counts minutes under an hour", () => {
    expect(ago(5 * MIN)).toBe("5 min ago");
    expect(ago(59 * MIN)).toBe("59 min ago");
  });
  it("counts hours on the same day", () => {
    expect(ago(3 * 60 * MIN)).toBe("3 h ago");
  });
  it("says yesterday for the previous calendar day, even under 24 hours", () => {
    expect(ago(16 * 60 * MIN)).toBe("Yesterday");
  });
  it("names the weekday within the past week", () => {
    expect(formatRelativeTime(Date.parse("2026-09-28T10:00:00+02:00"), now, tz)).toBe("Monday");
  });
  it("shows the date beyond a week", () => {
    expect(formatRelativeTime(Date.parse("2026-09-20T10:00:00+02:00"), now, tz)).toBe("Sep 20");
  });
  it("adds the year for an earlier year", () => {
    expect(formatRelativeTime(Date.parse("2025-12-24T10:00:00+01:00"), now, tz)).toBe("Dec 24, 2025");
  });
  it("goes by the viewer's calendar day, not UTC's", () => {
    // 00:30 in Berlin is still the previous day in UTC.
    const justAfterMidnight = Date.parse("2026-10-01T00:30:00+02:00");
    expect(formatRelativeTime(justAfterMidnight, now, tz)).toBe("14 h ago");
    expect(formatRelativeTime(justAfterMidnight, now, "UTC")).toBe("Yesterday");
  });
});
