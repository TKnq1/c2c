import { describe, expect, it } from "vitest";
import { marketingResendBlocked, MARKETING_RESEND_AFTER_MS } from "@/lib/marketing-consent";

describe("marketingResendBlocked", () => {
  it("allows the first send and blocks a repeat inside the window", () => {
    const now = Date.now();
    expect(marketingResendBlocked(null, now)).toBe(false);
    expect(marketingResendBlocked(new Date(now - 60_000), now)).toBe(true);
    expect(marketingResendBlocked(new Date(now - MARKETING_RESEND_AFTER_MS - 1), now)).toBe(false);
  });
});
