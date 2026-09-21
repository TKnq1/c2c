import { describe, expect, it } from "vitest";
import { sendOfferSchema } from "@/lib/validation";

// sendOfferSchema's `amount` field is the euro string straight out of a
// payment form (see PayCreatorForm/OfferForm) — this is the boundary where
// user input turns into the integer cents every payment calculation from
// then on assumes it can trust.
describe("sendOfferSchema (dollarsToCents)", () => {
  it("converts a whole-euro amount to cents", () => {
    const result = sendOfferSchema.safeParse({ amount: "250" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(25_000);
  });

  it("converts a two-decimal amount to cents", () => {
    const result = sendOfferSchema.safeParse({ amount: "250.50" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(25_050);
  });

  it("rejects more than two decimal places", () => {
    expect(sendOfferSchema.safeParse({ amount: "250.505" }).success).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(sendOfferSchema.safeParse({ amount: "abc" }).success).toBe(false);
    expect(sendOfferSchema.safeParse({ amount: "" }).success).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(sendOfferSchema.safeParse({ amount: "-50" }).success).toBe(false);
  });

  it("rejects below the €1.00 minimum", () => {
    expect(sendOfferSchema.safeParse({ amount: "0.50" }).success).toBe(false);
  });

  it("accepts exactly the €1.00 minimum", () => {
    const result = sendOfferSchema.safeParse({ amount: "1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(100);
  });

  it("rejects above the €100,000.00 maximum", () => {
    expect(sendOfferSchema.safeParse({ amount: "100000.01" }).success).toBe(false);
  });

  it("accepts exactly the €100,000.00 maximum", () => {
    const result = sendOfferSchema.safeParse({ amount: "100000" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(10_000_000);
  });
});
