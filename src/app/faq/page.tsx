import type { Metadata } from "next";
import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import { canSellProSubscription } from "@/lib/native-app-server";
import { getLocale, getT } from "@/lib/i18n/server";
import type { MessageKey, TFunction } from "@/lib/i18n/translate";
import { canonical } from "@/lib/seo";
import { UgcBreadcrumbs, UgcCtas, UgcFooter, UgcHeader, UgcWatermark } from "@/components/ugc/ugc-parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("faq.meta.title"),
    description: t("faq.meta.description"),
    alternates: canonical("/faq"),
  };
}

// In order of appearance. The Pro question and the Pro sentence in the payments answer are left out inside
// the store apps, which can't sell Pro (see canSellProSubscription).
const FAQ_ITEMS = ["matching", "reachOut", "payments", "pro", "noPost", "realMoney", "followers", "reviews", "contact"] as const;

function faqsFor(t: TFunction, inStoreApp: boolean): { question: string; answer: string }[] {
  const vars = {
    days: RELEASE_REVIEW_DAYS,
    fee: PLATFORM_FEE_RATE * 100,
    proFee: PRO_PLATFORM_FEE_RATE * 100,
    price: formatCents(PRO_SUBSCRIPTION_PRICE_CENTS),
    breakEven: formatCents(Math.round(PRO_SUBSCRIPTION_PRICE_CENTS / (PLATFORM_FEE_RATE - PRO_PLATFORM_FEE_RATE))),
    foundingBrands: FOUNDING_BRAND_LIMIT,
    foundingCreators: FOUNDING_CREATOR_LIMIT,
  };
  const proOffer = inStoreApp ? "" : t("faq.proOffer", vars);
  return FAQ_ITEMS.filter((item) => !(inStoreApp && item === "pro")).map((item) => ({
    question: t(`faq.items.${item}.question` as MessageKey, vars),
    answer: t(`faq.items.${item}.answer` as MessageKey, { ...vars, proOffer }),
  }));
}

// Lets Google render these as an expandable rich result directly in search,
// rather than just a plain blue link: the exact question/answer pairs
// below, structured as https://schema.org/FAQPage expects.
function FaqJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

// The same shell as the other public subpages (header, huge faint mark, grey boxes, footer), in the reader's
// language.
export default async function FaqPage() {
  const locale = await getLocale();
  const t = await getT();
  const faqs = faqsFor(t, !(await canSellProSubscription()));

  return (
    <div lang={locale} className="relative flex flex-1 flex-col">
      <UgcBreadcrumbs trail={[{ name: "FAQ", path: "/faq" }]} />
      <UgcWatermark />
      <UgcHeader />
      <main className="relative z-10 flex-1 px-4 py-12 md:py-16">
        <FaqJsonLd faqs={faqs} />
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-[40px] leading-[1.02] font-black tracking-[-0.03em] text-balance md:text-[56px]">
              {t("landing.faq.title")}
            </h1>
            <p className="max-w-[60ch] text-lg text-neutral-700 dark:text-neutral-300">{t("landing.faq.lead")}</p>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((f) => (
              <section key={f.question} className="rounded bg-fog p-5">
                <h2 className="font-semibold">{f.question}</h2>
                <p className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-300">{f.answer}</p>
              </section>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded bg-fog p-6">
            <h2 className="font-display text-title-2 font-bold text-balance">{t("landing.faq.ctaTitle")}</h2>
            <UgcCtas />
          </div>
        </div>
      </main>
      <UgcFooter />
    </div>
  );
}
