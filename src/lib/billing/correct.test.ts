import { describe, expect, it } from "vitest";
import { applyPartyPatch, planCorrection, type InvoiceSource } from "@/lib/billing/correct";
import type { InvoiceParty } from "@/lib/billing/issuer";
import { amountsAddUp, parseBody } from "@/lib/billing/invoice";

const platform: InvoiceParty = { name: "Max Muster (comtor)", addressLines: ["Musterstraße 1", "10115 Berlin"], country: "DE", vatId: "DE123456789", taxNumber: null };
const brand: InvoiceParty = { name: "Glow GmbH", addressLines: ["Teststraße 1", "10115 Berlin"], country: "DE", vatId: null, taxNumber: "12/345/67890" };
const creator: InvoiceParty = { name: "Mia Summers", addressLines: ["Linienstraße 5", "10119 Berlin"], country: "DE", vatId: null, taxNumber: "98/765/43210" };
const now = new Date("2026-10-20T08:00:00Z");

function invoice(over: Partial<InvoiceSource> = {}): InvoiceSource {
  return {
    id: "inv_1",
    number: "RE-2026-000001",
    kind: "BRAND_INVOICE",
    status: "ISSUED",
    dealId: "deal_1",
    recipientUserId: "user_brand",
    currency: "EUR",
    issuedAt: new Date("2026-10-08T22:30:00Z"),
    servicePeriodStart: new Date("2026-10-01T00:00:00Z"),
    servicePeriodEnd: new Date("2026-10-08T00:00:00Z"),
    netCents: 100_000,
    vatCents: 19_000,
    grossCents: 119_000,
    vatRateBp: 1900,
    taxTreatment: "DOMESTIC_VAT",
    legalNote: null,
    issuer: platform as never,
    recipient: brand as never,
    lines: {
      items: [
        { description: "Influencer-Kooperation „Herbst“: TikTok Video", quantity: 1, unitNetCents: 95_000, netCents: 95_000 },
        { description: "Nutzungsrechte (Paid Ads)", quantity: 1, unitNetCents: 5_000, netCents: 5_000 },
      ],
      notes: [],
    } as never,
    cancelsInvoiceId: null,
    cancelledAt: null,
    ...over,
  };
}

describe("applyPartyPatch", () => {
  it("keeps everything the patch leaves out", () => {
    const result = applyPartyPatch(brand, { name: "Glow Cosmetics GmbH" });
    expect(result).toEqual({ ok: true, party: { ...brand, name: "Glow Cosmetics GmbH" } });
  });

  it("tidies white space in the name and the address", () => {
    const result = applyPartyPatch(brand, { name: "  Glow   GmbH ", addressLines: [" Neue  Straße 2 ", "", "  ", "10117   Berlin"] });
    expect(result).toMatchObject({ ok: true, party: { name: "Glow GmbH", addressLines: ["Neue Straße 2", "10117 Berlin"] } });
  });

  it("refuses names and addresses that cannot go on a document", () => {
    expect(applyPartyPatch(brand, { name: "G" }).ok).toBe(false);
    expect(applyPartyPatch(brand, { name: "x".repeat(201) }).ok).toBe(false);
    expect(applyPartyPatch(brand, { addressLines: [] }).ok).toBe(false);
    expect(applyPartyPatch(brand, { addressLines: ["a", "b", "c", "d", "e"] }).ok).toBe(false);
    expect(applyPartyPatch(brand, { addressLines: ["x".repeat(121)] }).ok).toBe(false);
  });

  it("normalises a VAT ID and wants it from the country on the document", () => {
    expect(applyPartyPatch(brand, { vatId: "de 123.456.789" })).toMatchObject({ ok: true, party: { vatId: "DE123456789" } });
    expect(applyPartyPatch(brand, { vatId: "ATU12345678" }).ok).toBe(false);
    expect(applyPartyPatch(brand, { vatId: "DE12" }).ok).toBe(false);
  });

  it("writes Greece as EL", () => {
    const greek: InvoiceParty = { ...brand, country: "GR" };
    expect(applyPartyPatch(greek, { vatId: "EL123456789" })).toMatchObject({ ok: true, party: { vatId: "EL123456789" } });
    expect(applyPartyPatch(greek, { vatId: "GR123456789" }).ok).toBe(false);
  });

  it("clears a VAT ID or a tax number that is given empty", () => {
    expect(applyPartyPatch({ ...brand, vatId: "DE123456789" }, { vatId: "" })).toMatchObject({ ok: true, party: { vatId: null } });
    expect(applyPartyPatch(brand, { taxNumber: " " })).toMatchObject({ ok: true, party: { taxNumber: null } });
    expect(applyPartyPatch(brand, { taxNumber: "x".repeat(41) }).ok).toBe(false);
  });

  it("never changes the country", () => {
    expect(applyPartyPatch(brand, { name: "Glow AG" })).toMatchObject({ party: { country: "DE" } });
  });
});

describe("planCorrection", () => {
  it("cancels with every amount reversed and the document as it was", () => {
    const plan = planCorrection(invoice(), { recipient: { name: "Glow Cosmetics GmbH" } }, now);
    if (!plan.ok) throw new Error(plan.error);
    const { cancellation } = plan;
    expect(cancellation).toMatchObject({ kind: "BRAND_INVOICE", dealId: "deal_1", recipientUserId: "user_brand", netCents: -100_000, vatCents: -19_000, grossCents: -119_000, vatRateBp: 1900, issuedAt: now });
    expect(cancellation.recipient).toEqual(brand);
    expect(cancellation.issuer).toEqual(platform);
    const body = parseBody(cancellation.lines);
    expect(body.items.map((i) => i.netCents)).toEqual([-95_000, -5_000]);
    expect(body.items.map((i) => i.unitNetCents)).toEqual([-95_000, -5_000]);
    expect(amountsAddUp({ netCents: -100_000, vatCents: -19_000, grossCents: -119_000 }, body)).toBe(true);
  });

  it("points the cancellation at the original, with the date in Berlin", () => {
    const plan = planCorrection(invoice(), { recipient: { name: "Glow Cosmetics GmbH" } }, now);
    if (!plan.ok) throw new Error(plan.error);
    // 22:30 UTC on 8 October is 00:30 on 9 October in Berlin.
    expect(parseBody(plan.cancellation.lines).notes).toEqual(["Storno zu Rechnung RE-2026-000001 vom 09.10.2026."]);
  });

  it("replaces with the same amounts and the corrected party", () => {
    const plan = planCorrection(invoice({ lines: { items: [{ description: "x", quantity: 1, unitNetCents: 100_000, netCents: 100_000 }], notes: ["Zahlbar sofort."] } as never }), { recipient: { name: "Glow Cosmetics GmbH", addressLines: ["Neue Straße 2", "10117 Berlin"] } }, now);
    if (!plan.ok) throw new Error(plan.error);
    const { replacement } = plan;
    expect(replacement).toMatchObject({ netCents: 100_000, vatCents: 19_000, grossCents: 119_000, vatRateBp: 1900, taxTreatment: "DOMESTIC_VAT", issuedAt: now });
    expect(replacement.recipient).toEqual({ ...brand, name: "Glow Cosmetics GmbH", addressLines: ["Neue Straße 2", "10117 Berlin"] });
    expect(replacement.issuer).toEqual(platform);
    expect(parseBody(replacement.lines).notes).toEqual(["Zahlbar sofort.", "Dieser Beleg ersetzt die Rechnung RE-2026-000001 vom 09.10.2026."]);
  });

  it("nets out to nothing against the original", () => {
    const original = invoice();
    const plan = planCorrection(original, { recipient: { name: "Glow Cosmetics GmbH" } }, now);
    if (!plan.ok) throw new Error(plan.error);
    expect(original.netCents + (plan.cancellation.netCents as number)).toBe(0);
    expect(original.vatCents + (plan.cancellation.vatCents as number)).toBe(0);
    expect(original.grossCents + (plan.cancellation.grossCents as number)).toBe(0);
  });

  it("keeps a zero as a plain zero", () => {
    const plan = planCorrection(invoice({ vatCents: 0, grossCents: 100_000, vatRateBp: 0, lines: { items: [{ description: "x", quantity: 1, unitNetCents: 100_000, netCents: 100_000 }, { description: "free", quantity: 1, unitNetCents: 0, netCents: 0 }], notes: [] } as never }), { recipient: { name: "Glow Cosmetics GmbH" } }, now);
    if (!plan.ok) throw new Error(plan.error);
    expect(Object.is(plan.cancellation.vatCents, 0)).toBe(true);
    expect(Object.is(parseBody(plan.cancellation.lines).items[1].netCents, 0)).toBe(true);
  });

  it("corrects the creator on a credit note, where the creator is the issuer", () => {
    const credit = invoice({ kind: "CREATOR_CREDIT_NOTE", number: "GS-2026-000001", recipientUserId: "user_platform", issuer: creator as never, recipient: platform as never, taxNumber: undefined } as never);
    const plan = planCorrection(credit, { issuer: { addressLines: ["Neue Gasse 3", "10119 Berlin"] } }, now);
    if (!plan.ok) throw new Error(plan.error);
    expect(plan.replacement.issuer).toEqual({ ...creator, addressLines: ["Neue Gasse 3", "10119 Berlin"] });
    expect(plan.replacement.recipient).toEqual(platform);
    expect(parseBody(plan.cancellation.lines).notes).toEqual(["Storno zu Gutschrift GS-2026-000001 vom 09.10.2026."]);
  });

  it("refuses a document that is cancelled or is itself a cancellation", () => {
    expect(planCorrection(invoice({ status: "CANCELLED", cancelledAt: now }), { recipient: { name: "Other GmbH" } }, now).ok).toBe(false);
    expect(planCorrection(invoice({ cancelsInvoiceId: "inv_0" }), { recipient: { name: "Other GmbH" } }, now).ok).toBe(false);
  });

  it("refuses a correction that changes nothing", () => {
    const plan = planCorrection(invoice(), { recipient: { name: "Glow GmbH", addressLines: ["Teststraße 1", "10115 Berlin"] } }, now);
    expect(plan).toEqual({ ok: false, error: "Nothing was changed." });
  });

  it("does not let the issuer lose its VAT ID and tax number", () => {
    const plan = planCorrection(invoice(), { issuer: { vatId: "" } }, now);
    expect(plan.ok).toBe(false);
  });

  it("wants the brand's VAT ID on an invoice without VAT", () => {
    const reverse = invoice({ taxTreatment: "REVERSE_CHARGE_EU", vatCents: 0, grossCents: 100_000, vatRateBp: 0, recipient: { ...brand, country: "AT", vatId: "ATU12345678" } as never });
    expect(planCorrection(reverse, { recipient: { vatId: "" } }, now).ok).toBe(false);
    expect(planCorrection(reverse, { recipient: { name: "Glow Österreich GmbH" } }, now).ok).toBe(true);
  });

  it("refuses a document whose numbers do not add up", () => {
    expect(planCorrection(invoice({ grossCents: 118_999 }), { recipient: { name: "Other GmbH" } }, now).ok).toBe(false);
  });
});
