import { describe, expect, it } from "vitest";
import { businessReadiness, validateBusinessInput, type BusinessInput, type StoredBusinessProfile } from "@/lib/tax/business";

const german: BusinessInput = {
  legalName: "Mia Summers",
  businessType: "FREELANCER",
  country: "DE",
  addressLine1: "Beispielstraße 1",
  addressLine2: null,
  postalCode: "10115",
  city: "Berlin",
  phone: null,
  registerNumber: null,
  taxNumber: "12/345/67890",
  vatId: null,
  smallBusinessExempt: false,
  traderSelfCertified: true,
  selfBillingAccepted: true,
};

const codes = (input: BusinessInput, role: "CREATOR" | "STARTUP") => validateBusinessInput(input, role).map((i) => `${i.code}:${i.field ?? ""}`);

describe("validateBusinessInput", () => {
  it("accepts a complete German creator", () => {
    expect(codes(german, "CREATOR")).toEqual([]);
  });

  it("asks a German creator for a tax number or VAT ID, but not a German brand", () => {
    expect(codes({ ...german, taxNumber: null }, "CREATOR")).toEqual(["TAX_ID_REQUIRED:taxNumber"]);
    expect(codes({ ...german, taxNumber: null, vatId: "DE123456789" }, "CREATOR")).toEqual([]);
    expect(codes({ ...german, taxNumber: null, selfBillingAccepted: false }, "STARTUP")).toEqual([]);
  });

  it("requires the trader confirmation from everyone and the self-billing agreement from creators", () => {
    expect(codes({ ...german, traderSelfCertified: false }, "STARTUP")).toEqual(["TRADER_CERTIFICATION_REQUIRED:traderSelfCertified"]);
    expect(codes({ ...german, selfBillingAccepted: false }, "CREATOR")).toEqual(["SELF_BILLING_CONSENT_REQUIRED:selfBillingAccepted"]);
  });

  it("lists every missing basic field", () => {
    expect(codes({ ...german, legalName: " ", city: "", postalCode: "", addressLine1: "" }, "STARTUP")).toEqual([
      "BUSINESS_PROFILE_INCOMPLETE:legalName",
      "BUSINESS_PROFILE_INCOMPLETE:addressLine1",
      "BUSINESS_PROFILE_INCOMPLETE:postalCode",
      "BUSINESS_PROFILE_INCOMPLETE:city",
    ]);
  });

  it("refuses a private person", () => {
    expect(codes({ ...german, businessType: "PRIVATE" }, "CREATOR")).toEqual(["BUSINESS_TYPE_NOT_ALLOWED:businessType"]);
  });

  it("checks that the VAT ID is well-formed and belongs to the country", () => {
    expect(codes({ ...german, vatId: "DE12345" }, "CREATOR")).toEqual(["VAT_ID_FORMAT_INVALID:vatId"]);
    expect(codes({ ...german, vatId: "FR12345678901" }, "CREATOR")).toEqual(["VAT_ID_COUNTRY_MISMATCH:vatId"]);
    expect(codes({ ...german, country: "GR", taxNumber: null, vatId: "EL123456789" }, "CREATOR")).toEqual([]);
  });

  it("demands a VAT ID from businesses elsewhere in the EU, except small-business creators", () => {
    const french = { ...german, country: "FR", taxNumber: null };
    expect(codes(french, "STARTUP")).toEqual(["VAT_ID_REQUIRED:vatId"]);
    expect(codes(french, "CREATOR")).toEqual(["VAT_ID_REQUIRED:vatId"]);
    expect(codes({ ...french, smallBusinessExempt: true }, "CREATOR")).toEqual([]);
    expect(codes({ ...french, smallBusinessExempt: true }, "STARTUP")).toEqual(["VAT_ID_REQUIRED:vatId"]);
    expect(codes({ ...french, vatId: "FR12345678901" }, "STARTUP")).toEqual([]);
  });

  it("asks nothing more of a business outside the EU", () => {
    expect(codes({ ...german, country: "CH", taxNumber: null }, "CREATOR")).toEqual([]);
  });
});

describe("businessReadiness", () => {
  const stored: StoredBusinessProfile = {
    ...german,
    vatIdStatus: "UNCHECKED",
    traderSelfCertifiedAt: new Date(),
    selfBillingAcceptedAt: new Date(),
  };

  it("fails without a profile", () => {
    expect(businessReadiness(null, "CREATOR").map((i) => i.code)).toEqual(["BUSINESS_PROFILE_INCOMPLETE"]);
  });

  it("passes a stored German profile", () => {
    expect(businessReadiness(stored, "CREATOR")).toEqual([]);
  });

  it("wants a VIES-confirmed VAT ID for foreign EU businesses", () => {
    const french = { ...stored, country: "FR", vatId: "FR12345678901", taxNumber: null };
    expect(businessReadiness(french, "STARTUP").map((i) => i.code)).toEqual(["VAT_ID_NOT_VERIFIED"]);
    expect(businessReadiness({ ...french, vatIdStatus: "VALID" }, "STARTUP")).toEqual([]);
  });
});
