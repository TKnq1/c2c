import { describe, expect, it } from "vitest";
import { formatCents, formatFollowers, isRecentlyCreated } from "@/lib/format";

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
