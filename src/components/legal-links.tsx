import Link from "next/link";

// Shared by both settings pages — the footer that used to carry these
// (Imprint/Privacy/Terms) is gone from the app now, so this is the one
// place a logged-in user finds them. Public/logged-out pages keep a
// minimal standalone Imprint link instead (see e.g. home-hero.tsx) —
// Impressumspflicht requires it reachable without an account too.
export function LegalLinks() {
  return (
    <div id="legal" className="border-t border-ink/10 pt-6 scroll-mt-16">
      <h2 className="text-title-3 font-semibold mb-2">Legal</h2>
      <nav aria-label="Legal" className="flex flex-wrap items-center gap-4 text-sm">
        <Link
          href="/legal/imprint"
          className="text-neutral-600 underline hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Imprint
        </Link>
        <Link
          href="/legal/privacy"
          className="text-neutral-600 underline hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Privacy Policy
        </Link>
        <Link
          href="/legal/terms"
          className="text-neutral-600 underline hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Terms
        </Link>
      </nav>
    </div>
  );
}
