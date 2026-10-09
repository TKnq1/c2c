import { describe, expect, it } from "vitest";
import { captionTemplate, postChecklist } from "@/lib/compliance/post-checklist";
import type { PostDisclosureInput } from "@/lib/compliance/disclosure";
import { POST_FORMATS } from "@/lib/social/platforms";

const agreed = { labels: ["Werbung", "Anzeige"], requirePaidPartnershipLabel: true, requiredHashtags: ["glowco", "herbst"], requiredMentions: ["glowco"] };
const base: PostDisclosureInput = { format: "TIKTOK_VIDEO", market: "DE", caption: "", disclosureInContent: false, paidPartnershipLabel: false, agreed };

const done = (input: PostDisclosureInput, options?: { content?: boolean; partnership?: boolean }) => Object.fromEntries(postChecklist(input, options).map((i) => [i.id, i.done]));

describe("postChecklist", () => {
  it("lists what a video needs, none of it done for an empty post", () => {
    expect(done(base)).toEqual({ label: false, hashtags: false, mentions: false, content: false, partnership: false });
  });

  it("ticks each item as the post meets it", () => {
    const caption = "Werbung | Meine Routine #glowco #herbst @glowco";
    expect(done({ ...base, caption })).toEqual({ label: true, hashtags: true, mentions: true, content: false, partnership: false });
    expect(done({ ...base, caption, disclosureInContent: true, paidPartnershipLabel: true })).toEqual({ label: true, hashtags: true, mentions: true, content: true, partnership: true });
  });

  it("does not tick the label when it stands too far back, or one hashtag when the other is missing", () => {
    const late = `${"x".repeat(200)} Werbung #glowco #herbst @glowco`;
    expect(done({ ...base, caption: late }).label).toBe(false);
    expect(done({ ...base, caption: "Werbung #glowco @glowco" }).hashtags).toBe(false);
  });

  it("offers what can be copied", () => {
    const items = postChecklist(base);
    expect(items.find((i) => i.id === "hashtags")?.copy).toBe("#glowco #herbst");
    expect(items.find((i) => i.id === "mentions")?.copy).toBe("@glowco");
    expect(items.find((i) => i.id === "label")?.copy).toBe("Werbung");
    expect(items.find((i) => i.id === "label")?.chars).toBe(POST_FORMATS.TIKTOK_VIDEO.visibleCaptionChars);
  });

  it("leaves out what the post cannot have", () => {
    // A story has no caption: the label and the tags are looked at on the proof.
    expect(Object.keys(done({ ...base, format: "INSTAGRAM_STORY" }))).toEqual(["content", "partnership"]);
    // An image has no spoken part, and a brand that does not ask for the platform switch leaves it out.
    expect(Object.keys(done({ ...base, format: "INSTAGRAM_POST", agreed: { ...agreed, requirePaidPartnershipLabel: false } }))).toEqual(["label", "hashtags", "mentions"]);
    // A draft has neither the content tick nor the platform switch.
    expect(Object.keys(done(base, { content: false, partnership: false }))).toEqual(["label", "hashtags", "mentions"]);
    expect(Object.keys(done({ ...base, agreed: { ...agreed, requiredHashtags: [], requiredMentions: [] } }, { content: false, partnership: false }))).toEqual(["label"]);
  });
});

describe("captionTemplate", () => {
  it("starts with the label, leaves room for the creator's words and ends with the tags", () => {
    expect(captionTemplate(agreed)).toBe("Werbung | \n\n#glowco #herbst @glowco");
    expect(captionTemplate({ ...agreed, requiredHashtags: [], requiredMentions: [] })).toBe("Werbung | ");
  });
});
