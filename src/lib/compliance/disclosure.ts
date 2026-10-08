import { POST_FORMATS, type PostFormat } from "@/lib/social/platforms";
import { errorIssue, warningIssue, type Issue } from "@/lib/deals/issues";

// Advertising disclosure for sponsored posts. The German rules are the strictest the platform meets: § 5a Abs. 4 UWG
// (commercial purpose must be recognisable), § 8 MStV and § 6 DDG (commercial communication must be clearly
// identifiable), applied by the courts and the Landesmedienanstalten to influencer posts. In short: say "Werbung" or
// "Anzeige" where it is seen first, in the caption and in the content itself; "#ad" and friends are not enough, and
// neither is the platform's paid-partnership switch alone. Other markets get their own wording below. This is a
// technical check of the wording, not legal advice.

export const MARKETS = ["DE", "AT", "CH", "FR", "ES", "IT", "NL", "PT", "PL", "OTHER"] as const;
export type Market = (typeof MARKETS)[number];

export function isMarket(value: string): value is Market {
  return (MARKETS as readonly string[]).includes(value);
}

type MarketRules = {
  // Wording that counts as a clear disclosure.
  accepted: string[];
  // Hashtags that look like a disclosure but are not enough there.
  insufficient: string[];
};

const GENERIC_INSUFFICIENT = ["sponsored", "spon", "sp", "collab", "gifted", "partner", "sponsoredby", "thanks", "danke"];

export const MARKET_RULES: Record<Market, MarketRules> = {
  DE: { accepted: ["Werbung", "Anzeige"], insufficient: ["ad", "ads", "kooperation", "dank", ...GENERIC_INSUFFICIENT] },
  AT: { accepted: ["Werbung", "Anzeige", "Entgeltliche Einschaltung"], insufficient: ["ad", "ads", ...GENERIC_INSUFFICIENT] },
  CH: { accepted: ["Werbung", "Anzeige", "Publicité", "Pubblicità"], insufficient: ["ad", "ads", ...GENERIC_INSUFFICIENT] },
  FR: { accepted: ["Publicité", "Partenariat rémunéré", "Collaboration commerciale"], insufficient: ["ad", "ads", "sponso", ...GENERIC_INSUFFICIENT] },
  ES: { accepted: ["Publicidad", "Anuncio", "Publi"], insufficient: ["ad", "ads", "colaboracion", ...GENERIC_INSUFFICIENT] },
  IT: { accepted: ["Pubblicità", "ADV", "Sponsorizzato"], insufficient: ["ad", "ads", "collaborazione", ...GENERIC_INSUFFICIENT.filter((w) => w !== "sponsored")] },
  NL: { accepted: ["Advertentie", "Reclame", "Ad", "Betaalde samenwerking"], insufficient: ["ads", "samenwerking", ...GENERIC_INSUFFICIENT] },
  PT: { accepted: ["Publicidade", "Publi"], insufficient: ["ad", "ads", "parceria", ...GENERIC_INSUFFICIENT] },
  PL: { accepted: ["Reklama", "Materiał reklamowy", "Współpraca reklamowa"], insufficient: ["ad", "ads", "wspolpraca", ...GENERIC_INSUFFICIENT] },
  OTHER: { accepted: ["Advertisement", "Ad", "Sponsored", "Paid partnership"], insufficient: ["ads", "collab", "gifted", "partner"] },
};

// Lower case without accents, so "Publicité" and "publicite" are one word.
export function fold(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const WORD_EDGE_BEFORE = "(?<![\\p{L}\\p{N}_])";
const WORD_EDGE_AFTER = "(?![\\p{L}\\p{N}_])";

// "Werbung", "#Werbung", "WERBUNG:" — but not "#werbungwegenmarkennennung" or "Werbungskosten".
function labelPattern(label: string, hashtagOnly: boolean): RegExp {
  const words = fold(label).split(/\s+/).map(escapeRegExp).join("\\s+");
  const hash = hashtagOnly ? "#" : "#?";
  return new RegExp(`${WORD_EDGE_BEFORE}${hash}${words}${WORD_EDGE_AFTER}`, "u");
}

export type CaptionScan = {
  // Accepted wording found, with where the first one stands in the (folded) caption.
  accepted: { label: string; index: number }[];
  // Insufficient hashtags found ("#ad").
  insufficient: string[];
};

export function scanCaption(caption: string, market: Market): CaptionScan {
  const text = fold(caption);
  const rules = MARKET_RULES[market];
  const accepted: CaptionScan["accepted"] = [];
  for (const label of rules.accepted) {
    const match = labelPattern(label, false).exec(text);
    if (match) accepted.push({ label, index: match.index });
  }
  const insufficient = rules.insufficient.filter((word) => labelPattern(word, true).test(text)).map((w) => `#${w}`);
  return { accepted, insufficient };
}

export function hashtagsIn(caption: string): string[] {
  const found = fold(caption).match(/#[\p{L}\p{N}_]{1,60}/gu) ?? [];
  return [...new Set(found)].slice(0, 50);
}

function mentionsIn(caption: string): string[] {
  const found = fold(caption).match(/@[\p{L}\p{N}_.]{1,60}/gu) ?? [];
  return [...new Set(found)];
}

export type LabelClass = "accepted" | "insufficient" | "unknown";

// How a brand's chosen wording is judged for a market (briefing builder).
export function classifyLabel(label: string, market: Market): LabelClass {
  const folded = fold(label.replace(/^#/, "").trim());
  const rules = MARKET_RULES[market];
  if (rules.accepted.some((l) => fold(l) === folded)) return "accepted";
  if (rules.insufficient.some((l) => fold(l) === folded)) return "insufficient";
  return "unknown";
}

// Instructions that tell the creator not to disclose are void and make the brand a party to the violation (Anhang
// Nr. 11 UWG: advertising disguised as an independent opinion). Refused outright, in the briefing's free text.
const FORBIDDEN_INSTRUCTIONS: RegExp[] = [
  /(?:nicht|nie|niemals)\s+(?:als\s+)?(?:werbung|anzeige|werbepartnerschaft)\s+(?:zu\s+)?(?:kennzeichnen|markieren|deklarieren|erkennbar)/i,
  /(?:werbung|anzeige|werbepartnerschaft)\s+(?:bitte\s+)?(?:nicht|nie|niemals)\s+(?:zu\s+)?(?:kennzeichnen|markieren|deklarieren|erkennbar)/i,
  /(?:werbung|anzeige|werbekennzeichnung|kennzeichnung)\s+(?:bitte\s+)?(?:nicht\s+)?(?:weglassen|vermeiden|entfernen|verstecken|verbergen|l[oö]schen)/i,
  /(?:ohne|keine|kein)\s+(?:werbe-?\s?kennzeichnung|werbehinweis|werbe-?\s?label)/i,
  /(?:als|wie)\s+(?:eine?\s+)?(?:private|pers[oö]nliche|organische|eigene)\s+(?:empfehlung|meinung|erfahrung)\s+(?:darstellen|ausgeben|wirken|aussehen)/i,
  /(?:do\s*n[o']?t|never|without)\s+(?:use\s+)?(?:an?\s+|the\s+)?(?:#?ad\b|#?sponsored|disclos\w*|label\w*|mark\w*\s+(?:it\s+)?as\s+(?:an?\s+)?(?:ad|advert\w*|sponsored))/i,
  /(?:hide|remove|skip|omit)\s+(?:the\s+)?(?:#?ad\b|sponsor\w*|disclosure|paid\s+partnership)/i,
  /(?:look|appear|seem)\s+(?:like\s+)?(?:an?\s+)?(?:organic|genuine|authentic)\s+(?:post|recommendation)/i,
];

export function containsForbiddenDisclosureInstruction(text: string | null | undefined): boolean {
  if (!text) return false;
  return FORBIDDEN_INSTRUCTIONS.some((pattern) => pattern.test(text));
}

export type PostDisclosureInput = {
  format: PostFormat;
  market: Market;
  caption: string | null;
  // The creator says the content itself (spoken or on screen, e.g. a "Werbung" sticker on a story) is marked.
  disclosureInContent: boolean;
  // The platform's own paid-partnership switch is on.
  paidPartnershipLabel: boolean;
  agreed: {
    labels: string[];
    requirePaidPartnershipLabel: boolean;
    requiredHashtags: string[];
    requiredMentions: string[];
  };
};

export type PostDisclosureResult = {
  issues: Issue[];
  // The accepted wording that was found first in the caption.
  labelUsed: string | null;
  hashtags: string[];
};

// Checked when a draft is handed in (the caption the creator plans) and again when the live post is reported.
export function validatePostDisclosure(input: PostDisclosureInput): PostDisclosureResult {
  const info = POST_FORMATS[input.format];
  const issues: Issue[] = [];
  const caption = input.caption?.trim() ?? "";
  const isStory = info.kind === "story";

  if (!caption && !isStory) issues.push(errorIssue("CAPTION_REQUIRED", "caption"));

  let labelUsed: string | null = null;
  if (caption) {
    const scan = scanCaption(caption, input.market);
    if (scan.accepted.length === 0) {
      if (scan.insufficient.length > 0) {
        issues.push(errorIssue("DISCLOSURE_LABEL_INSUFFICIENT", "caption", { label: scan.insufficient.join(", ") }));
      } else {
        issues.push(errorIssue("DISCLOSURE_LABEL_MISSING", "caption", { labels: MARKET_RULES[input.market].accepted.join(" / ") }));
      }
    } else {
      const first = [...scan.accepted].sort((a, b) => a.index - b.index)[0];
      labelUsed = first.label;
      if (!isStory && first.index > info.visibleCaptionChars) {
        issues.push(errorIssue("DISCLOSURE_NOT_PROMINENT", "caption", { chars: info.visibleCaptionChars }));
      }
      const agreedFolded = input.agreed.labels.map((l) => fold(l));
      if (agreedFolded.length > 0 && !scan.accepted.some((a) => agreedFolded.includes(fold(a.label)))) {
        issues.push(warningIssue("DISCLOSURE_LABEL_NOT_AGREED", "caption", { labels: input.agreed.labels.join(" / ") }));
      }
    }
  }

  // Video and story: the disclosure also has to be in the content (spoken or on screen), not only in the text below.
  if ((info.kind === "video" || info.kind === "story") && !input.disclosureInContent) {
    issues.push(errorIssue("DISCLOSURE_IN_CONTENT_REQUIRED", "disclosureInContent"));
  }

  if (info.partnershipLabel && input.agreed.requirePaidPartnershipLabel && !input.paidPartnershipLabel) {
    issues.push(errorIssue("PAID_PARTNERSHIP_LABEL_REQUIRED", "paidPartnershipLabel", { label: info.partnershipLabel }));
  }

  // Stories carry hashtags and mentions as stickers; those are looked at in the proof, not in a caption.
  if (!isStory) {
    const tags = hashtagsIn(caption);
    for (const wanted of input.agreed.requiredHashtags) {
      const tag = `#${fold(wanted.replace(/^#/, ""))}`;
      if (!tags.includes(tag)) issues.push(errorIssue("REQUIRED_HASHTAG_MISSING", "caption", { tag: `#${wanted.replace(/^#/, "")}` }));
    }
    const mentions = mentionsIn(caption);
    for (const wanted of input.agreed.requiredMentions) {
      const mention = `@${fold(wanted.replace(/^@/, ""))}`;
      if (!mentions.includes(mention)) issues.push(errorIssue("REQUIRED_MENTION_MISSING", "caption", { mention: `@${wanted.replace(/^@/, "")}` }));
    }
  }

  return { issues, labelUsed, hashtags: hashtagsIn(caption) };
}
