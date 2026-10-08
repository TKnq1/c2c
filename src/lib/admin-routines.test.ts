import { describe, expect, it } from "vitest";
import { berlinDay, dayComplete, previousDay, routinesFor, ROUTINES, streak } from "@/lib/admin-routines";

const keys = (now: Date) => routinesFor(now).map((r) => r.key);

describe("berlinDay", () => {
  it("takes the day in Berlin, not in UTC", () => {
    // 23:30 UTC on the 7th is 01:30 on the 8th in Berlin (summer time).
    expect(berlinDay(new Date("2026-10-07T23:30:00Z"))).toEqual({ day: "2026-10-08", weekday: 4, monthDay: 8 });
  });
});

describe("routinesFor", () => {
  it("adds the weekly plan on Monday", () => {
    const monday = keys(new Date("2026-10-05T09:00:00Z"));
    expect(monday).toContain("content.plan");
    expect(monday).toContain("growth.mailing");
    expect(monday).not.toContain("numbers.week");
  });

  it("adds the weekly review on Friday", () => {
    const friday = keys(new Date("2026-10-09T09:00:00Z"));
    expect(friday).toContain("numbers.week");
    expect(friday).toContain("content.reel-brand");
    expect(friday).not.toContain("content.plan");
  });

  it("adds the month on the 1st", () => {
    expect(keys(new Date("2026-11-01T09:00:00Z"))).toContain("numbers.month");
    expect(keys(new Date("2026-11-02T09:00:00Z"))).not.toContain("numbers.month");
  });

  it("always has the daily ones", () => {
    const daily = ROUTINES.filter((r) => !r.days && !r.monthDay).map((r) => r.key);
    expect(keys(new Date("2026-10-11T09:00:00Z"))).toEqual(expect.arrayContaining(daily));
  });
});

describe("streak", () => {
  it("counts back from yesterday while today is still open", () => {
    expect(streak(new Set(["2026-10-05", "2026-10-06", "2026-10-07"]), "2026-10-08")).toBe(3);
  });

  it("includes today once it is complete", () => {
    expect(streak(new Set(["2026-10-07", "2026-10-08"]), "2026-10-08")).toBe(2);
  });

  it("stops at a gap", () => {
    expect(streak(new Set(["2026-10-04", "2026-10-06", "2026-10-07"]), "2026-10-08")).toBe(2);
  });

  it("goes across a month", () => {
    expect(previousDay("2026-11-01")).toBe("2026-10-31");
  });
});

describe("dayComplete", () => {
  it("needs every routine due that day", () => {
    const due = routinesFor(new Date("2026-10-09T10:00:00Z")).map((r) => r.key);
    expect(dayComplete("2026-10-09", new Set(due))).toBe(true);
    expect(dayComplete("2026-10-09", new Set(due.slice(1)))).toBe(false);
  });
});
