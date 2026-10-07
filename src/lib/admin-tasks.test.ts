import { describe, expect, it } from "vitest";
import { planCheckSync, REOPEN_AFTER_MS, type CheckResult } from "@/lib/admin-tasks";

const now = new Date("2026-10-07T08:00:00Z");
const check = (over: Partial<CheckResult> = {}): CheckResult => ({ key: "reports-open", title: "2 offene Meldungen", priority: "MEDIUM", ...over });
const row = (over: Record<string, unknown> = {}) => ({
  id: "t1",
  dedupeKey: "reports-open",
  status: "OPEN" as const,
  doneAt: null,
  snoozedUntil: null,
  title: "2 offene Meldungen",
  reason: null,
  priority: "MEDIUM" as const,
  href: null,
  ...over,
});

describe("planCheckSync", () => {
  it("creates a task for a new finding", () => {
    expect(planCheckSync([], [check()], now).create).toEqual([check()]);
  });

  it("leaves an unchanged open task alone and refreshes one whose numbers changed", () => {
    expect(planCheckSync([row()], [check()], now)).toEqual({ create: [], update: [], close: [] });
    const plan = planCheckSync([row()], [check({ title: "3 offene Meldungen" })], now);
    expect(plan.update).toEqual([{ id: "t1", check: check({ title: "3 offene Meldungen" }), reopen: false }]);
  });

  it("closes a task whose cause is gone", () => {
    expect(planCheckSync([row()], [], now).close).toEqual(["t1"]);
    expect(planCheckSync([row({ status: "SNOOZED" })], [], now).close).toEqual(["t1"]);
    expect(planCheckSync([row({ status: "DONE" })], [], now).close).toEqual([]);
  });

  it("brings a snoozed task back when its time is up, not before", () => {
    const later = new Date(now.getTime() + 1000);
    expect(planCheckSync([row({ status: "SNOOZED", snoozedUntil: later })], [check()], now).update).toEqual([]);
    expect(planCheckSync([row({ status: "SNOOZED", snoozedUntil: new Date(now.getTime() - 1000) })], [check()], now).update[0]?.reopen).toBe(true);
  });

  it("brings a ticked-off task back after a day if the cause is still there", () => {
    const fresh = new Date(now.getTime() - REOPEN_AFTER_MS + 60_000);
    const old = new Date(now.getTime() - REOPEN_AFTER_MS - 60_000);
    expect(planCheckSync([row({ status: "DONE", doneAt: fresh })], [check()], now).update).toEqual([]);
    expect(planCheckSync([row({ status: "DONE", doneAt: old })], [check()], now).update[0]?.reopen).toBe(true);
  });

  it("ignores tasks that no check owns", () => {
    expect(planCheckSync([row({ dedupeKey: null })], [], now).close).toEqual([]);
  });
});
