import { describe, expect, it } from "vitest";
import { inMorningWindow, localDayKey, shouldShowMorningStart } from "@/lib/admin-morning";

const base = { enabled: true, from: 5, to: 11, everyTime: false, lastShownDay: null, shownThisVisit: false };
const at = (hour: number, day = 7) => new Date(2026, 9, day, hour, 30);

describe("inMorningWindow", () => {
  it("includes the first hour and excludes the end hour", () => {
    expect(inMorningWindow(5, 5, 11)).toBe(true);
    expect(inMorningWindow(10, 5, 11)).toBe(true);
    expect(inMorningWindow(11, 5, 11)).toBe(false);
    expect(inMorningWindow(4, 5, 11)).toBe(false);
  });

  it("matches nothing when the window ends before it starts", () => {
    expect(inMorningWindow(8, 11, 5)).toBe(false);
    expect(inMorningWindow(8, 8, 8)).toBe(false);
  });
});

describe("shouldShowMorningStart", () => {
  it("shows in the window on a day that has not had it yet", () => {
    expect(shouldShowMorningStart({ ...base, now: at(7) })).toBe(true);
  });

  it("shows only once per day unless it is set to every time", () => {
    const today = localDayKey(at(7));
    expect(shouldShowMorningStart({ ...base, now: at(8), lastShownDay: today })).toBe(false);
    expect(shouldShowMorningStart({ ...base, now: at(8), lastShownDay: today, everyTime: true })).toBe(true);
    expect(shouldShowMorningStart({ ...base, now: at(8), lastShownDay: localDayKey(at(7, 6)) })).toBe(true);
  });

  it("stays away outside the window, when switched off, and once shown in this visit", () => {
    expect(shouldShowMorningStart({ ...base, now: at(14) })).toBe(false);
    expect(shouldShowMorningStart({ ...base, now: at(7), enabled: false })).toBe(false);
    expect(shouldShowMorningStart({ ...base, now: at(7), everyTime: true, shownThisVisit: true })).toBe(false);
  });
});
