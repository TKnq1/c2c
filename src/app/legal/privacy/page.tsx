import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { canonical } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { dePrivacy } from "@/lib/legal/de";
import { LEGAL_UPDATED } from "@/lib/legal/version";

export const metadata: Metadata = { title: "Privacy Policy", alternates: canonical("/legal/privacy") };

// Describes what the app actually does with personal data — keep it in step
// with the code when that changes (new data, a new service provider).
const SECTIONS: { title: string; body: string[] }[] = [
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

const EN_SENTRY =
  "Functional Software, Inc. (Sentry), USA, records error reports from our website and app (error text, page requested, browser) so we can find and fix errors (Art. 6(1)(f) GDPR).";

export default async function PrivacyPage() {
  const german = (await getLocale()) === "de";
  // Sentry is named only where it is switched on, so the text matches what runs.
  const sentry = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
  const english = sentry
    ? SECTIONS.map((section) =>
        section.title === "Service providers" ? { ...section, body: [section.body[0], EN_SENTRY, ...section.body.slice(1)] } : section,
      )
    : SECTIONS;
  return (
    <LegalDocument
      title={german ? "Datenschutzerklärung" : "Privacy Policy"}
      updated={german ? LEGAL_UPDATED.de : LEGAL_UPDATED.en}
      intro={
        german
          ? "Welche personenbezogenen Daten comtor verarbeitet, warum, und welche Rechte du hast."
          : "What personal data comtor processes, why, and what rights you have."
      }
      sections={german ? dePrivacy({ sentry }) : english}
    />
  );
}
