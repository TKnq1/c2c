import { describe, expect, it } from "vitest";
import { cumulative, funnelSteps, percentChange } from "@/lib/admin-dashboard";

describe("percentChange", () => {
  it("rounds to a whole percent and handles a drop", () => {
    expect(percentChange(118, 100)).toBe(18);
    expect(percentChange(75, 100)).toBe(-25);
  });

  it("is null when there is nothing to compare with", () => {
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe("cumulative", () => {
  it("builds the running total that ends at today's total", () => {
    const points = [1, 2, 3].map((value, i) => ({ day: `2026-10-0${i + 1}`, value }));
    expect(cumulative(points, 10)).toEqual([5, 7, 10]);
  });
});

describe("funnelSteps", () => {
  it("gives each step its share of the one before", () => {
    const steps = funnelSteps([
      { label: "a", count: 200 },
      { label: "b", count: 150 },
      { label: "c", count: 0 },
    ]);
    expect(steps.map((s) => s.shareOfPrevious)).toEqual([null, 75, 0]);
  });

  it("has no share when the step before is empty", () => {
    expect(funnelSteps([{ label: "a", count: 0 }, { label: "b", count: 3 }])[1].shareOfPrevious).toBeNull();
  });
});
