import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";
import { formatCents } from "@/lib/format";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Acceptance",
    body: "By creating an account, you agree to these terms. If you don't agree, don't use the platform.",
  },
  {
    title: "2. The service",
    body: "We operate a marketplace connecting brands with content creators for paid collaborations. Brands post requests describing what they're looking for; creators who match can express interest, message the brand, and be paid through the platform.",
  },
  {
    title: "3. Accounts",
    body: "You're responsible for the accuracy of the information on your profile and for keeping your login credentials secure. One account per person or company.",
  },
  {
    title: "4. Fees",
    body: `We charge a ${PLATFORM_FEE_RATE * 100}% platform fee on every payment made through the platform. Brands may optionally subscribe to Pro for ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month to reduce this to ${PRO_PLATFORM_FEE_RATE * 100}%. There is no other listing or membership fee — you only pay the platform fee when a collaboration is paid for, plus the optional Pro subscription if you choose it.`,
  },
  {
    title: "5. Payments and escrow",
    body: "When a brand pays a creator, the payment is held by the platform until the creator marks the associated work as posted, at which point it is released to the creator (minus our fee). A brand may cancel a payment that is still held and receive a full refund at any time before it is released. Once released, a payment cannot be reversed through the platform.",
  },
  {
    title: "6. Conduct",
    body: "Don't misrepresent your follower counts, post fraudulent reviews, or use the platform to solicit payments outside of it in order to avoid our fee. We may suspend accounts that do.",
  },
  {
    title: "7. Content ownership",
    body: "Content created under a collaboration is governed by whatever agreement the brand and creator reach directly — the platform is not a party to that agreement and does not hold rights to it.",
  },
  {
    title: "8. Limitation of liability",
    body: "The platform is provided as-is. We facilitate connections and payments between independent brands and creators, but we are not responsible for the quality, timeliness, or legality of the content or collaborations agreed between them.",
  },
  {
    title: "9. Governing law",
    body: "[These terms are governed by the laws of [jurisdiction], without regard to its conflict-of-law provisions.]",
  },
  {
    title: "10. Changes",
    body: "We may update these terms from time to time. Continued use of the platform after a change means you accept the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-display text-3xl font-normal">Terms of Service</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
            A starting structure for a prototype — sections in brackets need real legal review
            before this goes live.
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
