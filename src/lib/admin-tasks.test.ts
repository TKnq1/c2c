import { describe, expect, it } from "vitest";
import { planCheckSync, REOPEN_AFTER_MS, setupChecks, type CheckResult, type SetupFacts } from "@/lib/admin-tasks";

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
  autoClosed: false,
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

  it("brings a task that closed itself back at once when its cause returns", () => {
    const fresh = new Date(now.getTime() - 60_000);
    expect(planCheckSync([row({ status: "DONE", doneAt: fresh, autoClosed: true })], [check()], now).update[0]?.reopen).toBe(true);
  });

  it("ignores tasks that no check owns", () => {
    expect(planCheckSync([row({ dedupeKey: null })], [], now).close).toEqual([]);
  });
});

describe("setupChecks", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  const calm: SetupFacts = { sentry: null, stripe: null, mailFailures24h: 0, activeFixedCosts: 2, balanceAt: new Date("2026-10-05T12:00:00Z") };
  const keys = (facts: Partial<SetupFacts>) => setupChecks({ ...calm, ...facts }, now).map((c) => c.key);

  it("finds nothing to do when everything is in order", () => {
    expect(keys({})).toEqual([]);
  });

  it("flags Stripe webhooks that did not arrive, but not a failed lookup", () => {
    expect(keys({ stripe: { ok: true, total: 2, failed: [] } })).toEqual(["stripe-webhooks"]);
    expect(keys({ stripe: { ok: true, total: 0, failed: [] } })).toEqual([]);
    expect(keys({ stripe: { ok: false, error: "Invalid API key" } })).toEqual([]);
  });

  it("flags three or more failed mails in a day", () => {
    expect(keys({ mailFailures24h: 2 })).toEqual([]);
    expect(keys({ mailFailures24h: 3 })).toEqual(["mail-failures"]);
  });

  it("flags unresolved Sentry issues", () => {
    const issue = { id: "1", title: "Boom", culprit: "", count: 1, users: 1, lastSeen: "", level: "error", link: "" };
    expect(keys({ sentry: { ok: true, issues: [issue], total: 1 } })).toEqual(["sentry-errors"]);
  });

  it("asks for fixed costs and a balance that is missing or older than two weeks", () => {
    expect(keys({ activeFixedCosts: 0 })).toEqual(["money-fixed-costs"]);
    expect(keys({ balanceAt: null })).toEqual(["money-balance"]);
    const old = setupChecks({ ...calm, balanceAt: new Date("2026-09-01T12:00:00Z") }, now);
    expect(old).toHaveLength(1);
    expect(old[0]).toMatchObject({ key: "money-balance", title: "Kontostand aktualisieren" });
  });
});
