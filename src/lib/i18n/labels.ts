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
  "Please accept the terms and the privacy policy, and confirm that you are at least 18.": "extras.errors.consent",
  "Not authorized.": "screens.errors.notAuthorized",
  // The server actions in src/lib/actions/*.ts (texts in messages/extras-*.ts).
  "This interest could not be found.": "extras.errors.interestNotFound",
  "There's already an offer or payment in progress for this creator.": "extras.errors.offerInProgress",
  "You've sent a lot of offers today. Try again tomorrow.": "extras.errors.offerLimit",
  "This offer could not be found.": "extras.errors.offerNotFound",
  "This offer isn't awaiting your response.": "extras.errors.offerNotAwaiting",
  "The offer changed in the meantime. Please look at the new offer.": "extras.errors.offerChanged",
  "This offer isn't ready for payment.": "extras.errors.offerNotReady",
  "This payment is already going through. It'll show as held in escrow shortly.": "extras.errors.paymentProcessing",
  "This payment changed in the meantime. Reload the page.": "extras.errors.paymentChanged",
  "This payment could not be found.": "extras.errors.paymentNotFound",
  "A problem was reported on this collab. We're looking into it, so the link can't change right now.": "extras.errors.postLocked",
  "Set up payouts first. The money needs somewhere to go once it's approved.": "extras.errors.payoutsFirst",
  "There's no submitted post to approve on this payment.": "extras.errors.noSubmittedPost",
  "You reported a problem on this payment. We'll settle it from here.": "extras.errors.youReported",
  "You already reported a problem. We're looking into it.": "extras.errors.alreadyReported",
  "This payment can't be put on hold anymore. It may have just been released, so refresh the page.": "extras.errors.cannotHold",
  "This payment isn't held anymore.": "extras.errors.notHeld",
  "This payment can't be released right now. Refresh the page.": "extras.errors.cannotRelease",
  "Releasing the payment failed. Please try again.": "extras.errors.releaseFailed",
  "Releasing the payment didn't finish. We'll check it and complete it manually.": "extras.errors.releasePending",
  "This payment can't be refunded right now. Refresh the page.": "extras.errors.cannotRefund",
  "Refunding the payment failed. Please try again.": "extras.errors.refundFailed",
  "Refunding the payment didn't finish. We'll check it and complete it manually.": "extras.errors.refundPending",
  "Invalid selection": "extras.errors.invalidSelection",
  "Add the link to each of your profiles.": "extras.errors.addProfileLinks",
  "Pick a valid post-by date.": "extras.errors.pickPostBy",
  "The post-by date can't be in the past.": "extras.errors.postByPast",
  "Pick a post-by date within the next year.": "extras.errors.postByTooFar",
  "Choose where it gets posted.": "extras.errors.choosePlatform",
  "The top of the budget range can't be below the bottom.": "extras.errors.budgetRange",
  "Invalid device token": "extras.errors.invalidDeviceToken",
  "This link doesn't work anymore. Leave your email on comtor.app again to get a new one.": "extras.errors.waitlistLinkGone",
  "Incorrect password.": "extras.errors.incorrectPassword",
  "Two-factor authentication is already enabled.": "extras.errors.twoFactorOn",
  "Start enrollment again.": "extras.errors.enrollAgain",
  "That code didn't match. Check your app and try again.": "extras.errors.codeMismatch",
  "Pro isn't available in the app.": "extras.errors.proNotInApp",
  "You're already on Pro.": "extras.errors.alreadyPro",
  "Pro can't be withdrawn right now.": "extras.errors.cannotWithdrawPro",
  "The 14 days to withdraw have passed. You can still cancel Pro.": "extras.errors.withdrawWindowPassed",
  "No payment to refund.": "extras.errors.noPaymentToRefund",
  "The withdrawal didn't go through. Try again, or write to info@comtor.app.": "extras.errors.withdrawalFailed",
  "This payment isn't under review anymore.": "extras.errors.notUnderReview",
  "Too many attempts. Try again in 15 minutes.": "extras.errors.tooManyAttempts15",
  "A payment is still in progress. Finish or cancel it first, then you can delete your account.": "extras.errors.deletePaymentOpen",
  "We couldn't cancel your Pro subscription. Try again, or cancel it under Settings first.": "extras.errors.cancelProFailed",
  "Please choose a niche.": "extras.errors.chooseNiche",
  "Please choose one of the options.": "extras.errors.chooseOption",
  "Choose a niche first.": "extras.errors.chooseNicheFirst",
  "Please try again in a moment.": "extras.errors.tryAgainMoment",
  "Account created, but automatic login failed. Please log in manually.": "extras.errors.autoLoginFailed",
  "Please enter a valid email address.": "extras.errors.validEmail",
  "This reset link is invalid or has expired.": "extras.errors.resetInvalid",
  "This verification link is invalid or has expired.": "extras.errors.verifyInvalid",
  "One of the photos is too large. Try a smaller one.": "extras.errors.photoTooLarge",
  "Photos have to be JPEG, PNG or WebP images.": "extras.errors.photoFormat",
  "Something went wrong with the photos. Try adding them again.": "extras.errors.photoGeneric",
  "Something went wrong with the photos. Reload the page and try again.": "extras.errors.photoReload",
  "You've saved a lot of drafts today. Try again tomorrow.": "extras.errors.draftsToday",
  "This request could not be found.": "extras.errors.requestNotFound",
  "This request changed in the meantime. Reload the page and try again.": "extras.errors.requestChanged",
  "Deposits aren't available yet.": "extras.errors.depositsUnavailable",
  "A deposit has already been requested for this collab.": "extras.errors.depositRequested",
  "This collab could not be found.": "extras.errors.collabNotFound",
  "You can only review a completed collab.": "extras.errors.reviewCompletedOnly",
  "Message can't be empty.": "extras.errors.messageEmpty",
  "Message is too long.": "extras.errors.messageTooLong",
  "You're sending messages too fast. Wait a moment.": "extras.errors.messageTooFast",
  "This conversation could not be found.": "extras.errors.conversationNotFound",
  "You can't message this person.": "extras.errors.cannotMessage",
  "You can't report yourself.": "extras.errors.reportSelf",
  "Choose a reason.": "extras.errors.chooseReason",
  "You've sent a lot of reports today.": "extras.errors.reportsToday",
  "This account no longer exists.": "extras.errors.accountGone",
  "Couldn't reach the server. Check your connection and try again.": "extras.errors.network",
  "Something went wrong. Refresh the page and try again.": "extras.errors.generic",
  // The landing page's waitlist form (see joinWaitlistAction).
  "Enter a valid email address.": "landing.waitlist.errorInvalid",
  "Too many attempts. Try again later.": "landing.waitlist.errorTooMany",
  "That didn't work. Try again in a moment.": "landing.waitlist.errorFailed",
};

// The English messages that have a translation. Tests check each one still exists in the server code.
export const TRANSLATED_ERROR_MESSAGES = Object.keys(ERROR_KEYS);

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
  if (key) return t(key);
  for (const entry of ERROR_PATTERNS) {
    const match = message.match(entry.pattern);
    if (match) return entry.text(match, t);
  }
  return localizeNotification(message, t);
}

type NoticePattern = { pattern: RegExp; text: (m: RegExpMatchArray, t: TFunction) => string };

// Server messages with a name, a count or a label in them.
const ERROR_PATTERNS: NoticePattern[] = [
  { pattern: /^(.+) hasn't finished setting up payouts yet, so it can't be released\.$/, text: (m, t) => t("extras.errors.creatorPayoutsNotReady", { name: m[1] }) },
  { pattern: /^(.+) already submitted their post\. Report a problem instead, and we'll look into it\.$/, text: (m, t) => t("extras.errors.alreadySubmitted", { name: m[1] }) },
  { pattern: /^(.+) must be under 500 KB\.$/, text: (m, t) => t("extras.errors.imageTooBig", { label: imageLabel(m[1], t) }) },
  { pattern: /^(.+) must be a JPEG, PNG or WebP image\.$/, text: (m, t) => t("extras.errors.imageFormat", { label: imageLabel(m[1], t) }) },
  { pattern: /^Add at most (\d+) photos\.$/, text: (m, t) => t("extras.errors.maxPhotos", { count: m[1] }) },
  { pattern: /^You have (\d+) drafts\. Post or delete some before saving new ones\.$/, text: (m, t) => t("extras.errors.maxDrafts", { count: m[1] }) },
];

function imageLabel(label: string, t: TFunction): string {
  if (label === "Photo") return t("screens.settings.photo");
  if (label === "Logo") return t("screens.settings.logo");
  return label;
}


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
