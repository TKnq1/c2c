import { describe, expect, it } from "vitest";
import { smoothPath } from "@/lib/smooth-path";

// The y values the curve's control points take, for checking that it never leaves the range of its neighbours.
const controlYs = (path: string) => [...path.matchAll(/C[\d.]+ ([\d.]+) [\d.]+ ([\d.]+) /g)].flatMap((m) => [Number(m[1]), Number(m[2])]);

describe("smoothPath", () => {
  it("needs two points", () => {
    expect(smoothPath([])).toBe("");
    expect(smoothPath([[0, 5]])).toBe("");
    expect(smoothPath([[0, 5], [10, 5]])).toBe("M0.0 5.0 C3.3 5.0 6.7 5.0 10.0 5.0");
  });

  it("starts and ends on the first and last point", () => {
    const path = smoothPath([[0, 10], [10, 2], [20, 8]]);
    expect(path.startsWith("M0.0 10.0")).toBe(true);
    expect(path.endsWith("20.0 8.0")).toBe(true);
  });

  it("does not overshoot a peak", () => {
    const path = smoothPath([[0, 10], [10, 2], [20, 10]]);
    expect(Math.min(...controlYs(path))).toBeGreaterThanOrEqual(2);
    expect(Math.max(...controlYs(path))).toBeLessThanOrEqual(10);
  });

  it("keeps a flat stretch flat", () => {
    const path = smoothPath([[0, 4], [10, 4], [20, 9]]);
    expect(path.startsWith("M0.0 4.0 C3.3 4.0 6.7 4.0 10.0 4.0")).toBe(true);
  });
});
