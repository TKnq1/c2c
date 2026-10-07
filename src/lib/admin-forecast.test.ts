import { describe, expect, it } from "vitest";
import { forecastGoal, forecastText, PACE_DAYS } from "@/lib/admin-forecast";
import { parsePeriod, periodWords } from "@/lib/admin-period";

const now = new Date("2026-10-07T12:00:00Z");

describe("forecastGoal", () => {
  it("counts the missing places at the pace of the last weeks", () => {
    // 14 places in 28 days is half a place a day: 20 missing take 40 days.
    const f = forecastGoal({ current: 30, goal: 50, gainedInPaceWindow: 14 }, now);
    expect(f).toMatchObject({ kind: "date", days: 40 });
    if (f.kind === "date") expect(f.date.toISOString().slice(0, 10)).toBe("2026-11-16");
  });

  it("knows when the goal is reached, when there is no pace and when it is far away", () => {
    expect(forecastGoal({ current: 50, goal: 50, gainedInPaceWindow: 0 }, now).kind).toBe("reached");
    expect(forecastGoal({ current: 10, goal: 50, gainedInPaceWindow: 0 }, now).kind).toBe("none");
    expect(forecastGoal({ current: 1, goal: 100_000, gainedInPaceWindow: 1 }, now).kind).toBe("far");
    expect(PACE_DAYS).toBe(28);
  });

  it("words each case", () => {
    expect(forecastText({ kind: "reached" })).toBe("Ziel erreicht");
    expect(forecastText({ kind: "none" })).toContain("Kein Tempo");
    expect(forecastText({ kind: "date", date: new Date("2026-12-12T12:00:00Z"), days: 66 })).toBe("Bei diesem Tempo am 12. Dez. 2026");
  });
});

describe("period", () => {
  it("accepts 7, 30 and 90 and falls back to a week", () => {
    expect(parsePeriod("30")).toBe(30);
    expect(parsePeriod("90")).toBe(90);
    expect(parsePeriod("5")).toBe(7);
    expect(parsePeriod(undefined)).toBe(7);
  });

  it("words the change for a week and for longer periods", () => {
    expect(periodWords(7)).toMatchObject({ within: "diese Woche", before: "zur Woche davor", since: "seit einer Woche" });
    expect(periodWords(30)).toMatchObject({ within: "in 30 Tagen", before: "zu den 30 Tagen davor" });
  });
});
