import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, RELEASE_REVIEW_DAYS, PRO_PRICE_CENTS } from "@/lib/constants";
import { proBreakEvenCents } from "@/lib/pro-price";
import { formatCents } from "@/lib/format";
import type { MessageKey, TFunction } from "@/lib/i18n/translate";

export type FaqItem = "matching" | "reachOut" | "payments" | "pro" | "noPost" | "realMoney" | "followers" | "reviews" | "contact";

// In order of appearance. The Pro question and the Pro sentence in the payments answer are left out inside
// the store apps, which can't sell Pro (see canSellProSubscription).
export const FAQ_ITEMS: readonly FaqItem[] = ["matching", "reachOut", "payments", "pro", "noPost", "realMoney", "followers", "reviews", "contact"];

// items picks a subset (the landing page shows a few, /faq all of them).
export function faqsFor(t: TFunction, inStoreApp: boolean, items: readonly FaqItem[] = FAQ_ITEMS): { question: string; answer: string }[] {
  const vars = {
    days: RELEASE_REVIEW_DAYS,
    fee: PLATFORM_FEE_RATE * 100,
    proFee: PRO_PLATFORM_FEE_RATE * 100,
    // Brands and creators pay different prices for Pro: both are named.
    price: t("faq.perSide", { brand: formatCents(PRO_PRICE_CENTS.brand), creator: formatCents(PRO_PRICE_CENTS.creator) }),
    breakEven: t("faq.perSide", {
      brand: formatCents(proBreakEvenCents(PRO_PRICE_CENTS.brand)),
      creator: formatCents(proBreakEvenCents(PRO_PRICE_CENTS.creator)),
    }),
    foundingBrands: FOUNDING_BRAND_LIMIT,
    foundingCreators: FOUNDING_CREATOR_LIMIT,
  };
  const proOffer = inStoreApp ? "" : t("faq.proOffer", vars);
  return items.filter((item) => !(inStoreApp && item === "pro")).map((item) => ({
    question: t(`faq.items.${item}.question` as MessageKey, vars),
    answer: t(`faq.items.${item}.answer` as MessageKey, { ...vars, proOffer }),
  }));
}
