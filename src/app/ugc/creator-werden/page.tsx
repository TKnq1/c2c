import type { Metadata } from "next";
import Link from "next/link";
import { UgcBreadcrumbs, UgcCtas, UgcFaq, UgcFooter, UgcHeader, UgcSection, UgcWatermark } from "@/components/ugc/ugc-parts";
import { canonical } from "@/lib/seo";
import { UGC_CREATOR_PAGE as page, UGC_CREATOR_PATH, UGC_PATH } from "@/lib/seo-pages";

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: canonical(UGC_CREATOR_PATH),
  openGraph: { title: page.title, description: page.description, locale: "de_DE" },
  twitter: { card: "summary_large_image", title: page.title, description: page.description },
};

// The German search page for creators: what UGC creators do, how to start on comtor, how the money works.
export default function UgcCreatorPage() {
  return (
    <div lang="de" className="relative flex flex-1 flex-col">
      <UgcBreadcrumbs
        trail={[
          { name: "UGC-Creator finden", path: UGC_PATH },
          { name: "Creator werden", path: UGC_CREATOR_PATH },
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
            <p className="text-footnote text-neutral-500 dark:text-neutral-400">
              Kostenlos anmelden. comtor läuft im Browser, die Sprache wählst du beim Start.
            </p>
          </div>

          <UgcSection title="Was UGC-Creator machen">
            <div className="grid gap-3 sm:grid-cols-2">
              {page.doing.map((item) => (
                <div key={item.title} className="rounded bg-fog p-5">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{item.text}</p>
                </div>
              ))}
            </div>
          </UgcSection>

          <UgcSection title="So startest du auf comtor">
            <ol className="flex flex-col gap-3">
              {page.steps.map((step, i) => (
                <li key={step} className="flex gap-4 rounded bg-fog p-5">
                  <span className="font-display text-2xl leading-none font-black tabular-nums">{i + 1}</span>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{step}</p>
                </li>
              ))}
            </ol>
          </UgcSection>

          <UgcSection title="Tipps für gute UGC-Inhalte">
            <div className="grid gap-3 sm:grid-cols-2">
              {page.tips.map((tip) => (
                <div key={tip.title} className="rounded bg-fog p-5">
                  <h3 className="font-semibold">{tip.title}</h3>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{tip.text}</p>
                </div>
              ))}
            </div>
          </UgcSection>

          <UgcFaq faqs={page.faqs} />

          <div className="flex flex-col gap-4 rounded bg-fog p-6">
            <h2 className="font-display text-title-2 font-bold text-balance">Bereit für deinen ersten bezahlten Auftrag?</h2>
            <UgcCtas />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Du suchst Creator für deine Marke? Was UGC ist und wie comtor funktioniert, erklären wir im Überblick:{" "}
              <Link href={UGC_PATH} className="underline">
                UGC-Creator finden
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
