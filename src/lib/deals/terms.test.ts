import { describe, expect, it } from "vitest";
import { buildTerms, canonicalJson, defaultBriefingFor, parseTerms, termsHash } from "@/lib/deals/terms";
import { validateBriefing } from "@/lib/compliance/briefing";

const request = {
  id: "r1",
  title: "Autumn launch",
  productCategory: "Cosmetics",
  deliverables: "1 Reel",
  platform: "Instagram",
  postBy: new Date("2026-11-30"),
};

describe("defaultBriefingFor", () => {
  it("builds a lawful German briefing from an old request", () => {
    const briefing = defaultBriefingFor(request);
    expect(briefing.contentFormats).toEqual(["INSTAGRAM_REEL"]);
    expect(briefing.disclosureLabels).toEqual(["Werbung", "Anzeige"]);
    expect(validateBriefing(briefing, { budgetMaxCents: null, now: new Date("2026-10-08") }).filter((i) => i.severity === "error")).toEqual([]);
  });

  it("has no format when the request names an unsupported platform", () => {
    expect(defaultBriefingFor({ platform: "Twitch", postBy: null }).contentFormats).toEqual([]);
  });
});

describe("buildTerms", () => {
  const source = {
    request,
    briefing: defaultBriefingFor(request),
    brandName: "Glow",
    creatorName: "Mia",
    amountCents: 100_000,
    payoutCents: 90_000,
    platformFeeCents: 10_000,
  };

  it("freezes the price, the split and the workflow", () => {
    const terms = buildTerms(source);
    expect(terms).toMatchObject({ amountCents: 100_000, payoutCents: 90_000, targetMarket: "DE", contentFormats: ["INSTAGRAM_REEL"] });
    expect(terms.workflow.postingWindowEnd).toBe("2026-11-30");
    expect(terms.workflow.minLiveHours).toBe(24);
  });

  it("drops formats that do not exist", () => {
    const terms = buildTerms({ ...source, briefing: { ...source.briefing, contentFormats: ["INSTAGRAM_REEL", "NOPE"] } });
    expect(terms.contentFormats).toEqual(["INSTAGRAM_REEL"]);
  });

  it("hashes the same terms to the same value regardless of key order, and different terms differently", () => {
    const terms = buildTerms(source);
    const reordered = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(terms).reverse())));
    expect(termsHash(reordered)).toBe(termsHash(terms));
    expect(termsHash({ ...terms, amountCents: 100_001 })).not.toBe(termsHash(terms));
    expect(termsHash(terms)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("canonicalJson", () => {
  it("sorts keys and skips undefined", () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 1, c: undefined }] })).toBe('{"a":[2,{"d":1}],"b":1}');
  });
});

describe("parseTerms", () => {
  it("refuses anything that is not current terms", () => {
    expect(() => parseTerms(null)).toThrow();
    expect(() => parseTerms({ version: 99 })).toThrow();
    expect(parseTerms({ version: 1 }).version).toBe(1);
  });
});
