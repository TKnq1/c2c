import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UgcBreadcrumbs, UgcCtas, UgcFaq, UgcFooter, UgcHeader, UgcSection, UgcSteps } from "@/components/ugc/ugc-parts";
import { canonical } from "@/lib/seo";
import { getUgcNichePage, UGC_NICHE_PAGES, UGC_PATH, ugcNicheHref } from "@/lib/seo-pages";

// Only the niches listed in seo-pages.ts exist; anything else is a plain 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return UGC_NICHE_PAGES.map((page) => ({ niche: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ niche: string }> }): Promise<Metadata> {
  const page = getUgcNichePage((await params).niche);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: canonical(ugcNicheHref(page.slug)),
    openGraph: { title: page.title, description: page.description, locale: "de_DE" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

// A search landing page in German for one niche: what gets made, how it works for each side, the questions
// people actually ask. The page's language is German whatever the app's own language is, hence lang="de".
export default async function UgcNichePage({ params }: { params: Promise<{ niche: string }> }) {
  const page = getUgcNichePage((await params).niche);
  if (!page) notFound();

  return (
    <div lang="de" className="flex flex-1 flex-col">
      <UgcBreadcrumbs
        trail={[
          { name: "UGC-Creator finden", path: UGC_PATH },
          { name: page.label, path: ugcNicheHref(page.slug) },
        ]}
      />
      <UgcHeader />
      <main className="flex-1 px-4 py-12 md:py-16">
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

          <UgcSection title={`Diese Inhalte entstehen in der Nische ${page.label}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {page.formats.map((format) => (
                <div key={format.title} className="rounded bg-fog p-5">
                  <h3 className="font-semibold">{format.title}</h3>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{format.text}</p>
                </div>
              ))}
            </div>
          </UgcSection>

          <UgcSection title="So funktioniert comtor">
            <div className="grid gap-3 md:grid-cols-2">
              <UgcSteps
                title="Für Marken"
                steps={[
                  `Anfrage einstellen: Nische ${page.label}, Sprache, Mindestzahl an Followern, Budget und Lieferumfang.`,
                  "Creator melden sich: Wer passt, sieht die Anfrage im Feed und schreibt dir im Chat.",
                  "Bezahlen und freigeben: Du zahlst über die Plattform und gibst den Beitrag frei, wenn er passt.",
                ]}
              />
              <UgcSteps
                title="Für Creator"
                steps={[
                  `Profil anlegen: Bis zu drei Nischen, zum Beispiel ${page.label}, und deine Plattformen mit Followerzahl.`,
                  "Anfragen ansehen: Im Feed siehst du Budget und Anforderungen, bevor du dich meldest.",
                  "Posten und bezahlt werden: Nach dem Post reichst du den Link ein, danach wird die Zahlung freigegeben.",
                ]}
              />
            </div>
          </UgcSection>

          <UgcFaq faqs={page.faqs} />

          <div className="flex flex-col gap-4 rounded bg-fog p-6">
            <h2 className="font-display text-title-2 font-bold text-balance">
              Bereit für deinen ersten Auftrag in der Nische {page.label}?
            </h2>
            <UgcCtas />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Mehr dazu, was UGC ist und wie comtor funktioniert, findest du auf{" "}
              <Link href={UGC_PATH} className="underline">
                UGC-Creator finden
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
