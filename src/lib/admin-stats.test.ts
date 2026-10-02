import { describe, expect, it } from "vitest";
import { dailySeries, windowStart } from "@/lib/admin-stats";

const now = new Date("2026-10-01T15:30:00Z");

describe("windowStart", () => {
  it("starts at midnight UTC, days - 1 days before today", () => {
    expect(windowStart(7, now).toISOString()).toBe("2026-09-25T00:00:00.000Z");
    expect(windowStart(1, now).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
});

describe("dailySeries", () => {
  it("returns one point per day, empty days included", () => {
    const points = dailySeries([], 3, () => null, undefined, now);
    expect(points).toEqual([
      { day: "2026-09-29", value: 0 },
      { day: "2026-09-30", value: 0 },
      { day: "2026-10-01", value: 0 },
    ]);
  });

  it("counts rows by default and sums values when given", () => {
    const rows = [
      { at: new Date("2026-09-30T01:00:00Z"), cents: 500 },
      { at: new Date("2026-09-30T23:59:59Z"), cents: 250 },
      { at: new Date("2026-10-01T00:00:00Z"), cents: 100 },
    ];
    expect(dailySeries(rows, 2, (r) => r.at, undefined, now).map((p) => p.value)).toEqual([2, 1]);
    expect(dailySeries(rows, 2, (r) => r.at, (r) => r.cents, now).map((p) => p.value)).toEqual([750, 100]);
  });

  it("ignores rows outside the window and rows without a date", () => {
    const rows = [
      { at: new Date("2026-09-28T12:00:00Z") },
      { at: new Date("2026-10-02T00:00:00Z") },
      { at: null },
    ];
    expect(dailySeries(rows, 2, (r) => r.at, undefined, now).map((p) => p.value)).toEqual([0, 0]);
  });
});
