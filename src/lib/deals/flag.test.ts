import { afterEach, describe, expect, it } from "vitest";
import { dealsEnabled, parseDealsFlag } from "@/lib/deals/flag";

describe("brand deals switch", () => {
  const saved = { a: process.env.BRAND_DEALS_ENABLED, b: process.env.NEXT_PUBLIC_BRAND_DEALS_ENABLED };
  afterEach(() => {
    if (saved.a === undefined) delete process.env.BRAND_DEALS_ENABLED;
    else process.env.BRAND_DEALS_ENABLED = saved.a;
    if (saved.b === undefined) delete process.env.NEXT_PUBLIC_BRAND_DEALS_ENABLED;
    else process.env.NEXT_PUBLIC_BRAND_DEALS_ENABLED = saved.b;
  });

  it("is off unless it was switched on on purpose", () => {
    for (const raw of [undefined, "", "0", "false", "off", "no", "maybe"]) expect(parseDealsFlag(raw)).toBe(false);
  });

  it("accepts the usual spellings of on", () => {
    for (const raw of ["1", "true", "TRUE", " on ", "yes"]) expect(parseDealsFlag(raw)).toBe(true);
  });

  it("reads the server variable when the build-time copy is empty", () => {
    delete process.env.NEXT_PUBLIC_BRAND_DEALS_ENABLED;
    process.env.BRAND_DEALS_ENABLED = "1";
    expect(dealsEnabled()).toBe(true);
    process.env.NEXT_PUBLIC_BRAND_DEALS_ENABLED = "";
    expect(dealsEnabled()).toBe(true);
  });

  it("is off when neither variable is set", () => {
    delete process.env.NEXT_PUBLIC_BRAND_DEALS_ENABLED;
    delete process.env.BRAND_DEALS_ENABLED;
    expect(dealsEnabled()).toBe(false);
  });
});
