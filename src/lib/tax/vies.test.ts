import { describe, expect, it, vi } from "vitest";
import { checkVatId, mapViesResponse, platformRequester } from "@/lib/tax/vies";

describe("mapViesResponse", () => {
  it("maps a valid answer with the consultation number", () => {
    expect(mapViesResponse(200, { valid: true, requestIdentifier: "WAPIAAAAabc", name: "Glow GmbH", address: "Rue 1\n75001 Paris" })).toEqual({
      status: "VALID",
      consultationNumber: "WAPIAAAAabc",
      name: "Glow GmbH",
      address: "Rue 1\n75001 Paris",
    });
  });

  it("drops the placeholder VIES prints for hidden data", () => {
    expect(mapViesResponse(200, { valid: true, name: "---", address: "---" })).toMatchObject({ status: "VALID", name: null, address: null });
  });

  it("maps a clear no to INVALID", () => {
    expect(mapViesResponse(200, { valid: false })).toMatchObject({ status: "INVALID" });
    expect(mapViesResponse(200, { errorWrappers: [{ error: "INVALID_INPUT" }] })).toMatchObject({ status: "INVALID" });
  });

  it("never turns an outage into a verdict", () => {
    expect(mapViesResponse(200, { errorWrappers: [{ error: "MS_UNAVAILABLE" }] })).toMatchObject({ status: "UNAVAILABLE" });
    expect(mapViesResponse(200, { userError: "MS_MAX_CONCURRENT_REQ" })).toMatchObject({ status: "UNAVAILABLE" });
    expect(mapViesResponse(503, null)).toMatchObject({ status: "UNAVAILABLE" });
    expect(mapViesResponse(429, {})).toMatchObject({ status: "UNAVAILABLE" });
    expect(mapViesResponse(200, "garbage")).toMatchObject({ status: "UNAVAILABLE" });
    expect(mapViesResponse(200, {})).toMatchObject({ status: "UNAVAILABLE" });
  });
});

describe("platformRequester", () => {
  it("uses the imprint VAT ID when it is well-formed", () => {
    expect(platformRequester({ IMPRINT_VAT_ID: " DE 123456789 " })).toEqual({ prefix: "DE", number: "123456789" });
    expect(platformRequester({ IMPRINT_VAT_ID: "nonsense" })).toBeNull();
    expect(platformRequester({})).toBeNull();
  });
});

describe("checkVatId", () => {
  it("posts the number with our own as requester and returns the mapped answer", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ valid: true, requestIdentifier: "ID1" }), { status: 200 })) as unknown as typeof fetch;
    const result = await checkVatId({ prefix: "FR", number: "12345678901" }, { prefix: "DE", number: "123456789" }, fetchImpl);
    expect(result).toMatchObject({ status: "VALID", consultationNumber: "ID1" });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe("https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      countryCode: "FR",
      vatNumber: "12345678901",
      requesterMemberStateCode: "DE",
      requesterNumber: "123456789",
    });
  });

  it("reports UNAVAILABLE when the request fails", async () => {
    const failing = vi.fn(async () => {
      throw new Error("timeout");
    }) as unknown as typeof fetch;
    expect((await checkVatId({ prefix: "FR", number: "12345678901" }, null, failing)).status).toBe("UNAVAILABLE");
  });
});
