import { POST_FORMATS } from "@/lib/social/platforms";
import { validatePostDisclosure, type PostDisclosureInput } from "@/lib/compliance/disclosure";

// What a creator has to get into a post, as a list with ticks instead of a paragraph: the advertising label up front, the agreed
// hashtags and mentions, the label in the content itself, the platform's paid-partnership switch. Each item knows whether the
// post as it is typed meets it, and what can be copied for it. The same check the server runs, read as a checklist.

export type ChecklistItemId = "label" | "hashtags" | "mentions" | "content" | "partnership";

export type ChecklistItem = {
  id: ChecklistItemId;
  done: boolean;
  // What the sentence for the item names ("Werbung / Anzeige", "#glowco #herbst", the platform's switch).
  detail: string;
  // What the copy button puts on the clipboard, when there is something to copy.
  copy?: string;
  // How many characters stand before the platform cuts the caption (the label has to be inside them).
  chars?: number;
};

const hashtag = (tag: string) => `#${tag.replace(/^#/, "")}`;
const mention = (name: string) => `@${name.replace(/^@/, "")}`;

export function postChecklist(input: PostDisclosureInput, options: { content?: boolean; partnership?: boolean } = {}): ChecklistItem[] {
  const { content = true, partnership = true } = options;
  const info = POST_FORMATS[input.format];
  const isStory = info.kind === "story";
  const result = validatePostDisclosure(input);
  const codes = new Set(result.issues.filter((i) => i.severity === "error").map((i) => i.code));
  const items: ChecklistItem[] = [];

  if (!isStory) {
    items.push({
      id: "label",
      done: result.labelUsed !== null && !codes.has("DISCLOSURE_NOT_PROMINENT"),
      detail: input.agreed.labels.join(" / "),
      copy: input.agreed.labels[0],
      chars: info.visibleCaptionChars,
    });
    if (input.agreed.requiredHashtags.length > 0) {
      items.push({ id: "hashtags", done: !codes.has("REQUIRED_HASHTAG_MISSING"), detail: input.agreed.requiredHashtags.map(hashtag).join(" "), copy: input.agreed.requiredHashtags.map(hashtag).join(" ") });
    }
    if (input.agreed.requiredMentions.length > 0) {
      items.push({ id: "mentions", done: !codes.has("REQUIRED_MENTION_MISSING"), detail: input.agreed.requiredMentions.map(mention).join(" "), copy: input.agreed.requiredMentions.map(mention).join(" ") });
    }
  }
  if (content && (info.kind === "video" || info.kind === "story")) items.push({ id: "content", done: input.disclosureInContent, detail: "" });
  if (partnership && info.partnershipLabel && input.agreed.requirePaidPartnershipLabel) {
    items.push({ id: "partnership", done: input.paidPartnershipLabel, detail: info.partnershipLabel });
  }
  return items;
}

// A caption to start from: the label first, then room for the creator's own words, then the agreed hashtags and mentions.
export function captionTemplate(agreed: PostDisclosureInput["agreed"]): string {
  const tail = [...agreed.requiredHashtags.map(hashtag), ...agreed.requiredMentions.map(mention)].join(" ");
  return [`${agreed.labels[0] ?? ""} | `, tail].filter((part) => part !== "").join("\n\n");
}
