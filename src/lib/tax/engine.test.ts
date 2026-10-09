import { describe, expect, it } from "vitest";
import {
  brandTaxDecision,
  computeDealTax,
  creatorTaxDecision,
  splitVatInclusive,
  vatOnNet,
  type TaxParty,
} from "@/lib/tax/engine";

const party = (partial: Partial<TaxParty>): TaxParty => ({
  country: "DE",
  vatId: null,
  vatIdStatus: "UNCHECKED",
  smallBusinessExempt: false,
  ...partial,
});

const regular = { smallBusiness: false };

describe("brandTaxDecision", () => {
  it("charges 19 % to a German brand, with or without a VAT ID", () => {
    expect(brandTaxDecision(party({}), regular)).toEqual({ ok: true, value: { treatment: "DOMESTIC_VAT", rateBp: 1900 } });
    expect(brandTaxDecision(party({ vatId: "DE123456789", vatIdStatus: "VALID" }), regular)).toMatchObject({ ok: true, value: { treatment: "DOMESTIC_VAT" } });
  });

  it("applies reverse charge to a brand elsewhere in the EU only with a VIES-confirmed VAT ID", () => {
    expect(brandTaxDecision(party({ country: "FR", vatId: "FR12345678901", vatIdStatus: "VALID" }), regular)).toEqual({
      ok: true,
      value: { treatment: "REVERSE_CHARGE_EU", rateBp: 0 },
    });
  });

  it("blocks an EU brand without a confirmed VAT ID, and says whether it is missing or just unchecked", () => {
    const missing = brandTaxDecision(party({ country: "FR" }), regular);
    expect(missing.ok).toBe(false);
    expect(!missing.ok && missing.issues[0].code).toBe("VAT_ID_REQUIRED");
    const unchecked = brandTaxDecision(party({ country: "FR", vatId: "FR12345678901", vatIdStatus: "UNAVAILABLE" }), regular);
    expect(!unchecked.ok && unchecked.issues[0].code).toBe("VAT_ID_NOT_VERIFIED");
    const rejected = brandTaxDecision(party({ country: "FR", vatId: "FR12345678901", vatIdStatus: "INVALID" }), regular);
    expect(!rejected.ok && rejected.issues[0].code).toBe("VAT_ID_REQUIRED");
  });

  it("does not charge German VAT to a brand outside the EU", () => {
    expect(brandTaxDecision(party({ country: "CH" }), regular)).toEqual({ ok: true, value: { treatment: "OUT_OF_SCOPE", rateBp: 0 } });
    expect(brandTaxDecision(party({ country: "GB" }), regular)).toMatchObject({ ok: true, value: { treatment: "OUT_OF_SCOPE" } });
  });

  it("charges no VAT at all when the platform itself is a small business", () => {
    expect(brandTaxDecision(party({}), { smallBusiness: true })).toEqual({ ok: true, value: { treatment: "SMALL_BUSINESS_EXEMPT", rateBp: 0 } });
  });
});

describe("creatorTaxDecision", () => {
  it("includes 19 % in the payout of a regular German creator, and none for a small business", () => {
    expect(creatorTaxDecision(party({}))).toEqual({ ok: true, value: { treatment: "DOMESTIC_VAT", rateBp: 1900 } });
    expect(creatorTaxDecision(party({ smallBusinessExempt: true }))).toEqual({ ok: true, value: { treatment: "SMALL_BUSINESS_EXEMPT", rateBp: 0 } });
  });

  it("applies reverse charge to an EU creator with a confirmed VAT ID", () => {
    expect(creatorTaxDecision(party({ country: "ES", vatId: "ESX1234567X", vatIdStatus: "VALID" }))).toEqual({
      ok: true,
      value: { treatment: "REVERSE_CHARGE_EU", rateBp: 0 },
    });
  });

  it("lets an EU small business without a VAT ID through, and blocks other EU creators", () => {
    expect(creatorTaxDecision(party({ country: "ES", smallBusinessExempt: true }))).toMatchObject({ ok: true, value: { treatment: "SMALL_BUSINESS_EXEMPT" } });
    expect(creatorTaxDecision(party({ country: "ES" })).ok).toBe(false);
  });

  it("uses § 13b UStG for a creator outside the EU", () => {
    expect(creatorTaxDecision(party({ country: "US" }))).toEqual({ ok: true, value: { treatment: "REVERSE_CHARGE_13B", rateBp: 0 } });
  });
});

describe("amounts", () => {
  it("adds VAT to a net amount in whole cents", () => {
    expect(vatOnNet(100_000, 1900)).toBe(19_000);
    expect(vatOnNet(333, 1900)).toBe(63); // 63.27
    expect(vatOnNet(100_000, 0)).toBe(0);
  });

  it("splits a gross amount so that net and VAT always add up to it", () => {
    for (const gross of [100, 333, 9_000, 90_000, 99_999, 1_234_567]) {
      const { netCents, vatCents } = splitVatInclusive(gross, 1900);
      expect(netCents + vatCents).toBe(gross);
    }
    expect(splitVatInclusive(11_900, 1900)).toEqual({ netCents: 10_000, vatCents: 1_900 });
    expect(splitVatInclusive(9_000, 0)).toEqual({ netCents: 9_000, vatCents: 0 });
  });
});

describe("computeDealTax", () => {
  it("handles German brand and German regular creator: VAT on top for the brand, carved out of the payout", () => {
    const result = computeDealTax({ amountCents: 100_000, payoutCents: 90_000, brand: party({}), creator: party({}), platform: regular });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.brand).toMatchObject({ treatment: "DOMESTIC_VAT", netCents: 100_000, vatCents: 19_000, totalCents: 119_000 });
    expect(result.value.creator).toMatchObject({ treatment: "DOMESTIC_VAT", grossCents: 90_000, netCents: 75_630, vatCents: 14_370 });
    expect(result.value.platformMarginNetCents).toBe(100_000 - 75_630);
  });

  it("never lets the brand's charge or the creator's payout depend on reverse charge", () => {
    const result = computeDealTax({
      amountCents: 100_000,
      payoutCents: 90_000,
      brand: party({ country: "FR", vatId: "FR12345678901", vatIdStatus: "VALID" }),
      creator: party({ country: "ES", vatId: "ESX1234567X", vatIdStatus: "VALID" }),
      platform: regular,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.brand).toMatchObject({ treatment: "REVERSE_CHARGE_EU", vatCents: 0, totalCents: 100_000 });
    expect(result.value.creator).toMatchObject({ treatment: "REVERSE_CHARGE_EU", vatCents: 0, grossCents: 90_000, netCents: 90_000 });
  });

  it("reports the problems of both parties, prefixed with whose they are", () => {
    const result = computeDealTax({
      amountCents: 100_000,
      payoutCents: 90_000,
      brand: party({ country: "FR" }),
      creator: party({ country: "ES" }),
      platform: regular,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.field)).toEqual(["brand.vatId", "creator.vatId"]);
  });
});
