import { describe, expect, it } from "vitest";
import { lastMonths, monthlyCents, runway } from "@/lib/admin-money";

describe("monthlyCents", () => {
  it("spreads yearly costs over twelve months and skips switched-off ones", () => {
    expect(
      monthlyCents([
        { amountCents: 2000, interval: "MONTHLY", active: true },
        { amountCents: 6000, interval: "YEARLY", active: true },
        { amountCents: 9900, interval: "MONTHLY", active: false },
      ]),
    ).toBe(2500);
  });
});

describe("runway", () => {
  it("is unknown without a balance and profitable when income covers the costs", () => {
    expect(runway(null, 500)).toEqual({ kind: "unknown" });
    expect(runway(5000, 0)).toEqual({ kind: "profitable" });
    expect(runway(5000, -300)).toEqual({ kind: "profitable" });
  });

  it("counts the months a balance lasts, to one decimal", () => {
    expect(runway(560000, 61000)).toEqual({ kind: "months", months: 9.2 });
    expect(runway(0, 61000)).toEqual({ kind: "empty" });
  });
});

describe("lastMonths", () => {
  it("returns the last n calendar months, oldest first, across a year change", () => {
    const months = lastMonths(new Date("2026-02-15T10:00:00Z"), 4);
    expect(months.map((m) => m.key)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(months[3].end.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
});
