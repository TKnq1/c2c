"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Site-wide so the legal pages are reachable from every page, not just
// signup and the (itself unlinked) FAQ page — Impressumspflicht requires
// the imprint to be easily/directly reachable, not buried behind a page
// nothing links to. Hidden on an open chat thread specifically — that
// view is already cramped on mobile, and it's one narrow page among many
// where the footer is still reachable everywhere else.
export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard/messages/")) return null;

  return (
    <footer className="border-t border-ink/10 no-print">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <p>© {new Date().getFullYear()} C2C</p>
        <nav aria-label="Legal" className="flex items-center gap-4">
          <Link href="/legal/imprint" className="hover:text-ink transition dark:hover:text-white">
            Imprint
          </Link>
          <Link href="/legal/privacy" className="hover:text-ink transition dark:hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/legal/terms" className="hover:text-ink transition dark:hover:text-white">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
