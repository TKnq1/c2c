import type { Metadata } from "next";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import { LegalDocument } from "@/components/legal-document";
import { canonical } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { deTerms } from "@/lib/legal/de";
import { LEGAL_UPDATED } from "@/lib/legal/version";

export const metadata: Metadata = { title: "Terms of Service", alternates: canonical("/legal/terms") };

const SECTIONS: { title: string; body: string[] }[] = [
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
      `We charge a ${PLATFORM_FEE_RATE * 100}% platform fee on every payment made through comtor. Brands can subscribe to Pro for ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month, which lowers the fee to ${PRO_PLATFORM_FEE_RATE * 100}% while Pro is active. Pro renews each month until you cancel it in Settings. Cancelling stops the next renewal. There is no listing fee.`,
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

export default async function TermsPage() {
  const german = (await getLocale()) === "de";
  return (
    <LegalDocument
      title={german ? "Allgemeine Geschäftsbedingungen" : "Terms of Service"}
      updated={german ? LEGAL_UPDATED.de : LEGAL_UPDATED.en}
      sections={german ? deTerms() : SECTIONS}
    />
  );
}
