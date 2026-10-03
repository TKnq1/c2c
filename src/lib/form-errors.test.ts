import { describe, expect, it } from "vitest";
import { describeInvalidForm, GENERIC_FORM_ERROR } from "@/lib/form-errors";
import { updateBrandProfileSchema, updateCreatorProfileSchema } from "@/lib/validation";

const valid = {
  displayName: "Jonas",
  niches: "Fitness",
  contentLanguage: "English",
  bio: "",
  platforms: JSON.stringify([{ platform: "YouTube", followerCount: 100, url: "https://youtube.com/@j" }]),
};

describe("describeInvalidForm", () => {
  it("names the field and the reason", () => {
    const parsed = updateCreatorProfileSchema.safeParse({ ...valid, platforms: "[]" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(describeInvalidForm(parsed.error)).toBe("Platforms & followers: Select at least one platform");
  });

  it("explains a missing platform link", () => {
    const platforms = JSON.stringify([{ platform: "YouTube", followerCount: 100, url: "" }]);
    const parsed = updateCreatorProfileSchema.safeParse({ ...valid, platforms });
    if (parsed.success) throw new Error("expected a failure");
    expect(describeInvalidForm(parsed.error)).toBe("Platforms & followers: Add the link to each of your profiles.");
  });

  it("covers the niche limit", () => {
    const parsed = updateCreatorProfileSchema.safeParse({ ...valid, niches: "Fitness,Food,Tech,Beauty" });
    if (parsed.success) throw new Error("expected a failure");
    expect(describeInvalidForm(parsed.error)).toBe("Niches: Pick up to 3 niches.");
  });

  it("covers the brand form too", () => {
    const parsed = updateBrandProfileSchema.safeParse({ companyName: "", niche: "Tech", description: "", lookingFor: "", socialLinks: "[]", website: "" });
    if (parsed.success) throw new Error("expected a failure");
    expect(describeInvalidForm(parsed.error)).toMatch(/^Company name: /);
  });

  it("falls back to the generic line for a field it doesn't know", () => {
    const parsed = updateCreatorProfileSchema.safeParse(undefined);
    if (parsed.success) throw new Error("expected a failure");
    expect(describeInvalidForm(parsed.error)).toBe(GENERIC_FORM_ERROR);
  });
});
