import { describe, expect, it } from "vitest";
import { cleanUtm, readUtm, utmColumns, utmFields, utmFromForm, utmQuery } from "@/lib/utm";

describe("cleanUtm", () => {
  it("keeps a label and drops anything that could be markup or free text", () => {
    expect(cleanUtm("Instagram_Ads")).toBe("instagram_ads");
    expect(cleanUtm("<script>alert(1)</script>")).toBe("scriptalert1script");
    expect(cleanUtm("a b&c=d")).toBe("abcd");
    expect(cleanUtm("x".repeat(200))).toHaveLength(80);
  });

  it("returns null for nothing usable", () => {
    expect(cleanUtm("   ")).toBeNull();
    expect(cleanUtm("%%%")).toBeNull();
    expect(cleanUtm(42)).toBeNull();
    expect(cleanUtm(undefined)).toBeNull();
  });
});

describe("readUtm", () => {
  it("reads the parameters of a search string", () => {
    const utm = readUtm(new URLSearchParams("utm_source=instagram&utm_campaign=creator-werben&role=creator"));
    expect(utm).toEqual({ source: "instagram", medium: null, campaign: "creator-werben", content: null });
  });

  it("reads page search params, taking the first of a repeated one", () => {
    expect(readUtm({ utm_source: ["tiktok", "x"], role: "brand" })?.source).toBe("tiktok");
  });

  it("is null when nothing is set", () => {
    expect(readUtm(new URLSearchParams("role=creator"))).toBeNull();
  });
});

describe("utmQuery", () => {
  it("round-trips and is empty for none", () => {
    const utm = readUtm(new URLSearchParams("utm_source=a&utm_medium=b&utm_campaign=c&utm_content=d"));
    expect(utmQuery(utm)).toBe("utm_source=a&utm_medium=b&utm_campaign=c&utm_content=d");
    expect(utmQuery(null)).toBe("");
  });
});

describe("utmColumns, utmFields and utmFromForm", () => {
  it("give nulls for no campaign and the four columns for one", () => {
    expect(utmColumns(null)).toEqual({ utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null });
    const utm = readUtm(new URLSearchParams("utm_source=Instagram&utm_campaign=Creator-Werben"));
    expect(utmColumns(utm)).toEqual({ utmSource: "instagram", utmMedium: null, utmCampaign: "creator-werben", utmContent: null });
  });

  it("round-trip through form fields, cleaning whatever arrives", () => {
    const utm = readUtm(new URLSearchParams("utm_source=tiktok&utm_content=video-1"));
    const form = new FormData();
    for (const [name, value] of Object.entries(utmFields(utm))) form.set(name, value);
    expect(utmFromForm(form)).toEqual(utm);

    const hostile = new FormData();
    hostile.set("utm_source", "<img src=x onerror=alert(1)>");
    expect(utmFromForm(hostile)?.source).toBe("imgsrcxonerroralert1");
    expect(utmFromForm(new FormData())).toBeNull();
  });
});
