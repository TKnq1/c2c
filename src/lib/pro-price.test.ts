import { describe, expect, it } from "vitest";
import { proBreakEvenCents, proPriceCents, proStripePriceId } from "@/lib/pro-price";
import { formatEuroNumber } from "@/lib/format";

describe("Pro price", () => {
  it("costs brands 29,99 € and creators 8,99 € a month", () => {
    expect(proPriceCents("brand")).toBe(2999);
    expect(proPriceCents("creator")).toBe(899);
  });

  it("pays for itself once the saved 7 % cover the price", () => {
    expect(proBreakEvenCents(2999)).toBe(42843);
    expect(proBreakEvenCents(899)).toBe(12843);
  });

  it("sells each side at its own Stripe price, and none without one", () => {
    const env = { STRIPE_PRO_BRAND_PRICE_ID: "price_brand", STRIPE_PRO_CREATOR_PRICE_ID: "price_creator" };
    expect(proStripePriceId("brand", env)).toBe("price_brand");
    expect(proStripePriceId("creator", env)).toBe("price_creator");
    expect(proStripePriceId("creator", { STRIPE_PRO_CREATOR_PRICE_ID: "" })).toBeUndefined();
    expect(proStripePriceId("brand", {})).toBeUndefined();
  });
});

describe("formatEuroNumber", () => {
  it("writes the amount in the reader's notation, whole amounts without decimals", () => {
    expect(formatEuroNumber(2999, "de-DE")).toBe("29,99");
    expect(formatEuroNumber(899, "en")).toBe("8.99");
    expect(formatEuroNumber(1000, "de-DE")).toBe("10");
  });
});
