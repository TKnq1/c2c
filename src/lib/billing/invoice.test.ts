import { describe, expect, it } from "vitest";
import {
  buildBrandInvoice,
  buildCreatorCreditNote,
  documentIsConsistent,
  formatInvoiceNumber,
  invoiceSequenceKey,
  legalNoteFor,
  type DealDocumentInput,
} from "@/lib/billing/invoice";
import { platformIssuer, platformIsSmallBusiness } from "@/lib/billing/issuer";
import { computeDealTax, type TaxParty } from "@/lib/tax/engine";

const party = (partial: Partial<TaxParty>): TaxParty => ({ country: "DE", vatId: null, vatIdStatus: "UNCHECKED", smallBusinessExempt: false, ...partial });

function input(overrides: { brand?: Partial<TaxParty>; creator?: Partial<TaxParty>; usageFeeCents?: number } = {}): DealDocumentInput {
  const tax = computeDealTax({
    amountCents: 100_000,
    payoutCents: 90_000,
    brand: party(overrides.brand ?? {}),
    creator: party(overrides.creator ?? {}),
    platform: { smallBusiness: false },
  });
  if (!tax.ok) throw new Error("tax should compute");
  return {
    dealId: "deal1",
    requestTitle: "Herbst-Launch",
    contentFormats: ["INSTAGRAM_REEL", "INSTAGRAM_STORY"],
    usage: { type: "PAID_ADS", channels: ["TIKTOK_SPARK_ADS"], durationDays: 60, feeCents: overrides.usageFeeCents ?? 0, territory: "EU" },
    amountCents: 100_000,
    payoutCents: 90_000,
    usageFeeCents: overrides.usageFeeCents ?? 0,
    tax: tax.value,
    platform: { name: "Teethawat Kanpai (comtor)", addressLines: ["Sonnenscheinpfad 64", "12277 Berlin"], country: "DE", vatId: "DE123456789", taxNumber: null },
    brand: { name: "Glow Beauty GmbH", addressLines: ["Hauptstr. 1", "10115 Berlin"], country: "DE", vatId: null, taxNumber: null },
    creator: { name: "Mia Summers", addressLines: ["Musterweg 2", "10117 Berlin"], country: "DE", vatId: null, taxNumber: "12/345/67890" },
    servicePeriod: { start: new Date("2026-10-15"), end: new Date("2026-10-22") },
  };
}

describe("invoice numbers", () => {
  it("numbers per kind and year with six digits", () => {
    expect(invoiceSequenceKey("BRAND_INVOICE", 2026)).toBe("RE-2026");
    expect(formatInvoiceNumber("BRAND_INVOICE", 2026, 1)).toBe("RE-2026-000001");
    expect(formatInvoiceNumber("CREATOR_CREDIT_NOTE", 2026, 123456)).toBe("GS-2026-123456");
  });
});

describe("buildBrandInvoice", () => {
  it("bills the net price plus 19 % to a German brand", () => {
    const draft = buildBrandInvoice(input());
    expect(draft).toMatchObject({ kind: "BRAND_INVOICE", netCents: 100_000, vatCents: 19_000, grossCents: 119_000, vatRateBp: 1900, taxTreatment: "DOMESTIC_VAT", legalNote: null });
    expect(draft.issuer.vatId).toBe("DE123456789");
    expect(draft.recipient.name).toBe("Glow Beauty GmbH");
    expect(documentIsConsistent(draft)).toBe(true);
  });

  it("shows no VAT and the reverse-charge sentence to a French brand with a VAT ID", () => {
    const draft = buildBrandInvoice(input({ brand: { country: "FR", vatId: "FR12345678901", vatIdStatus: "VALID" } }));
    expect(draft).toMatchObject({ vatCents: 0, grossCents: 100_000, taxTreatment: "REVERSE_CHARGE_EU" });
    expect(draft.legalNote).toContain("Reverse-Charge");
  });

  it("puts the usage rights on their own line when they were priced", () => {
    const draft = buildBrandInvoice(input({ usageFeeCents: 25_000 }));
    expect(draft.lines).toHaveLength(2);
    expect(draft.lines.map((l) => l.netCents)).toEqual([75_000, 25_000]);
    expect(draft.lines[1].description).toContain("60 Tage");
    expect(draft.lines[1].description).toContain("Spark Ads");
    expect(documentIsConsistent(draft)).toBe(true);
  });
});

describe("buildCreatorCreditNote", () => {
  it("carves the creator's VAT out of the payout, the recipient being the platform", () => {
    const draft = buildCreatorCreditNote(input());
    expect(draft).toMatchObject({ kind: "CREATOR_CREDIT_NOTE", grossCents: 90_000, netCents: 75_630, vatCents: 14_370, taxTreatment: "DOMESTIC_VAT" });
    expect(draft.issuer.name).toBe("Mia Summers");
    expect(draft.issuer.taxNumber).toBe("12/345/67890");
    expect(draft.recipient.name).toContain("comtor");
    expect(draft.notes.join(" ")).toContain("§ 14 Abs. 2");
    expect(documentIsConsistent(draft)).toBe(true);
  });

  it("states the small-business exemption instead of VAT", () => {
    const draft = buildCreatorCreditNote(input({ creator: { smallBusinessExempt: true } }));
    expect(draft).toMatchObject({ vatCents: 0, netCents: 90_000, taxTreatment: "SMALL_BUSINESS_EXEMPT" });
    expect(draft.legalNote).toContain("§ 19 UStG");
  });

  it("splits the payout in proportion to the usage fee and still adds up", () => {
    const draft = buildCreatorCreditNote(input({ usageFeeCents: 25_000 }));
    expect(draft.lines).toHaveLength(2);
    expect(documentIsConsistent(draft)).toBe(true);
    expect(draft.lines[1].netCents).toBeGreaterThan(0);
  });
});

describe("legalNoteFor", () => {
  it("has a sentence for each treatment that needs one", () => {
    expect(legalNoteFor("DOMESTIC_VAT", "DE")).toBeNull();
    expect(legalNoteFor("REVERSE_CHARGE_13B", "US")).toContain("§ 13b");
    expect(legalNoteFor("OUT_OF_SCOPE", "DE")).toContain("§ 3a");
    expect(legalNoteFor("SMALL_BUSINESS_EXEMPT", "ES")).not.toContain("§ 19");
  });
});

describe("platformIssuer", () => {
  it("takes name and address from the imprint and needs a tax identification", () => {
    expect(platformIssuer({})).toBeNull();
    const issuer = platformIssuer({ IMPRINT_VAT_ID: "DE123456789" });
    expect(issuer).toMatchObject({ country: "DE", vatId: "DE123456789", taxNumber: null });
    expect(issuer?.name).toContain("comtor");
    expect(issuer?.addressLines).toEqual(["Sonnenscheinpfad 64", "12277 Berlin"]);
    expect(platformIssuer({ PLATFORM_TAX_NUMBER: "12/345/67890" })?.taxNumber).toBe("12/345/67890");
  });

  it("reads the small-business switch", () => {
    expect(platformIsSmallBusiness({ PLATFORM_SMALL_BUSINESS: "1" })).toBe(true);
    expect(platformIsSmallBusiness({})).toBe(false);
  });
});
