import Link from "next/link";
import { FiArrowRight, FiPlus } from "react-icons/fi";
import { Reveal } from "@/components/landing/reveal";
import { faqsFor, type FaqItem } from "@/lib/faq";
import { getT } from "@/lib/i18n/server";
import { canSellProSubscription } from "@/lib/native-app-server";

// The questions people have before signing up, answered on the page itself. The answers are in the HTML
// (details, not fetched on click), so search engines read them too; the full list with its FAQPage markup
// stays on /faq.
const LANDING_FAQ: readonly FaqItem[] = ["payments", "noPost", "matching", "realMoney"];

export async function LandingFaq() {
  const t = await getT();
  const faqs = faqsFor(t, !(await canSellProSubscription()), LANDING_FAQ);
  return (
    <section id="faq" className="scroll-mt-24 bg-paper px-4 pb-20 md:pb-28">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="mb-8 text-center font-display text-[36px] leading-[1.05] font-black tracking-[-0.03em] text-balance md:mb-12 md:text-[56px]">
            {t("landing.faq.title")}
          </h2>
        </Reveal>
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {/* The first one open, so the list reads as answers, not just a wall of questions. */}
          {faqs.map((f, i) => (
            <details key={f.question} open={i === 0} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-semibold md:py-6 md:text-xl [&::-webkit-details-marker]:hidden">
                {f.question}
                <FiPlus aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="max-w-[62ch] pb-6 text-neutral-700 dark:text-neutral-300">{f.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/faq" className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4 hover:text-graphite">
            {t("landing.faq.more")}
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </p>
      </div>
    </section>
  );
}
