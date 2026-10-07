import { describe, expect, it } from "vitest";
import { durationLabel, median, weekBuckets } from "@/lib/admin-market";

describe("median", () => {
  it("handles empty, odd and even lists", () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("weekBuckets", () => {
  const now = new Date("2026-10-07T12:00:00Z");

  it("returns contiguous seven-day windows, oldest first, ending now", () => {
    const buckets = weekBuckets(now, 3);
    expect(buckets).toHaveLength(3);
    expect(buckets[2].to.getTime()).toBe(now.getTime());
    expect(buckets[1].to.getTime()).toBe(buckets[2].from.getTime());
    expect(buckets[0].to.getTime()).toBe(buckets[1].from.getTime());
    expect(buckets[2].to.getTime() - buckets[2].from.getTime()).toBe(7 * 24 * 3600 * 1000);
  });
});

describe("durationLabel", () => {
  it("picks minutes, hours or days", () => {
    expect(durationLabel(null)).toBe("–");
    expect(durationLabel(10 * 60_000)).toBe("10 Min.");
    expect(durationLabel(3.5 * 3600_000)).toBe("3,5 Std.");
    expect(durationLabel(72 * 3600_000)).toBe("3 Tage");
  });
});
