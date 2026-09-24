import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = {
  title: "FAQ",
  description: "How matching, payments, and reviews work on C2C.",
};

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How does matching work?",
    answer:
      "Brands post a request with a niche, a minimum follower count, and a product category. Creators see requests that match their own niche and where at least one of their platforms clears the follower threshold. No manual approval — if it matches, it shows up in the feed.",
  },
  {
    question: "How do I reach out?",
    answer:
      'A creator clicks "I\'m interested" on a matching request. That opens a conversation both sides can use to message each other directly, in addition to seeing each other\'s contact email.',
  },
  {
    question: "How do payments work?",
    answer:
      `A brand pays a creator through the platform, not directly. The payment is held in escrow until the creator marks the work as posted, at which point it's released to them. The platform keeps a ${PLATFORM_FEE_RATE * 100}% fee out of every payment by default. Brands doing regular volume can subscribe to Pro for ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month to drop that to ${PRO_PLATFORM_FEE_RATE * 100}%.`,
  },
  {
    question: "What's the Pro plan?",
    answer:
      `An optional monthly subscription for brands (${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month) that lowers the platform fee from ${PLATFORM_FEE_RATE * 100}% to ${PRO_PLATFORM_FEE_RATE * 100}% on every offer. It pays for itself once you're sending roughly ${formatCents(Math.round(PRO_SUBSCRIPTION_PRICE_CENTS / (PLATFORM_FEE_RATE - PRO_PLATFORM_FEE_RATE)))}/month or more in offers. Billed monthly through Stripe — manage or cancel it from Settings.`,
  },
  {
    question: "What if the creator never posts?",
    answer:
      "A brand can cancel a payment that's still held in escrow and get a full refund at any time before it's released. Once released, it can't be reversed — reviews from both sides help everyone judge who's reliable before paying.",
  },
  {
    question: "Is this real money?",
    answer:
      "Yes — collab payments and the Pro subscription both run through Stripe, and real money moves between real bank accounts.",
  },
  {
    question: "How are follower counts verified?",
    answer:
      "They're self-reported. Every platform a creator lists links directly to the real account, so anyone can check the actual count themselves before reaching out.",
  },
  {
    question: "Can I leave a review?",
    answer:
      "Yes, once a payment for a collab has been released, either side can leave a rating and a short comment. Reviews are visible on public profiles to help others decide who to work with.",
  },
  {
    question: "How do I get in touch?",
    answer: "Reach us using the details on our Imprint page.",
  },
];

// Lets Google render these as an expandable rich result directly in search,
// rather than just a plain blue link — the exact question/answer pairs
// below, structured as https://schema.org/FAQPage expects.
function FaqJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export default function FaqPage() {
  return (
    <main className="flex-1 px-6 py-16">
      <FaqJsonLd />
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-display text-title-1 font-bold">Frequently asked questions</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
            How the platform works, in plain terms.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {FAQS.map((f) => (
            <div key={f.question}>
              <h2 className="font-semibold">{f.question}</h2>
              <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">{f.answer}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          See also our{" "}
          <Link href="/legal/terms" className="underline">
            Terms
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/legal/imprint" className="underline">
            Imprint
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
