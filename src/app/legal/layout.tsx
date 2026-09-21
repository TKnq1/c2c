import Link from "next/link";
import { Logo } from "@/components/logo";

// These 3 pages used to get their only navigation — both back out to the
// app and to each other — from the site-wide footer. That's gone now
// (logged-in users find these links in Settings instead), so without this
// shared layout a legal page was a dead end: no way back, no way to the
// other two.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-ink/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-6 py-5">
          <Link href="/">
            <Logo />
          </Link>
          <nav aria-label="Legal" className="flex items-center gap-4 text-sm text-graphite">
            <Link href="/legal/imprint" className="hover:text-ink transition">
              Imprint
            </Link>
            <Link href="/legal/privacy" className="hover:text-ink transition">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="hover:text-ink transition">
              Terms
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
