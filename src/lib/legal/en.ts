import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import type { LegalContent, LegalSection } from "@/lib/legal/types";

// The English legal texts. Describe what the app actually does: keep them in step with the code when that
// changes (new data, a new service provider), and with the German texts in de.ts (the German version governs).
function enTerms(): LegalSection[] {
  return [
  {
    title: "Scope and operator",
    body: [
      "These terms apply to your use of comtor (comtor.app). The operator is Teethawat Kanpai, a sole trader in Berlin, Germany (see Imprint). Creating an account means you agree to these terms. For users in Germany, the German version of these terms is the one that applies.",
      "comtor is the technical platform only. A collaboration is a contract between the brand and the creator. The operator is not a party to it, does not employ the creator, and does not sell the brand's product.",
    ],
  },
  {
    title: "Who can use comtor",
    body: [
      "You must be at least 18, or you must be allowed to bind the business you act for. You're responsible for your login and for what is true on your profile. One account per person or business.",
    ],
  },
  {
    title: "The service",
    body: [
      "Brands post a request: what they want made, on which platform, for what budget and by when. Creators who match can show interest, agree a price in the chat, and be paid through comtor.",
      "We don't promise a match, a number of views, a sale, or any income. What you earn or spend depends on the deals you agree with other users.",
    ],
  },
  {
    title: "What you upload",
    body: [
      "You keep the rights to what you upload. You allow us to host it, show it to other users, and keep a backup, for as long as it stays on comtor, so the service can run. That permission ends when the content is deleted, apart from copies we have to keep by law.",
      "The work a creator makes for a brand belongs to whoever the two of them agree. We don't take rights in that work.",
    ],
  },
  {
    title: "Your responsibility",
    body: [
      "Brands are responsible for their requests, their product claims, and the rights to the photos they upload. Creators are responsible for their posts and must mark them as advertising where the law requires it (in Germany, for example, as “Werbung” or “Anzeige”).",
      "If a brand ships a product, that shipment is between the brand and the creator. We don't sell it and we don't ship it. A deposit, where a request asks for one, is collateral between those two, not a fee of ours.",
      "If a third party claims against us because of content you uploaded, a product you shipped, or a collaboration you agreed, and you are at fault, you will cover the claim and the reasonable cost of defending it. If you are a consumer, this applies only where the law allows.",
    ],
  },
  {
    title: "Fees",
    body: [
      `We charge a ${PLATFORM_FEE_RATE * 100}% platform fee on every payment made through comtor. Brands and creators can subscribe to Pro for ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month. While Pro is active, the fee is ${PRO_PLATFORM_FEE_RATE * 100}% on every payment where the brand or the creator has Pro. Pro renews each month until you cancel it in Settings. Cancelling stops the next renewal. There is no listing fee. The first ${FOUNDING_BRAND_LIMIT} brands (founding brands) and the first ${FOUNDING_CREATOR_LIMIT} creators (founding creators) that signed up with comtor get Pro for free for as long as their account exists. That Pro has no monthly price, can't be transferred and ends with the account. We can take it away if someone breaks these terms.`,
      "The platform fee is kept only when a payment is released to the creator. If a held payment is refunded, the brand gets that payment back and we don't keep a fee on it.",
    ],
  },
  {
    title: "Payments held for you",
    body: [
      `When a brand pays, we hold the money until the creator submits the link to the live post. The brand then has ${RELEASE_REVIEW_DAYS} days to approve it, which releases the payment to the creator minus our fee, or to report a problem. If the brand does neither, the payment is released. If a problem is reported, the money stays held while we review it, and we then either release it to the creator or refund it to the brand.`,
      "A brand can cancel and be refunded before the creator submits the link. After a payment has been released, it can't be reversed through comtor. Card payments and payouts are processed by Stripe. We never see the full card number.",
    ],
  },
  {
    title: "Conduct",
    body: [
      "Don't invent follower counts, post fake reviews, upload something you have no right to, or move a deal off comtor to avoid the fee. We can remove content and suspend or close an account that breaks these terms or the law.",
      "To report illegal content, or to ask us to look again at something we removed, write to info@comtor.app. We'll review it and tell you the result.",
      "If we remove content or suspend an account, we tell you the reason by email. You can object to the decision at info@comtor.app. We will look at it again and answer you.",
      "Only users whose collaboration was completed and paid out through comtor can leave a review.",
    ],
  },
  {
    title: "Liability",
    body: [
      "We are liable without limit for intent and gross negligence, for injury to life, body or health, and under the Product Liability Act. For slight negligence we are only liable if we breach a duty that is essential to the contract, and only for damage that is typical and foreseeable for this kind of contract.",
      "If you are a business, that liability for slight negligence is capped at the fees you paid us in the twelve months before the claim, or at €100 if you paid less. This cap does not apply to the cases in the previous paragraph.",
      "We are not liable for the quality, legality or timing of a collaboration, a post, or a product that users agree between themselves.",
    ],
  },
  {
    title: "Ending your account",
    body: [
      "You can delete your account in Settings. We can suspend or close an account that breaks these terms. Open payments are finished under the payment rules above.",
    ],
  },
  {
    title: "If you are a consumer",
    body: [
      "If you are a consumer in the EU, a statutory 14-day right of withdrawal can apply to Pro and to other paid services you buy from us at a distance. A collaboration you agree with another user is a contract with that user, not with us. Mandatory consumer law of the country where you live still applies.",
    ],
  },
  {
    title: "Law and courts",
    body: [
      "German law applies. If you are a business, the courts of Berlin have jurisdiction. If you are a consumer, you can sue us where you live, and we sue you only where you live.",
      "You can set off only a claim that we don't dispute or that a court has decided.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We can update these terms. We'll email you about a significant change at least 15 days before it applies. If you don't want it, you can delete your account until then.",
    ],
  },
  ];
}

const EN_SENTRY = "Functional Software, Inc. (Sentry), USA, records error reports from our website and app (error text, page requested, browser) so we can find and fix errors (Art. 6(1)(f) GDPR).";

function enPrivacy({ sentry }: { sentry: boolean }): LegalSection[] {
  const sections: LegalSection[] = [
  {
    title: "Who is responsible",
    body: [
      "The controller under the GDPR is Teethawat Kanpai, Sonnenscheinpfad 64, 12277 Berlin, Germany (see Imprint). For anything about your data, write to info@comtor.app.",
    ],
  },
  {
    title: "Your account",
    body: [
      "Your email address, a hashed password (never stored in plain text), whether you're a brand or a creator, whether your email is verified and, if you turn on two-factor authentication, the secret used to check your codes. We need this to run your account (Art. 6(1)(b) GDPR). We email you to verify your address, to reset your password when you ask, and to tell you when your password was changed.",
      "If we suspend an account for breaking our terms, we store when and why, so the decision can be reviewed later (Art. 6(1)(f) GDPR).",
      "When you sign up we also store when you agreed to the terms and this privacy policy and which version it was, and that you confirmed you are at least 18. This is our proof of it (Art. 6(1)(b) and (f) GDPR).",
      "Which setup steps you have seen or completed is stored with your account, so we can improve the setup (Art. 6(1)(f) GDPR).",
      "At the end of the setup we ask, voluntarily, how you heard about us (for example a search engine or a friend). Only if you answer, we store the option you picked with your account, to see which channels bring people to us (Art. 6(1)(a) GDPR). You can skip the question. The answer is deleted with the account.",
      "If you come to us through a link with campaign details (for example from an advert) and sign up, we store those details (source, medium, campaign) with your account, to see which advertising leads to sign-ups (Art. 6(1)(f) GDPR). We set no cookie and use no tracker for this: the details are only in the address of the link and are stored only when you register. We delete them with the account.",
      "We need your email address and password to enter into and perform a contract with you. Without them there is no account. Everything else you enter is optional, except what is required for payouts (Stripe verifies your identity for that).",
    ],
  },
  {
    title: "Profiles and requests",
    body: [
      "What you enter on your profile: for brands, company name, logo, website, niche, description and social links; for creators, display name, picture, niche, bio, language, and platforms with follower counts and links. A brand's requests include a title, description, photos, budget, platform and content, post-by date and product details.",
      "Profiles and requests are shown to other users (that's how matching works) and stored on our servers (Art. 6(1)(b) GDPR).",
    ],
  },
  {
    title: "Messages, offers and payments",
    body: [
      "Messages, offers and the links creators submit for their posts are stored and visible to the other side of the conversation. For payments we keep the amount, fee, status and dates; the payment itself runs through Stripe, and we never see your full card details. Reviews, reports and blocks are stored so those features work (Art. 6(1)(b) GDPR).",
    ],
  },
  {
    title: "Emails we send you",
    body: [
      "Account emails (verification, password reset, a changed password) are sent because you have an account (Art. 6(1)(b) GDPR). They go out through Resend.",
      "Occasional product news is separate and optional. If you tick that box when you create an account, or turn it on in Settings, we email you a link. Consent is the button on that page, not opening the mail. We store the time you confirmed (Art. 6(1)(a) GDPR). You can stop it in Settings, and we then stop. An unconfirmed request is not consent.",
      "We send promotional email only to people who agreed to it beforehand (Art. 6(1)(a) GDPR, Section 7(2) no. 3 UWG). An address saved on a list is not enough. We store the name and email address, a note on how and when you agreed, and which message we sent you (send log, 90 days). We do not record whether you open an email or click a link. Each of these emails tells you why you get it and has an unsubscribe link (also as one-click unsubscribe in your mail program).",
      "You can withdraw your consent at any time, with the link in the email or by writing to info@comtor.app. We then delete your address and the send log. We keep only a hash of the address, so we don't write to you again by mistake (Art. 6(1)(c) and (f) GDPR).",
    ],
  },
  {
    title: "Waitlist",
    body: [
      "If you leave your email address on our homepage to hear when the iOS and Android apps are out, we store it together with whether you picked brand or creator, and first send you an email with a link to confirm that the address is yours (double opt-in). Only once you've confirmed do we use it, for that one email only (Art. 6(1)(a) GDPR); we keep the time you confirmed as proof of your consent. If you don't confirm, you won't hear from us again and the address is deleted after 30 days. Once the apps are out and we've told you, the address is deleted. You can withdraw your consent at any time by writing to info@comtor.app, and we'll delete it straight away.",
    ],
  },
  {
    title: "Security and logs",
    body: [
      "Each login records the time, whether it succeeded, your IP address and your browser, so you can see your recent logins in Settings and so we can stop abuse such as password guessing. When you use comtor, our hosting provider also processes technical data (IP address, time, the page requested, browser) to deliver it and keep it secure. Both rest on our legitimate interest in a secure service (Art. 6(1)(f) GDPR). We delete the login log after 90 days, the IP address recorded at sign-up after 7 days and the abuse counters after 24 hours.",
    ],
  },
  {
    title: "Cookies, local storage and notifications",
    body: [
      "We only use strictly necessary cookies: one that keeps you logged in (30 days from your last visit), two short-lived ones of the login (protection against forged requests, and the address to return to) and one for the language you chose (one year). Changing your password logs out your other devices. Your appearance and sound settings, whether you've dismissed the install hint and whether you picked brand or creator on our homepage are saved in your browser's local storage and never sent to us. There are no analytics or advertising cookies.",
      "We count how often our homepage and the start of sign-up are opened, without a cookie and without recognising you: per day only one number per page and origin (the name of the referring website, or the source and campaign from the link). We do not store your IP address, your browser string or any identifier for you. This is to see which advertising and which pages bring visitors (Art. 6(1)(f) GDPR).",
      "On the pages where you set up payouts, Stripe loads its own scripts. They may set cookies or device identifiers of their own to prevent fraud (see Stripe's privacy policy).",
      "Push notifications are only sent if you turn them on (Art. 6(1)(a) GDPR). In a browser they're delivered by its push service (from Apple, Google or Mozilla, depending on your browser). In the comtor app for iPhone or Android we store a token for your device and send them through Apple Push Notification service or Google's Firebase Cloud Messaging. You can turn them off at any time in Settings, in your browser or in your phone's settings. Emails about your account, such as verification and password resets, are sent through Resend.",
    ],
  },
  {
    title: "Service providers",
    body: [
      "These providers process data on our behalf and according to our instructions (Art. 28 GDPR): Vercel Inc., USA, which hosts the website and app; Neon Inc., USA, whose database we use, hosted in Frankfurt, Germany; Resend Inc., USA, which delivers our emails (account, outreach and waitlist); and Google Ireland Limited, which delivers push notifications to the Android app through Firebase Cloud Messaging.",
      "Payments, payouts and the identity checks required for payouts are handled by Stripe. For some of this processing, Stripe Payments Europe, Ltd. (Ireland) is responsible itself. See Stripe's privacy policy.",
      "Push notifications to the iPhone app are delivered by Apple Inc., USA, through Apple Push Notification service.",
      "Where data reaches the USA, the transfer is based on the EU–U.S. Data Privacy Framework or on the EU Standard Contractual Clauses.",
    ],
  },
  {
    title: "How long we keep data",
    body: [
      "We keep your data for as long as you have an account. When you delete your account in Settings, your profile, requests, messages and everything connected to them are deleted with it.",
      "The exception is payment records (amount, fee, status, date and Stripe identifiers). We must keep them for as long as tax and commercial law require, 8 to 10 years depending on the record (Art. 6(1)(c) GDPR, Sections 147 AO and 257 HGB). They are anonymised so they no longer point to you. Stripe keeps its own payment records as the law requires.",
      "Other periods: login log 90 days, IP address recorded at sign-up 7 days, abuse counters 24 hours, send log of promotional emails 90 days, unconfirmed waitlist addresses 30 days.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "You can ask for access to your data (Art. 15 GDPR), have it corrected (Art. 16), deleted (Art. 17) or restricted (Art. 18), and get it in a portable format (Art. 20). The export in Settings gives you a copy at any time. You can object to processing based on legitimate interest (Art. 21) and withdraw any consent for the future (Art. 7(3)). Just write to info@comtor.app.",
      "You also have the right to complain to a data protection authority. For us, that's the Berlin Commissioner for Data Protection and Freedom of Information.",
    ],
  },
  {
    title: "No automated decisions",
    body: [
      "Which requests a creator sees is decided by simple rules (niche, content language and follower count), not by automated decision-making with legal or similarly significant effects (Art. 22 GDPR).",
    ],
  },
  {
    title: "Changes",
    body: ["We update this policy when the service changes; the date at the top shows the current version."],
  },
  ];
  // Sentry is named only where it is switched on, so the text matches what runs.
  return sentry
    ? sections.map((section) =>
        section.title === "Service providers" ? { ...section, body: [section.body[0], EN_SENTRY, ...section.body.slice(1)] } : section,
      )
    : sections;
}

const EN_LICENSES: LegalSection[] = [
  {
    title: "Open-source software",
    body: [
      "comtor is built with open-source software. Each package comes under its own licence, mostly MIT, Apache-2.0, ISC and BSD. The licence texts of everything the deployed app is built with are in the file linked below.",
    ],
  },
  {
    title: "Fonts",
    body: [
      "Text is set in Lato, Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name \"Lato\", under the SIL Open Font License, Version 1.1.",
    ],
  },
  {
    title: "Icons and brand names",
    body: [
      "Interface icons come from Feather and Ionicons (both MIT licence); the marks of the social platforms are from Simple Icons (CC0). The names and logos of Instagram, TikTok, YouTube, Twitch and X belong to their owners and are shown only to name the platform.",
    ],
  },
  {
    title: "Photos",
    body: [
      "The product photos on the landing page are from Unsplash and used under the Unsplash License. The brands, creators and ratings shown in the examples are made up.",
    ],
  },
];

export const legalEn: LegalContent = {
  htmlLang: "en",
  notice: "This page is a translation for convenience. If the two versions differ, the German version applies.",
  updated: "October 7, 2026",
  ui: {
    termsTitle: "Terms of Service",
    termsDescription: "The terms for using comtor.",
    privacyTitle: "Privacy Policy",
    privacyDescription: "What personal data comtor processes, why, and what rights you have.",
    imprintTitle: "Imprint",
    imprintDescription: "Information according to § 5 DDG.",
    vatLabel: "VAT identification number",
    licensesTitle: "Open-source licenses",
    licensesDescription: "Which software, fonts and images comtor uses, and under which licences.",
    licensesTextFile: "Licence texts of all open-source packages (text file)",
    licensesOfl: "Lato: SIL Open Font License",
  },
  terms: enTerms,
  privacy: enPrivacy,
  imprint: {
    lead: "Information according to § 5 DDG.",
    rows: [
      { label: "Service provider", lines: ["Teethawat Kanpai", "Sole trader (Einzelunternehmen)", "Sonnenscheinpfad 64", "12277 Berlin, Germany"] },
      { label: "Contact", lines: ["info@comtor.app", "+49 172 4134526"] },
      { label: "Responsible for content", lines: ["Teethawat Kanpai, address as above (§ 18 (2) MStV)"] },
    ],
    disputeTitle: "Consumer dispute resolution",
    dispute: "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.",
  },
  licenses: EN_LICENSES,
};
