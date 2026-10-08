import { describe, expect, it } from "vitest";
import {
  classifyLabel,
  containsForbiddenDisclosureInstruction,
  hashtagsIn,
  scanCaption,
  validatePostDisclosure,
  type PostDisclosureInput,
} from "@/lib/compliance/disclosure";

const base: PostDisclosureInput = {
  format: "INSTAGRAM_REEL",
  market: "DE",
  caption: "Werbung | Meine liebste Gesichtscreme für den Herbst #glow",
  disclosureInContent: true,
  paidPartnershipLabel: true,
  agreed: { labels: ["Werbung", "Anzeige"], requirePaidPartnershipLabel: true, requiredHashtags: [], requiredMentions: [] },
};

const codes = (input: PostDisclosureInput) => validatePostDisclosure(input).issues.map((i) => `${i.severity}:${i.code}`);

describe("scanCaption", () => {
  it("finds the German labels with or without a hash, in any case", () => {
    expect(scanCaption("#Werbung für Glow", "DE").accepted.map((a) => a.label)).toEqual(["Werbung"]);
    expect(scanCaption("ANZEIGE: neu", "DE").accepted.map((a) => a.label)).toEqual(["Anzeige"]);
  });

  it("does not take a longer word or hashtag for the label", () => {
    expect(scanCaption("Werbungskosten sind abziehbar #werbungwegenmarkennennung", "DE").accepted).toEqual([]);
  });

  it("flags #ad and #sponsored as insufficient in Germany", () => {
    const scan = scanCaption("Neu im Shop #ad #sponsored", "DE");
    expect(scan.accepted).toEqual([]);
    expect(scan.insufficient).toEqual(["#ad", "#sponsored"]);
  });

  it("ignores accents so French wording matches", () => {
    expect(scanCaption("Publicite: super produit", "FR").accepted.map((a) => a.label)).toEqual(["Publicité"]);
  });

  it("knows other markets' wording", () => {
    expect(scanCaption("#ad best cream", "OTHER").accepted.map((a) => a.label)).toContain("Ad");
    expect(scanCaption("#pubblicità crema", "IT").accepted.length).toBe(1);
  });
});

describe("hashtagsIn", () => {
  it("returns distinct lower-case hashtags", () => {
    expect(hashtagsIn("Hi #Glow #glow #Hautpflege")).toEqual(["#glow", "#hautpflege"]);
  });
});

describe("classifyLabel", () => {
  it("separates accepted, insufficient and unknown wording per market", () => {
    expect(classifyLabel("Werbung", "DE")).toBe("accepted");
    expect(classifyLabel("#Anzeige", "DE")).toBe("accepted");
    expect(classifyLabel("ad", "DE")).toBe("insufficient");
    expect(classifyLabel("Liebe Grüße", "DE")).toBe("unknown");
    expect(classifyLabel("Ad", "OTHER")).toBe("accepted");
  });
});

describe("containsForbiddenDisclosureInstruction", () => {
  it("catches German and English instructions to hide the advertising", () => {
    for (const text of [
      "Bitte die Werbung nicht kennzeichnen",
      "Ohne Werbekennzeichnung posten",
      "Kennzeichnung weglassen, sonst wirkt es zu werblich",
      "Als persönliche Empfehlung darstellen",
      "Do not use #ad or any disclosure",
      "Hide the sponsor tag",
      "Make it look like an organic post",
    ]) {
      expect(containsForbiddenDisclosureInstruction(text), text).toBe(true);
    }
  });

  it("leaves ordinary instructions alone", () => {
    for (const text of [
      "Keine Werbung für andere Marken im selben Video",
      "Bitte Produkt im Hintergrund zeigen, nicht verwackelt",
      "Mention the discount code and show the packaging",
      null,
      "",
    ]) {
      expect(containsForbiddenDisclosureInstruction(text), String(text)).toBe(false);
    }
  });
});

describe("validatePostDisclosure", () => {
  it("accepts a caption that opens with the label, the platform label and an in-content disclosure", () => {
    expect(codes(base)).toEqual([]);
    expect(validatePostDisclosure(base).labelUsed).toBe("Werbung");
  });

  it("needs a caption on a feed or video post", () => {
    expect(codes({ ...base, caption: "  " })).toContain("error:CAPTION_REQUIRED");
  });

  it("rejects a caption without any label, and says when only #ad is there", () => {
    expect(codes({ ...base, caption: "Meine liebste Creme #glow" })).toContain("error:DISCLOSURE_LABEL_MISSING");
    expect(codes({ ...base, caption: "Meine liebste Creme #ad" })).toContain("error:DISCLOSURE_LABEL_INSUFFICIENT");
  });

  it("rejects a label that only appears after the platform cuts the caption off", () => {
    const long = `${"Ein langer Text über die Creme und warum sie so gut ist. ".repeat(4)}#Werbung`;
    expect(codes({ ...base, caption: long })).toContain("error:DISCLOSURE_NOT_PROMINENT");
  });

  it("applies the shorter visible length of TikTok", () => {
    const caption = `${"x".repeat(100)} Werbung`;
    expect(codes({ ...base, format: "TIKTOK_VIDEO", caption })).toContain("error:DISCLOSURE_NOT_PROMINENT");
    expect(codes({ ...base, format: "INSTAGRAM_REEL", caption })).not.toContain("error:DISCLOSURE_NOT_PROMINENT");
  });

  it("warns, but does not block, when other accepted wording was used", () => {
    expect(codes({ ...base, caption: "Anzeige | neu", agreed: { ...base.agreed, labels: ["Werbung"] } })).toEqual(["warning:DISCLOSURE_LABEL_NOT_AGREED"]);
  });

  it("requires the content itself to carry the disclosure for videos and stories", () => {
    expect(codes({ ...base, disclosureInContent: false })).toContain("error:DISCLOSURE_IN_CONTENT_REQUIRED");
    expect(codes({ ...base, format: "INSTAGRAM_POST", disclosureInContent: false })).not.toContain("error:DISCLOSURE_IN_CONTENT_REQUIRED");
    expect(codes({ ...base, format: "INSTAGRAM_STORY", caption: null, disclosureInContent: false })).toContain("error:DISCLOSURE_IN_CONTENT_REQUIRED");
  });

  it("does not ask a story for a caption", () => {
    expect(codes({ ...base, format: "INSTAGRAM_STORY", caption: null })).toEqual([]);
  });

  it("requires the platform's paid-partnership label when the brand does", () => {
    expect(codes({ ...base, paidPartnershipLabel: false })).toContain("error:PAID_PARTNERSHIP_LABEL_REQUIRED");
    expect(codes({ ...base, paidPartnershipLabel: false, agreed: { ...base.agreed, requirePaidPartnershipLabel: false } })).toEqual([]);
  });

  it("checks the required hashtags and mentions", () => {
    const agreed = { ...base.agreed, requiredHashtags: ["GlowCo"], requiredMentions: ["@glowco"] };
    expect(codes({ ...base, agreed })).toEqual(["error:REQUIRED_HASHTAG_MISSING", "error:REQUIRED_MENTION_MISSING"]);
    expect(codes({ ...base, caption: "Werbung | Creme #glowco @GlowCo", agreed })).toEqual([]);
  });
});
