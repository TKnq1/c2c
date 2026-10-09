// The FAQ page (/faq). Numbers come from src/lib/constants.ts and are filled in as {placeholders}:
// {days} review days, {fee} standard fee %, {proFee} Pro fee %, {price} Pro price per month,
// {breakEven} monthly volume where Pro pays for itself, {foundingBrands} / {foundingCreators} founding places.
export const faq = {
  meta: {
    title: "FAQ",
    description: "How matching, payments and reviews work on comtor.",
  },
  // Appended to the payments answer. Left out inside the store apps, which can't sell Pro.
  proOffer:
    " Subscribe to Pro for {price} a month and the fee drops to {proFee}%. It applies to every payment where either side has Pro.",
  items: {
    matching: {
      question: "How does matching work?",
      answer:
        "Brands post a request with a niche, the content languages, a minimum follower count and a product category. Creators pick up to 3 niches. Under “For you” they see requests in those niches, if the request is in their content language and one of their platforms clears the follower minimum. Under “All” they see every request that fits their language and reach. Nobody approves matches by hand: a fitting request appears in the feed.",
    },
    reachOut: {
      question: "How do I reach out?",
      answer:
        "Tap “I'm interested” on a matching request. That opens a chat where both sides write to each other directly. Both also see each other's contact email.",
    },
    payments: {
      question: "How do payments work?",
      answer:
        "The brand pays the creator through comtor, never directly. The money is held until the creator posts and submits the link. Then the brand has {days} days to approve the post, which releases the money at once, or to report a problem. No answer after {days} days? The money is released automatically. comtor keeps {fee}% of every payment.{proOffer}",
    },
    pro: {
      question: "What's the Pro plan?",
      answer:
        "An optional monthly subscription for brands and creators ({price} a month). It lowers the fee from {fee}% to {proFee}% on every payment where the brand or the creator has Pro. One side is enough. Pro pays for itself once about {breakEven} a month goes through your account. Stripe bills you monthly. Manage or cancel it in Settings. The first {foundingBrands} brands and the first {foundingCreators} creators get Pro free for as long as their account exists.",
    },
    noPost: {
      question: "What if the creator never posts?",
      answer:
        "The brand cancels the payment any time before the creator submits the post and gets the full amount back. If a post is submitted but something is wrong (missing, taken down, not as agreed), the brand reports a problem within {days} days. The money stays on hold while we check the case. Then we release it to the creator or refund the brand. A released payment can't be reversed. Reviews from both sides show who is reliable before you pay.",
    },
    realMoney: {
      question: "Is this real money?",
      answer: "Yes. Collab payments and the Pro subscription run through Stripe. Real money moves between real bank accounts.",
    },
    followers: {
      question: "How are follower counts verified?",
      answer:
        "Creators enter them themselves. Every platform links to the real account, so you check the actual number before you reach out.",
    },
    reviews: {
      question: "Can I leave a review?",
      answer:
        "Yes. Once a payment is released, each side can leave a rating and a short comment. Reviews show on public profiles and help others pick who to work with.",
    },
    contact: {
      question: "How do I get in touch?",
      answer: "Find our contact details on the Imprint page.",
    },
  },
} as const;
