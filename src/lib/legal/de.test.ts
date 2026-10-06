import { afterEach, describe, expect, it, vi } from "vitest";
import { dePrivacy, imprintVatId } from "@/lib/legal/de";

const text = (sentry: boolean) => JSON.stringify(dePrivacy({ sentry }));

describe("dePrivacy", () => {
  it("names Sentry only where it is switched on", () => {
    expect(text(false)).not.toContain("Sentry");
    expect(text(true)).toContain("Sentry");
  });

  it("states what the code does: 30-day login cookie, anonymised payment records, no tracking", () => {
    const all = text(false);
    expect(all).toContain("30 Tage");
    expect(all).not.toContain("ein Jahr ab dem letzten Besuch");
    expect(all).toContain("anonymisiert");
    expect(all).toContain("Ob du eine Mail öffnest");
  });
});

describe("imprintVatId", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is shown only when IMPRINT_VAT_ID is set", () => {
    expect(imprintVatId()).toBeNull();
    vi.stubEnv("IMPRINT_VAT_ID", " DE123456789 ");
    expect(imprintVatId()).toBe("DE123456789");
  });
});
