import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Overview",
    body: "This describes what data the platform actually collects and why, based on how it's built today. It's a prototype's privacy notice, not a lawyer-reviewed policy — real legal review is needed before this is shown to anyone outside a closed demo.",
  },
  {
    title: "2. Account data",
    body: "Your email address and a hashed password (never stored in plain text) to create and secure your account. If you enable two-factor authentication, a TOTP secret is stored to verify codes.",
  },
  {
    title: "3. Profile data",
    body: "Whatever you enter on your profile: for brands, company name, website, niche, and description; for creators, display name, niche, bio, language, and per-platform follower counts and social links. Any avatar or logo image you upload is stored as part of your profile. All of this is visible to other users of the platform by design — it's how matching and outreach work.",
  },
  {
    title: "4. Messages, payments, and activity",
    body: "Messages you send through the platform are stored and visible to the person you're messaging. Payment records (amount, fee, status) are stored for the simulated escrow feature described in our Terms — no real financial or card data is collected, since no real payment processor is connected. Reviews, reports, and blocks you create or receive are stored to power those features.",
  },
  {
    title: "5. Login activity",
    body: "Each login attempt records the IP address and browser user-agent string alongside the timestamp and whether it succeeded, so you can review recent activity on your account and so we can detect abuse (e.g. rate-limiting repeated failed logins).",
  },
  {
    title: "6. Cookies and push notifications",
    body: "A single session cookie keeps you logged in — no third-party analytics or advertising cookies are used. If you enable browser push notifications, your browser's push subscription (endpoint and keys, assigned by your browser vendor) is stored so we can deliver them; nothing is sent if you don't opt in.",
  },
  {
    title: "7. Sharing",
    body: "Data isn't sold or shared with third parties. Profile information, messages, and reviews are visible to other users only in the ways the product itself shows them (matching, conversations, public profiles).",
  },
  {
    title: "8. Access, export, and deletion",
    body: "You can export your data as JSON from Settings at any time, and delete your account entirely from the Danger zone section of Settings — deletion removes your account and cascades to your profile, messages, and related records.",
  },
  {
    title: "9. Changes",
    body: "We may update this notice as the product changes. Continued use after a change means you accept the updated version.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-display text-3xl font-normal">Privacy Policy</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
            A factual description of what this prototype collects — not a substitute for real
            legal review before this goes live beyond a closed demo.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-semibold">{s.title}</h2>
              <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
