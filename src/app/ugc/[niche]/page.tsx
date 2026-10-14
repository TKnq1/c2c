import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UgcBreadcrumbs, UgcCtas, UgcFaq, UgcFooter, UgcHeader, UgcSection, UgcSteps, UgcWatermark } from "@/components/ugc/ugc-parts";
import { canonical } from "@/lib/seo";
import { UGC_NICHE_PAGES, UGC_PATH, ugcNicheHref } from "@/lib/seo-pages";
import { getUgcContent, ugcFill, ugcNiche } from "@/lib/ugc";

// Only the niches listed in seo-pages.ts exist; anything else is a plain 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return UGC_NICHE_PAGES.map((page) => ({ niche: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ niche: string }> }): Promise<Metadata> {
  const content = await getUgcContent();
  const page = ugcNiche(content, (await params).niche);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: canonical(ugcNicheHref(page.slug)),
    openGraph: { title: page.title, description: page.description, locale: content.ogLocale },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

// A search landing page for one niche: what gets made, how it works for each side, the questions people
// actually ask. In the reader's language; search engines without a language cookie get German.
export default async function UgcNichePage({ params }: { params: Promise<{ niche: string }> }) {
  const content = await getUgcContent();
  const { ui } = content;
  const page = ugcNiche(content, (await params).niche);
  if (!page) notFound();

  return (
    <div lang={content.htmlLang} className="relative flex flex-1 flex-col">
      <UgcWatermark />
      <UgcBreadcrumbs
        trail={[
          { name: ui.hubTitle, path: UGC_PATH },
          { name: page.label, path: ugcNicheHref(page.slug) },
        ]}
      />
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

          <UgcSection title={ugcFill(ui.formatsTitle, { label: page.label })}>
            <div className="grid gap-3 sm:grid-cols-2">
              {page.formats.map((format) => (
                <div key={format.title} className="rounded bg-fog p-5">
                  <h3 className="font-semibold">{format.title}</h3>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{format.text}</p>
                </div>
              ))}
            </div>
          </UgcSection>

          <UgcSection title={ui.howTitle}>
            <div className="grid gap-3 md:grid-cols-2">
              <UgcSteps title={ui.forBrands} steps={ui.nicheBrandSteps.map((step) => ugcFill(step, { label: page.label }))} />
              <UgcSteps title={ui.forCreators} steps={ui.nicheCreatorSteps.map((step) => ugcFill(step, { label: page.label }))} />
            </div>
          </UgcSection>

          <UgcFaq faqs={page.faqs} title={ui.faqTitle} />

          <div className="flex flex-col gap-4 rounded bg-fog p-6">
            <h2 className="font-display text-title-2 font-bold text-balance">{ugcFill(ui.nicheReadyTitle, { label: page.label })}</h2>
            <UgcCtas />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {ui.overviewLead}{" "}
              <Link href={UGC_PATH} className="underline">
                {ui.overviewLink}
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
      <UgcFooter currentSlug={page.slug} />
    </div>
  );
}
