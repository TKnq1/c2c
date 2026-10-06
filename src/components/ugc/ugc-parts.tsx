import Image from "next/image";
import Link from "next/link";
import { UGC_NICHE_PAGES, UGC_PATH, ugcNicheHref } from "@/lib/seo-pages";
import { SITE_URL } from "@/lib/site";

// Pieces shared by the German search pages (/ugc and /ugc/<niche>). Plain server components: no script,
// no tracking, so there is nothing to ask consent for.

const PRIMARY = "rounded bg-ink px-6 py-3.5 text-center font-semibold text-paper transition hover:bg-graphite";
const SECONDARY =
  "rounded border border-neutral-300 px-6 py-3.5 text-center font-semibold transition hover:border-ink dark:border-neutral-700";

// The mark, huge, behind the whole page: the same shape as on the login and error screens (see
// LogoWatermark), about a third bigger. Fixed, so it stays put while the page scrolls; the grey boxes are
// solid and sit on top of it. Light mode a faint black, dark mode the same black at full strength, as there.
export function UgcWatermark() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <Image
        src="/logo.png"
        alt=""
        width={2000}
        height={2000}
        priority
        className="absolute top-1/2 left-1/2 h-[min(220vmin,104rem)] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.11] select-none dark:opacity-100"
      />
    </div>
  );
}

export function UgcHeader() {
  return (
    <header className="relative z-10 border-b border-ink/10 px-4 pt-[calc(var(--safe-top)+12px)] pb-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="comtor, zur Startseite">
          <Image src="/logo.png" alt="" width={32} height={32} className="dark:invert" />
          <span className="font-display text-[24px] font-black tracking-tight">comtor</span>
        </Link>
        <Link href="/login" className="text-sm text-neutral-600 transition hover:text-ink dark:text-neutral-400">
          Anmelden
        </Link>
      </div>
    </header>
  );
}

// The two ways in. The link carries the side, so the first screen of the wizard is already the right one.
export function UgcCtas({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <Link href="/onboarding?role=brand" className={PRIMARY}>
        Als Marke starten
      </Link>
      <Link href="/onboarding?role=creator" className={SECONDARY}>
        Als Creator starten
      </Link>
    </div>
  );
}

export function UgcSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-title-2 font-bold text-balance">{title}</h2>
      {children}
    </section>
  );
}

export function UgcSteps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded bg-fog p-5">
      <h3 className="font-semibold">{title}</h3>
      <ol className="mt-3 flex list-decimal flex-col gap-2.5 pl-5 text-sm text-neutral-700 marker:font-semibold dark:text-neutral-300">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

export function UgcFaq({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return (
    <UgcSection title="Häufige Fragen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex flex-col gap-6">
        {faqs.map((f) => (
          <div key={f.question}>
            <h3 className="font-semibold">{f.question}</h3>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{f.answer}</p>
          </div>
        ))}
      </div>
    </UgcSection>
  );
}

// Tells search engines where the page sits: Startseite > UGC > (Nische).
export function UgcBreadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "comtor", path: "/" }, ...trail].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export function UgcFooter({ currentSlug }: { currentSlug?: string }) {
  const others = UGC_NICHE_PAGES.filter((page) => page.slug !== currentSlug);
  return (
    <footer className="relative z-10 border-t border-ink/10 px-4 pt-8 pb-[calc(var(--safe-bottom)+28px)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 text-sm text-neutral-600 dark:text-neutral-400">
        <nav aria-label="UGC nach Nische" className="flex flex-wrap gap-x-5 gap-y-2">
          {currentSlug && (
            <Link href={UGC_PATH} className="transition hover:text-ink">
              UGC-Creator finden
            </Link>
          )}
          {others.map((page) => (
            <Link key={page.slug} href={ugcNicheHref(page.slug)} className="transition hover:text-ink">
              {page.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Rechtliches" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/legal/imprint" className="transition hover:text-ink">
            Impressum
          </Link>
          <Link href="/legal/privacy" className="transition hover:text-ink">
            Datenschutz
          </Link>
          <Link href="/legal/terms" className="transition hover:text-ink">
            AGB
          </Link>
          <Link href="/legal/licenses" className="transition hover:text-ink">
            Lizenzen
          </Link>
        </nav>
        <p className="text-footnote text-neutral-500 dark:text-neutral-400">© 2026 comtor</p>
      </div>
    </footer>
  );
}
