import { LANGUAGES, NICHES, PRODUCT_CATEGORIES } from "@/lib/constants";
import type { MessageKey, TFunction } from "@/lib/i18n/translate";

const NICHE_KEYS = Object.fromEntries(NICHES.map((niche) => [niche, `screens.niches.${niche}`])) as Record<
  (typeof NICHES)[number],
  MessageKey
>;

const LANGUAGE_KEYS = Object.fromEntries(LANGUAGES.map((language) => [language, `screens.languages.${language}`])) as Record<
  (typeof LANGUAGES)[number],
  MessageKey
>;

const CATEGORY_KEYS: Record<(typeof PRODUCT_CATEGORIES)[number], MessageKey> = {
  Cosmetics: "screens.categories.cosmetics",
  Supplements: "screens.categories.supplements",
  Sportswear: "screens.categories.sportswear",
  Electronics: "screens.categories.electronics",
  Fashion: "screens.categories.fashion",
  "Food & Beverage": "screens.categories.food",
  "Software/App": "screens.categories.software",
};

const PRESET_KEYS: Record<string, MessageKey> = {
  "1 Reel": "screens.presets.reel",
  "1 Reel + 2 Stories": "screens.presets.reelStories",
  "1 Post": "screens.presets.post",
  "3 Stories": "screens.presets.stories",
  "1 Video": "screens.presets.video",
  "2 Videos": "screens.presets.videos",
  "1 Short": "screens.presets.short",
  "1 Integration": "screens.presets.integration",
  "1 Stream mention": "screens.presets.streamMention",
  "1 Sponsored stream": "screens.presets.sponsoredStream",
  "1 Thread": "screens.presets.thread",
};

const ERROR_KEYS: Record<string, MessageKey> = {
  "Couldn't save your profile. Please try again.": "screens.errors.profileSave",
  "Current password is incorrect.": "screens.errors.currentPassword",
  "Incorrect email or password.": "screens.errors.badLogin",
  "Please enter a valid email and password (min. 8 characters).": "screens.errors.badCredentials",
  "This account has been suspended. Contact us via the Imprint page if you think this is a mistake.": "screens.errors.suspended",
  "Incorrect code. Please try again.": "screens.errors.badCode",
  "This email is already registered.": "screens.errors.emailTaken",
  "Please fill in all fields correctly.": "screens.errors.fillFields",
  "Please accept the terms and the privacy policy.": "screens.errors.acceptTerms",
  "Not authorized.": "screens.errors.notAuthorized",
  // The landing page's waitlist form (see joinWaitlistAction).
  "Enter a valid email address.": "landing.waitlist.errorInvalid",
  "Too many attempts. Try again later.": "landing.waitlist.errorTooMany",
  "That didn't work. Try again in a moment.": "landing.waitlist.errorFailed",
};

export function nicheLabel(t: TFunction, niche: string): string {
  const key = NICHE_KEYS[niche as (typeof NICHES)[number]];
  return key ? t(key) : niche;
}

export function contentLanguageLabel(t: TFunction, language: string): string {
  const key = LANGUAGE_KEYS[language as (typeof LANGUAGES)[number]];
  return key ? t(key) : language;
}

export function categoryLabel(t: TFunction, category: string): string {
  const key = CATEGORY_KEYS[category as (typeof PRODUCT_CATEGORIES)[number]];
  return key ? t(key) : category;
}

export function presetLabel(t: TFunction, preset: string): string {
  const key = PRESET_KEYS[preset];
  return key ? t(key) : preset;
}

export function localizeError(message: string, t: TFunction): string {
  const key = ERROR_KEYS[message];
  return key ? t(key) : localizeNotification(message, t);
}

type NoticePattern = { pattern: RegExp; text: (m: RegExpMatchArray, t: TFunction) => string };

const NOTICES: NoticePattern[] = [
  { pattern: /^(\d+) new requests match your profile$/, text: (m, t) => t("screens.notifications.digestRequests", { count: m[1] }) },
  { pattern: /^(\d+) new creators joined matching your requests$/, text: (m, t) => t("screens.notifications.digestCreators", { count: m[1] }) },
  { pattern: /^(\d+) creators are interested in your requests$/, text: (m, t) => t("screens.notifications.digestInterest", { count: m[1] }) },
  { pattern: /^New message from (.+)$/, text: (m, t) => t("screens.notifications.newMessage", { name: m[1] }) },
  { pattern: /^New (.+) creator joined: (.+)$/, text: (m, t) => t("screens.notifications.newCreator", { niche: nicheLabel(t, m[1]), name: m[2] }) },
  { pattern: /^(.+)'s payment of (.+) for "(.+)" is now held in escrow$/, text: (m, t) => t("screens.notifications.escrowHeld", { brand: m[1], amount: m[2], title: m[3] }) },
  { pattern: /^Your payment for "(.+)" failed\. Try again from Payments\.$/, text: (m, t) => t("screens.notifications.paymentFailed", { title: m[1] }) },
  { pattern: /^Your (.+) for "(.+)" was released to (.+)\. No problem was reported within (\d+) days\.$/, text: (m, t) => t("screens.notifications.releasedTo", { amount: m[1], title: m[2], name: m[3], days: m[4] }) },
  { pattern: /^Your (.+) for "(.+)" was released\. (.+) didn't report a problem within (\d+) days\.$/, text: (m, t) => t("screens.notifications.autoReleased", { amount: m[1], title: m[2], brand: m[3], days: m[4] }) },
  { pattern: /^We reviewed the problem you reported on "(.+)" and released the payment to (.+)$/, text: (m, t) => t("screens.notifications.reviewedReleased", { title: m[1], name: m[2] }) },
  { pattern: /^We reviewed the problem reported on "(.+)" and released your (.+)$/, text: (m, t) => t("screens.notifications.adminReleased", { title: m[1], amount: m[2] }) },
  { pattern: /^We reviewed the problem you reported on "(.+)" and refunded your (.+)$/, text: (m, t) => t("screens.notifications.reviewedRefundedBrand", { title: m[1], amount: m[2] }) },
  { pattern: /^We reviewed the problem reported on "(.+)" and refunded (.+)$/, text: (m, t) => t("screens.notifications.reviewedRefundedCreator", { title: m[1], brand: m[2] }) },
  { pattern: /^(.+) cancelled and refunded the payment for "(.+)"$/, text: (m, t) => t("screens.notifications.brandRefunded", { brand: m[1], title: m[2] }) },
  { pattern: /^(.+) sent you an offer of (.+) for "(.+)"$/, text: (m, t) => t("screens.notifications.offerSent", { brand: m[1], amount: m[2], title: m[3] }) },
  { pattern: /^(.+) countered with (.+) for "(.+)"$/, text: (m, t) => t("screens.notifications.countered", { name: m[1], amount: m[2], title: m[3] }) },
  { pattern: /^(.+) withdrew their offer for "(.+)"$/, text: (m, t) => t("screens.notifications.withdrew", { name: m[1], title: m[2] }) },
  { pattern: /^Accepted: pay (.+) for "(.+)" to hold it in escrow$/, text: (m, t) => t("screens.notifications.acceptedPay", { amount: m[1], title: m[2] }) },
  { pattern: /^(.+) accepted your offer of (.+) for "(.+)"\. Waiting on the brand to complete payment\.$/, text: (m, t) => t("screens.notifications.acceptedWaiting", { name: m[1], amount: m[2], title: m[3] }) },
  { pattern: /^(.+) accepted your offer of (.+) for "(.+)"\. Head to Payments to pay and hold it in escrow\.$/, text: (m, t) => t("screens.notifications.acceptedHead", { name: m[1], amount: m[2], title: m[3] }) },
  { pattern: /^(.+) declined your offer for "(.+)"$/, text: (m, t) => t("screens.notifications.declined", { name: m[1], title: m[2] }) },
  { pattern: /^(.+) updated the link to their post for "(.+)"\. You have (\d+) days to approve it or report a problem\.$/, text: (m, t) => t("screens.notifications.linkUpdated", { name: m[1], title: m[2], days: m[3] }) },
  { pattern: /^(.+) posted the content for "(.+)"\. Approve the payment or report a problem within (\d+) days\.$/, text: (m, t) => t("screens.notifications.posted", { name: m[1], title: m[2], days: m[3] }) },
  { pattern: /^(.+) reported a problem with your post for "(.+)"\. The payment is on hold while we look into it\.$/, text: (m, t) => t("screens.notifications.problemReported", { brand: m[1], title: m[2] }) },
  { pattern: /^(.+) is requesting a (.+) refundable deposit before shipping product for "(.+)"$/, text: (m, t) => t("screens.notifications.depositRequest", { brand: m[1], amount: m[2], title: m[3] }) },
  { pattern: /^(.+) paid their (.+) deposit for "(.+)"$/, text: (m, t) => t("screens.notifications.depositPaid", { name: m[1], amount: m[2], title: m[3] }) },
  { pattern: /^(.+) returned your (.+) deposit for "(.+)"$/, text: (m, t) => t("screens.notifications.depositReturned", { brand: m[1], amount: m[2], title: m[3] }) },
  { pattern: /^(.+) kept your (.+) deposit for "(.+)" because they determined the content wasn't delivered$/, text: (m, t) => t("screens.notifications.depositKept", { brand: m[1], amount: m[2], title: m[3] }) },
  { pattern: /^New (.+) request from (.+): "(.+)"$/, text: (m, t) => t("screens.notifications.newRequest", { niche: nicheLabel(t, m[1]), brand: m[2], title: m[3] }) },
  { pattern: /^(.+) is interested in "(.+)"$/, text: (m, t) => t("screens.notifications.interestedIn", { name: m[1], title: m[2] }) },
  { pattern: /^(.+) approved your post for "(.+)"\. (.+) is on its way to you\.$/, text: (m, t) => t("screens.notifications.approved", { brand: m[1], title: m[2], amount: m[3] }) },
];

export function localizeNotification(message: string, t: TFunction): string {
  for (const notice of NOTICES) {
    const match = message.match(notice.pattern);
    if (match) return notice.text(match, t);
  }
  return message;
}
