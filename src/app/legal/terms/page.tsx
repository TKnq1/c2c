import type { Metadata } from "next";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = { title: "Terms of Service" };

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Scope and operator",
    body: [
      "These terms apply to your use of comtor (comtor.app), operated by Teethawat Kanpai, Berlin, Germany (see Imprint). By creating an account you agree to them; if you don't, please don't use comtor.",
    ],
  },
  {
    title: "The service",
    body: [
      "comtor connects brands with content creators for paid collaborations. Brands post requests: what they want made, on which platform, for what budget and by when. Creators who match can express interest, agree a price with the brand in the chat, and get paid through comtor. comtor isn't a party to the collaboration itself.",
    ],
  },
  {
    title: "Accounts",
    body: [
      "You're responsible for the accuracy of your profile and for keeping your login details secure. One account per person or company.",
    ],
  },
  {
    title: "Fees",
    body: [
      `We charge a ${PLATFORM_FEE_RATE * 100}% platform fee on every payment made through comtor. Brands can subscribe to Pro for ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month, which lowers it to ${PRO_PLATFORM_FEE_RATE * 100}%. There are no other listing or membership fees. The fee only applies when a collaboration is paid for, plus Pro if you choose it.`,
    ],
  },
  {
    title: "Payments and escrow",
    body: [
      `When a brand pays a creator, comtor holds the payment until the creator submits the link to the posted work. The brand then has ${RELEASE_REVIEW_DAYS} days to either approve it, which releases the payment to the creator (minus our fee), or report a problem. If the brand does neither within ${RELEASE_REVIEW_DAYS} days, the payment is released automatically. If a problem is reported, the payment stays held while we review the case, after which we either release it to the creator or refund it in full to the brand.`,
      "A brand can cancel a payment and get a full refund at any time before the creator submits the link. Once released, a payment can't be reversed through comtor.",
    ],
  },
  {
    title: "Requests and posts",
    body: [
      "Brands are responsible for their requests: that the details are accurate, and that they have the rights to the photos they upload. Creators are responsible for their posts and must label them as advertising wherever the law requires it (in Germany, for example, as “Werbung” or “Anzeige”).",
    ],
  },
  {
    title: "Conduct",
    body: [
      "Don't misrepresent your follower counts, post fraudulent reviews, or use comtor to arrange payments outside of it to avoid our fee. We may suspend accounts that do.",
    ],
  },
  {
    title: "Content ownership",
    body: [
      "Content created in a collaboration is governed by whatever the brand and creator agree between themselves. comtor isn't a party to that agreement and holds no rights to the content.",
    ],
  },
  {
    title: "Liability",
    body: [
      "We're liable without limitation for intent and gross negligence, for injury to life, body or health, and under the Product Liability Act. For simple negligence, we're only liable for breaching an obligation that's essential to the contract, and then only for the damage that's typical and foreseeable for this kind of contract.",
      "Beyond that, we're not responsible for the quality, timeliness or legality of the content and collaborations agreed between brands and creators.",
    ],
  },
  {
    title: "Ending your account",
    body: ["You can delete your account at any time in Settings. We may suspend or close accounts that break these terms."],
  },
  {
    title: "Governing law",
    body: [
      "German law applies. If you're a consumer, this doesn't take away the protection of the mandatory law of the country where you live.",
    ],
  },
  {
    title: "Changes",
    body: ["We may update these terms. We'll tell you about significant changes by email before they take effect."],
  },
];

export default function TermsPage() {
  return <LegalDocument title="Terms of Service" updated="October 1, 2026" sections={SECTIONS} />;
}
