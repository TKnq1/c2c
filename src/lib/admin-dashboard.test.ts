import { describe, expect, it } from "vitest";
import { cumulative, funnelBarWidth, funnelSteps, percentChange } from "@/lib/admin-dashboard";

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

describe("funnelBarWidth", () => {
  it("fills the first step and shows the share of the later ones", () => {
    const steps = funnelSteps([
      { label: "a", count: 200 },
      { label: "b", count: 150 },
    ]);
    expect(steps.map((s) => funnelBarWidth(s))).toEqual([100, 75]);
  });

  it("leaves a step with nothing in it empty, even when the step before is empty too", () => {
    const steps = funnelSteps([
      { label: "a", count: 0 },
      { label: "b", count: 0 },
    ]);
    expect(steps.map((s) => funnelBarWidth(s))).toEqual([0, 0]);
  });

  it("fills a step that has no share but something in it, and never runs past the track", () => {
    expect(funnelBarWidth({ label: "a", count: 3, shareOfPrevious: null })).toBe(100);
    expect(funnelBarWidth({ label: "b", count: 9, shareOfPrevious: 150 })).toBe(100);
  });
});
