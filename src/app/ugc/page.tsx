import type { Metadata } from "next";
import Link from "next/link";
import { UgcBreadcrumbs, UgcCtas, UgcFaq, UgcFooter, UgcHeader, UgcSection, UgcSteps } from "@/components/ugc/ugc-parts";
import { canonical } from "@/lib/seo";
import { UGC_HUB_FAQS, UGC_NICHE_PAGES, UGC_PATH, ugcNicheHref } from "@/lib/seo-pages";

const TITLE = "UGC-Creator finden und beauftragen";
const DESCRIPTION =
  "Marken finden UGC-Creator für Videos und Fotos, Creator finden bezahlte Aufträge. Anfrage einstellen, im Chat abstimmen, über die Plattform bezahlen. Kostenlos starten.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonical(UGC_PATH),
  openGraph: { title: TITLE, description: DESCRIPTION, locale: "de_DE" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// The German overview: what UGC is, how comtor works, and the way into each niche page.
export default function UgcPage() {
  return (
    <div lang="de" className="flex flex-1 flex-col">
      <UgcBreadcrumbs trail={[{ name: TITLE, path: UGC_PATH }]} />
      <UgcHeader />
      <main className="flex-1 px-4 py-12 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">UGC · Marken und Creator</p>
            <h1 className="font-display text-[40px] leading-[1.02] font-black tracking-[-0.03em] text-balance md:text-[56px]">
              {TITLE}
            </h1>
            <p className="max-w-[60ch] text-lg text-neutral-700 dark:text-neutral-300">
              Marken brauchen Videos und Fotos von echten Menschen, Creator wollen dafür bezahlt werden. comtor
              bringt beide zusammen: Die Marke stellt eine Anfrage ein, passende Creator melden sich, bezahlt wird
              über die Plattform.
            </p>
            <UgcCtas className="mt-2" />
            <p className="text-footnote text-neutral-500 dark:text-neutral-400">
              Kostenlos anmelden. comtor läuft im Browser, die Sprache wählst du beim Start.
            </p>
          </div>

          <UgcSection title="UGC nach Nische">
            <div className="grid gap-3 sm:grid-cols-2">
              {UGC_NICHE_PAGES.map((page) => (
                <Link
                  key={page.slug}
                  href={ugcNicheHref(page.slug)}
                  className="rounded bg-fog p-5 transition hover:bg-ink/10"
                >
                  <h3 className="font-semibold">{page.niche}</h3>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{page.heading}</p>
                </Link>
              ))}
            </div>
          </UgcSection>

          <UgcSection title="So funktioniert comtor">
            <div className="grid gap-3 md:grid-cols-2">
              <UgcSteps
                title="Für Marken"
                steps={[
                  "Anfrage einstellen: Nische, Sprache, Mindestzahl an Followern, Produktkategorie, Budget und Lieferumfang.",
                  "Creator melden sich: Wer passt, sieht die Anfrage im Feed und schreibt dir im Chat.",
                  "Bezahlen und freigeben: Du zahlst über die Plattform und gibst den Beitrag frei, wenn er passt.",
                ]}
              />
              <UgcSteps
                title="Für Creator"
                steps={[
                  "Profil anlegen: Bis zu drei Nischen und deine Plattformen mit Followerzahl.",
                  "Anfragen ansehen: Im Feed siehst du Budget und Anforderungen, bevor du dich meldest.",
                  "Posten und bezahlt werden: Nach dem Post reichst du den Link ein, danach wird die Zahlung freigegeben.",
                ]}
              />
            </div>
          </UgcSection>

          <UgcFaq faqs={UGC_HUB_FAQS} />
        </div>
      </main>
      <UgcFooter />
    </div>
  );
}
