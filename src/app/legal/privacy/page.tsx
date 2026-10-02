import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = { title: "Privacy Policy" };

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
      "Your email address, a hashed password (never stored in plain text), whether you're a brand or a creator, whether your email is verified and, if you turn on two-factor authentication, the secret used to check your codes. We need this to run your account (Art. 6(1)(b) GDPR).",
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
    title: "Waitlist",
    body: [
      "If you leave your email address on our homepage to hear when the iOS and Android apps are out, we store it together with whether you picked brand or creator, and use it for that one email only (Art. 6(1)(a) GDPR). Once the apps are out and we've told you, the address is deleted. You can withdraw your consent at any time by writing to info@comtor.app, and we'll delete it straight away.",
    ],
  },
  {
    title: "Security and logs",
    body: [
      "Each login records the time, whether it succeeded, your IP address and your browser, so you can see your recent logins in Settings and so we can stop abuse such as password guessing. When you use comtor, our hosting provider also processes technical data (IP address, time, the page requested, browser) to deliver it and keep it secure. Both rest on our legitimate interest in a secure service (Art. 6(1)(f) GDPR).",
    ],
  },
  {
    title: "Cookies, local storage and notifications",
    body: [
      "We use one strictly necessary cookie that keeps you logged in, for a year from your last visit; changing your password logs out your other devices. Your appearance and sound settings, whether you've dismissed the install hint and whether you picked brand or creator on our homepage are saved in your browser's local storage and never sent to us. There are no analytics or advertising cookies.",
      "Push notifications are only sent if you turn them on (Art. 6(1)(a) GDPR). They're delivered by your browser's push service (from Apple, Google or Mozilla, depending on your browser), and you can turn them off at any time in Settings or in your browser. Emails about your account, such as verification and password resets, are sent through Resend.",
    ],
  },
  {
    title: "Service providers",
    body: [
      "These providers process data on our behalf and according to our instructions (Art. 28 GDPR): Vercel Inc., USA, which hosts the website and app; Neon Inc., USA, whose database we use, hosted in Frankfurt, Germany; and Resend Inc., USA, which delivers account emails.",
      "Payments, payouts and the identity checks required for payouts are handled by Stripe. For some of this processing, Stripe Payments Europe, Ltd. (Ireland) is responsible itself. See Stripe's privacy policy.",
      "Where data reaches the USA, the transfer is based on the EU–U.S. Data Privacy Framework or on the EU Standard Contractual Clauses.",
    ],
  },
  {
    title: "How long we keep data",
    body: [
      "We keep your data for as long as you have an account. When you delete your account in Settings, your profile, requests, messages and everything connected to them are deleted with it. Stripe keeps its own records of payments as the law requires.",
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
      "Which requests a creator sees is decided by simple rules (niche and follower count), not by automated decision-making with legal or similarly significant effects (Art. 22 GDPR).",
    ],
  },
  {
    title: "Changes",
    body: ["We update this policy when the service changes; the date at the top shows the current version."],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="October 1, 2026"
      intro="What personal data comtor processes, why, and what rights you have."
      sections={SECTIONS}
    />
  );
}
