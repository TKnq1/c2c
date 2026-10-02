import { describe, expect, it } from "vitest";
import {
  createRequestSchema,
  onboardingNichesSchema,
  onboardingPlatformsSchema,
  sendOfferSchema,
  updateCreatorProfileSchema,
} from "@/lib/validation";

// sendOfferSchema's `amount` field is the euro string straight out of a
// payment form (see PayCreatorForm/OfferForm) — this is the boundary where
// user input turns into the integer cents every payment calculation from
// then on assumes it can trust.
describe("sendOfferSchema (dollarsToCents)", () => {
  it("converts a whole-euro amount to cents", () => {
    const result = sendOfferSchema.safeParse({ amount: "250" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(25_000);
  });

  it("converts a two-decimal amount to cents", () => {
    const result = sendOfferSchema.safeParse({ amount: "250.50" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(25_050);
  });

  it("rejects more than two decimal places", () => {
    expect(sendOfferSchema.safeParse({ amount: "250.505" }).success).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(sendOfferSchema.safeParse({ amount: "abc" }).success).toBe(false);
    expect(sendOfferSchema.safeParse({ amount: "" }).success).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(sendOfferSchema.safeParse({ amount: "-50" }).success).toBe(false);
  });

  it("rejects below the €1.00 minimum", () => {
    expect(sendOfferSchema.safeParse({ amount: "0.50" }).success).toBe(false);
  });

  it("accepts exactly the €1.00 minimum", () => {
    const result = sendOfferSchema.safeParse({ amount: "1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(100);
  });

  it("rejects above the €100,000.00 maximum", () => {
    expect(sendOfferSchema.safeParse({ amount: "100000.01" }).success).toBe(false);
  });

  it("accepts exactly the €100,000.00 maximum", () => {
    const result = sendOfferSchema.safeParse({ amount: "100000" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(10_000_000);
  });
});

describe("createRequestSchema", () => {
  const valid = {
    title: "Summer skincare launch",
    description: "Show our serum in your morning routine.",
    niche: "Beauty",
    languages: "English",
    minFollowers: "5000",
    productCategory: "Cosmetics",
    platform: "Instagram",
    deliverables: "1 Reel + 2 Stories",
    budgetMin: "200",
    budgetMax: "400",
    postBy: "",
    productIncluded: "true",
  };
  const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

  it("turns the budget range into cents", () => {
    const r = createRequestSchema.parse(valid);
    expect(r.budgetMin).toBe(20_000);
    expect(r.budgetMax).toBe(40_000);
    expect(r.productIncluded).toBe(true);
    expect(r.postBy).toBeNull();
  });

  it("accepts a comma as the decimal separator", () => {
    expect(createRequestSchema.parse({ ...valid, budgetMin: "199,50", budgetMax: "" }).budgetMin).toBe(19_950);
  });

  it("treats an empty top of the range as a fixed price", () => {
    expect(createRequestSchema.parse({ ...valid, budgetMax: "" }).budgetMax).toBeNull();
  });

  it("rejects a range that runs backwards", () => {
    const r = createRequestSchema.safeParse({ ...valid, budgetMin: "400", budgetMax: "200" });
    expect(r.success).toBe(false);
  });

  it("requires a budget", () => {
    expect(createRequestSchema.safeParse({ ...valid, budgetMin: "" }).success).toBe(false);
  });

  it("requires what should be posted", () => {
    expect(createRequestSchema.safeParse({ ...valid, deliverables: "  " }).success).toBe(false);
  });

  it("only takes known platforms", () => {
    expect(createRequestSchema.safeParse({ ...valid, platform: "MySpace" }).success).toBe(false);
  });

  it("stores the post-by day as midnight UTC", () => {
    const day = inDays(10);
    expect(createRequestSchema.parse({ ...valid, postBy: day }).postBy?.toISOString()).toBe(`${day}T00:00:00.000Z`);
  });

  it("rejects a post-by date in the past", () => {
    expect(createRequestSchema.safeParse({ ...valid, postBy: inDays(-5) }).success).toBe(false);
  });

  it("rejects a post-by date more than a year out", () => {
    expect(createRequestSchema.safeParse({ ...valid, postBy: inDays(500) }).success).toBe(false);
  });

  it("reads a missing product switch as not included", () => {
    const { productIncluded, ...rest } = valid;
    void productIncluded;
    expect(createRequestSchema.parse(rest).productIncluded).toBe(false);
  });
});

describe("onboardingPlatformsSchema", () => {
  const parse = (platforms: unknown) => onboardingPlatformsSchema.safeParse({ platforms: JSON.stringify(platforms) });

  it("takes platforms with followers and a profile link", () => {
    expect(parse([{ platform: "TikTok", followerCount: 1200, url: "https://tiktok.com/@lea" }]).success).toBe(true);
  });

  it("requires a profile link for every platform", () => {
    expect(parse([{ platform: "TikTok", followerCount: 1200 }]).success).toBe(false);
    expect(parse([{ platform: "TikTok", followerCount: 1200, url: "  " }]).success).toBe(false);
  });

  it("rejects a link that isn't a URL", () => {
    expect(parse([{ platform: "TikTok", followerCount: 1200, url: "tiktok lea" }]).success).toBe(false);
  });
});

describe("onboardingNichesSchema", () => {
  it("reads the comma-joined niches a form posts", () => {
    const r = onboardingNichesSchema.parse({ niches: "Beauty,Fitness" });
    expect(r.niches).toEqual(["Beauty", "Fitness"]);
  });

  it("accepts one niche and up to three", () => {
    expect(onboardingNichesSchema.safeParse({ niches: "Beauty" }).success).toBe(true);
    expect(onboardingNichesSchema.safeParse({ niches: "Beauty,Fitness,Food" }).success).toBe(true);
  });

  it("needs at least one niche", () => {
    expect(onboardingNichesSchema.safeParse({ niches: "" }).success).toBe(false);
  });

  it("refuses a fourth niche", () => {
    const r = onboardingNichesSchema.safeParse({ niches: "Beauty,Fitness,Food,Tech" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("Pick up to 3 niches.");
  });

  it("refuses unknown and repeated niches", () => {
    expect(onboardingNichesSchema.safeParse({ niches: "Beauty,Astrology" }).success).toBe(false);
    expect(onboardingNichesSchema.safeParse({ niches: "Beauty,Beauty" }).success).toBe(false);
  });
});

describe("updateCreatorProfileSchema", () => {
  const valid = {
    displayName: "Mia Summers",
    niches: "Beauty,Fitness",
    contentLanguage: "English",
    platforms: JSON.stringify([{ platform: "Instagram", followerCount: 5000, url: "https://instagram.com/mia" }]),
  };

  it("takes the niches as a list", () => {
    const r = updateCreatorProfileSchema.parse(valid);
    expect(r.niches).toEqual(["Beauty", "Fitness"]);
  });

  it("rejects a profile without a niche", () => {
    expect(updateCreatorProfileSchema.safeParse({ ...valid, niches: "" }).success).toBe(false);
  });
});
