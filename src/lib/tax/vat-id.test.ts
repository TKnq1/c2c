import { describe, expect, it } from "vitest";
import { isEuCountry, normalizeVatId, parseVatId, vatPrefixFor } from "@/lib/tax/vat-id";

describe("normalizeVatId", () => {
  it("removes spaces and punctuation and upper-cases", () => {
    expect(normalizeVatId("de 123.456.789")).toBe("DE123456789");
    expect(normalizeVatId("fr-12 345678901")).toBe("FR12345678901");
  });
});

describe("parseVatId", () => {
  it("accepts well-formed numbers from several states", () => {
    for (const id of ["DE123456789", "ATU12345678", "NL123456789B01", "FR12345678901", "FRAB123456789", "IT12345678901", "ESX1234567X", "PL1234567890", "SE123456789001", "EL123456789", "IE1234567FA", "BE0123456789"]) {
      expect(parseVatId(id).ok, id).toBe(true);
    }
  });

  it("returns the ISO country, with Greece as GR", () => {
    const greek = parseVatId("EL123456789");
    expect(greek.ok && greek.vatId.countryCode).toBe("GR");
    expect(greek.ok && greek.vatId.prefix).toBe("EL");
    const german = parseVatId("de 123456789");
    expect(german.ok && german.vatId).toMatchObject({ countryCode: "DE", number: "123456789", normalized: "DE123456789" });
  });

  it("rejects wrong lengths, letters and countries outside the EU", () => {
    for (const id of ["DE12345678", "DE1234567890", "DEABCDEFGHI", "ATU1234567", "NL123456789B1", "GB123456789", "US123456789", "", "12345"]) {
      expect(parseVatId(id), id).toEqual({ ok: false, code: "VAT_ID_FORMAT_INVALID" });
    }
  });
});

describe("country helpers", () => {
  it("knows the 27 member states", () => {
    expect(isEuCountry("de")).toBe(true);
    expect(isEuCountry("GR")).toBe(true);
    expect(isEuCountry("CH")).toBe(false);
    expect(isEuCountry("GB")).toBe(false);
    expect(vatPrefixFor("gr")).toBe("EL");
    expect(vatPrefixFor("de")).toBe("DE");
  });
});
