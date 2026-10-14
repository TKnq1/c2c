import type { Metadata } from "next";
import Link from "next/link";
import { UgcBreadcrumbs, UgcCtas, UgcFaq, UgcFooter, UgcHeader, UgcSection, UgcSteps, UgcWatermark } from "@/components/ugc/ugc-parts";
import { canonical } from "@/lib/seo";
import { UGC_CREATOR_PATH, UGC_PATH, ugcNicheHref } from "@/lib/seo-pages";
import { getUgcContent, ugcFill } from "@/lib/ugc";

export async function generateMetadata(): Promise<Metadata> {
  const { ui, ogLocale } = await getUgcContent();
  return {
    title: ui.hubTitle,
    description: ui.hubDescription,
    alternates: canonical(UGC_PATH),
    openGraph: { title: ui.hubTitle, description: ui.hubDescription, locale: ogLocale },
    twitter: { card: "summary_large_image", title: ui.hubTitle, description: ui.hubDescription },
  };
}

// The overview: what UGC is, how comtor works, and the way into each niche page, in the reader's language.
export default async function UgcPage() {
  const { ui, niches, hubFaqs, htmlLang } = await getUgcContent();
  return (
    <div lang={htmlLang} className="relative flex flex-1 flex-col">
      <UgcWatermark />
      <UgcBreadcrumbs trail={[{ name: ui.hubTitle, path: UGC_PATH }]} />
      <UgcHeader />
      <main className="relative z-10 flex-1 px-4 py-12 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-[40px] leading-[1.02] font-black tracking-[-0.03em] text-balance md:text-[56px]">
              {ui.hubTitle}
            </h1>
            <p className="max-w-[60ch] text-lg text-neutral-700 dark:text-neutral-300">{ui.hubIntro}</p>
            <UgcCtas className="mt-2" />
            <p className="text-footnote text-neutral-500 dark:text-neutral-400">{ui.signupNote}</p>
          </div>

          <Link href={UGC_CREATOR_PATH} className="rounded bg-fog p-5 transition hover:bg-ink/10">
            <h2 className="font-display text-title-2 font-bold">{ui.creatorCardTitle}</h2>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{ui.creatorCardBody}</p>
          </Link>

          <UgcSection title={ui.byNicheTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              {niches.map((page) => (
                <Link
                  key={page.slug}
                  href={ugcNicheHref(page.slug)}
                  className="rounded bg-fog p-5 transition hover:bg-ink/10"
                >
                  <h3 className="font-semibold">{page.label}</h3>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{page.heading}</p>
                </Link>
              ))}
            </div>
          </UgcSection>

          <UgcSection title={ui.howTitle}>
            <div className="grid gap-3 md:grid-cols-2">
              <UgcSteps title={ui.forBrands} steps={ui.hubBrandSteps.map((step) => ugcFill(step))} />
              <UgcSteps title={ui.forCreators} steps={ui.hubCreatorSteps.map((step) => ugcFill(step))} />
            </div>
          </UgcSection>

          <UgcFaq faqs={hubFaqs} title={ui.faqTitle} />
        </div>
      </main>
      <UgcFooter onHub />
    </div>
  );
}
