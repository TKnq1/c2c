import type { Metadata } from "next";
import Link from "next/link";
import { UgcBreadcrumbs, UgcCtas, UgcFaq, UgcFooter, UgcHeader, UgcSection, UgcWatermark } from "@/components/ugc/ugc-parts";
import { canonical } from "@/lib/seo";
import { UGC_CREATOR_PATH, UGC_PATH } from "@/lib/seo-pages";
import { getUgcContent } from "@/lib/ugc";

export async function generateMetadata(): Promise<Metadata> {
  const { creator: page, ogLocale } = await getUgcContent();
  return {
    title: page.title,
    description: page.description,
    alternates: canonical(UGC_CREATOR_PATH),
    openGraph: { title: page.title, description: page.description, locale: ogLocale },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

// The search page for creators: what UGC creators do, how to start on comtor, how the money works.
export default async function UgcCreatorPage() {
  const { creator: page, ui, htmlLang } = await getUgcContent();
  return (
    <div lang={htmlLang} className="relative flex flex-1 flex-col">
      <UgcBreadcrumbs
        trail={[
          { name: ui.hubTitle, path: UGC_PATH },
          { name: ui.creatorCrumb, path: UGC_CREATOR_PATH },
        ]}
      />
      <UgcWatermark />
      <UgcHeader />
      <main className="relative z-10 flex-1 px-4 py-12 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-[40px] leading-[1.02] font-black tracking-[-0.03em] text-balance md:text-[56px]">
              {page.heading}
            </h1>
            <p className="max-w-[60ch] text-lg text-neutral-700 dark:text-neutral-300">{page.lead}</p>
            <UgcCtas className="mt-2" />
            <p className="text-footnote text-neutral-500 dark:text-neutral-400">{ui.signupNote}</p>
          </div>

          <UgcSection title={ui.creatorDoingTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              {page.doing.map((item) => (
                <div key={item.title} className="rounded bg-fog p-5">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{item.text}</p>
                </div>
              ))}
            </div>
          </UgcSection>

          <UgcSection title={ui.creatorStartTitle}>
            <ol className="flex flex-col gap-3">
              {page.steps.map((step, i) => (
                <li key={step} className="flex gap-4 rounded bg-fog p-5">
                  <span className="font-display text-2xl leading-none font-black tabular-nums">{i + 1}</span>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{step}</p>
                </li>
              ))}
            </ol>
          </UgcSection>

          <UgcSection title={ui.creatorTipsTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              {page.tips.map((tip) => (
                <div key={tip.title} className="rounded bg-fog p-5">
                  <h3 className="font-semibold">{tip.title}</h3>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{tip.text}</p>
                </div>
              ))}
            </div>
          </UgcSection>

          <UgcFaq faqs={page.faqs} title={ui.faqTitle} />

          <div className="flex flex-col gap-4 rounded bg-fog p-6">
            <h2 className="font-display text-title-2 font-bold text-balance">{ui.creatorReadyTitle}</h2>
            <UgcCtas />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {ui.creatorBrandHint}{" "}
              <Link href={UGC_PATH} className="underline">
                {ui.overviewLink}
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
      <UgcFooter />
    </div>
  );
}
