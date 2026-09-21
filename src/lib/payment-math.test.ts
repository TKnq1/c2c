import { describe, expect, it } from "vitest";
import { splitPayment } from "@/lib/payment-math";

describe("splitPayment", () => {
  it("takes the standard 10% platform fee", () => {
    expect(splitPayment(10_000, false)).toEqual({ platformFeeCents: 1_000, payoutCents: 9_000 });
  });

  it("takes the reduced 3% Pro fee", () => {
    expect(splitPayment(10_000, true)).toEqual({ platformFeeCents: 300, payoutCents: 9_700 });
  });

  it("rounds the fee to the nearest cent", () => {
    // 333 * 0.10 = 33.3 -> rounds down to 33
    expect(splitPayment(333, false)).toEqual({ platformFeeCents: 33, payoutCents: 300 });
    // 333 * 0.03 = 9.99 -> rounds up to 10
    expect(splitPayment(333, true)).toEqual({ platformFeeCents: 10, payoutCents: 323 });
  });

  it("handles the €1.00 minimum payment", () => {
    expect(splitPayment(100, false)).toEqual({ platformFeeCents: 10, payoutCents: 90 });
  });

  it("always sums the fee and payout back to the original amount", () => {
    const amounts = [100, 333, 999, 1_234, 10_000, 99_999, 10_000_000];
    for (const amount of amounts) {
      for (const isPro of [false, true]) {
        const { platformFeeCents, payoutCents } = splitPayment(amount, isPro);
        expect(platformFeeCents + payoutCents).toBe(amount);
      }
    }
  });
});
