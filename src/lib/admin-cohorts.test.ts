import { describe, expect, it } from "vitest";
import { cohortRetention } from "@/lib/admin-cohorts";

const now = new Date("2026-10-07T12:00:00Z");
const DAY = 24 * 3600 * 1000;
const ago = (days: number) => new Date(now.getTime() - days * DAY);

describe("cohortRetention", () => {
  it("shares the people of a sign-up week who were active in the k-th week after their own sign-up", () => {
    // Three people who signed up 20 days ago (cohort week 2 back): a is active in week 1 and 2 after sign-up, b in week 1, c never.
    const users = [
      { id: "a", createdAt: ago(20) },
      { id: "b", createdAt: ago(20) },
      { id: "c", createdAt: ago(20) },
    ];
    const events = [
      { userId: "a", at: ago(20 - 8) },
      { userId: "a", at: ago(20 - 15) },
      { userId: "b", at: ago(20 - 9) },
    ];
    const rows = cohortRetention(users, events, now, 4, 3);
    expect(rows).toHaveLength(4);
    const row = rows.find((r) => r.size === 3)!;
    // Week 1 is over (day 14), week 2 is over only at day 21: the 20-day-old people have not finished it.
    expect(row.cells[0]).toEqual({ eligible: 3, active: 2, rate: 67 });
    expect(row.cells[1]).toBeNull();
  });

  it("leaves cells empty while nobody's week is over, and keeps the rows oldest first", () => {
    const rows = cohortRetention([{ id: "x", createdAt: ago(2) }], [], now, 3, 2);
    expect(rows.map((r) => r.size)).toEqual([0, 0, 1]);
    expect(rows[2].cells).toEqual([null, null]);
    expect(rows[0].cells).toEqual([null, null]);
  });
});
