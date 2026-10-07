import { describe, expect, it } from "vitest";
import { cumulativeFromDates, dayEnds, daysBefore, distinctBetween, movedOver, rollingDistinct, rollingSum, runningTotal, sumBetween, waitingSeries, windowPair } from "@/lib/admin-trends";

const now = new Date("2026-10-07T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000);

describe("dayEnds", () => {
  it("gives one entry per day, oldest first, with today measured at now", () => {
    const ends = dayEnds(3, now);
    expect(ends.map((e) => e.day)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07"]);
    expect(ends[2].end.getTime()).toBe(now.getTime());
    expect(ends[0].end.toISOString()).toBe("2026-10-05T23:59:59.999Z");
  });
});

describe("rollingDistinct", () => {
  it("counts each person once per window and ends on the current figure", () => {
    const events = [
      { userId: "a", at: daysAgo(1) },
      { userId: "a", at: daysAgo(2) },
      { userId: "b", at: daysAgo(10) },
    ];
    const series = rollingDistinct(events, 14, 7, now);
    expect(series).toHaveLength(14);
    expect(series[13].value).toBe(distinctBetween(events, daysAgo(7), now));
    expect(series[13].value).toBe(1);
    // Ten days ago only "b" was active; the day before it was still inside b's window.
    expect(series.find((p) => p.day === "2026-09-27")?.value).toBe(1);
  });
});

describe("waitingSeries", () => {
  it("counts requests older than the wait that had no interest at that time", () => {
    const requests = [
      { createdAt: daysAgo(20), firstInterestAt: null },
      { createdAt: daysAgo(20), firstInterestAt: daysAgo(6) },
      { createdAt: daysAgo(2), firstInterestAt: null },
    ];
    const series = waitingSeries(requests, 10, 3, now);
    expect(series[series.length - 1].value).toBe(1);
    // Nine days ago both old requests were still waiting; the young one did not exist yet.
    expect(series[0].value).toBe(2);
  });
});

describe("cumulativeFromDates and movedOver", () => {
  it("builds a running total and reports how far it moved", () => {
    const series = cumulativeFromDates([daysAgo(30), daysAgo(5), daysAgo(1), daysAgo(0)], 10, now);
    expect(series.map((p) => p.value)).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 3, 4]);
    expect(movedOver(series, 7)).toBe(3);
    expect(movedOver([], 7)).toBe(0);
  });
});

describe("runningTotal", () => {
  it("ends on the total and starts from what was there before the window", () => {
    const daily = [
      { day: "2026-10-05", value: 2 },
      { day: "2026-10-06", value: 0 },
      { day: "2026-10-07", value: 3 },
    ];
    expect(runningTotal(daily, 10).map((p) => p.value)).toEqual([7, 7, 10]);
  });
});

describe("rollingSum and sumBetween", () => {
  it("adds up amounts inside the window for every day", () => {
    const rows = [
      { at: daysAgo(1), amount: 100 },
      { at: daysAgo(3), amount: 50 },
      { at: daysAgo(20), amount: 7 },
    ];
    expect(sumBetween(rows, daysAgo(7), now)).toBe(150);
    const series = rollingSum(rows, 5, 2, now);
    expect(series.map((p) => p.value)).toEqual([0, 50, 50, 100, 100]);
    expect(daysBefore(now, 1).toISOString()).toBe("2026-10-06T12:00:00.000Z");
  });
});

describe("windowPair", () => {
  it("splits one daily series into the last period and the one before", () => {
    const daily = Array.from({ length: 6 }, (_, i) => ({ day: `d${i}`, value: i + 1 }));
    expect(windowPair(daily, 3)).toEqual({ current: 4 + 5 + 6, before: 1 + 2 + 3 });
    expect(windowPair(daily, 2)).toEqual({ current: 5 + 6, before: 3 + 4 });
  });
});
