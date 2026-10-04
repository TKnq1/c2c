import { describe, expect, it } from "vitest";
import { parseOnboardingDraft } from "@/lib/onboarding-draft";

describe("parseOnboardingDraft", () => {
  it("keeps a creator draft and drops anything that isn't one", () => {
    const draft = parseOnboardingDraft(
      JSON.stringify({
        role: "CREATOR",
        step: 4,
        displayName: "Mia",
        niches: ["Beauty", 3],
        platforms: [
          { platform: "Instagram", followers: "12000", url: "https://instagram.com/mia" },
          { platform: "TikTok" },
        ],
        photoDataUrl: "data:image/jpeg;base64,abc",
        skipped: ["photo"],
      }),
    );
    expect(draft).toMatchObject({
      role: "CREATOR",
      step: 4,
      displayName: "Mia",
      niches: ["Beauty"],
      companyName: "",
      niche: "",
      photoDataUrl: "data:image/jpeg;base64,abc",
      skipped: ["photo"],
    });
    expect(draft?.platforms).toEqual([{ platform: "Instagram", followers: "12000", url: "https://instagram.com/mia" }]);
  });

  it("rejects a missing role and a broken payload", () => {
    expect(parseOnboardingDraft(JSON.stringify({ displayName: "Mia" }))).toBeNull();
    expect(parseOnboardingDraft("not json")).toBeNull();
    expect(parseOnboardingDraft(JSON.stringify({ role: "ADMIN" }))).toBeNull();
  });
});
