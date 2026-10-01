"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { hasNavigatedInApp } from "@/lib/in-app-navigation";

const TITLES: Record<string, string> = {
  "/legal/imprint": "Imprint",
  "/legal/privacy": "Privacy Policy",
  "/legal/terms": "Terms",
};

// The legal pages' header, shaped like the app's own (see Nav): back on the
// left, the title centered. Back goes wherever the page was opened from —
// Settings, usually — and home when it was opened directly.
export function LegalHeader() {
  const pathname = usePathname();
  const router = useRouter();

  function back() {
    if (hasNavigatedInApp()) router.back();
    else router.push("/");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-ink/10 bg-background pt-[var(--safe-top)]">
      <div className="relative mx-auto flex h-14 max-w-2xl items-center px-3">
        <button
          type="button"
          onClick={back}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-fog"
        >
          <IoChevronBack className="h-6 w-6" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-headline font-bold">
          {TITLES[pathname] ?? "Legal"}
        </span>
      </div>
    </header>
  );
}

// Under each legal page: the other two, so none of them is a dead end.
export function LegalOtherDocs() {
  const pathname = usePathname();
  const docs = Object.entries(TITLES).filter(([href]) => href !== pathname);
  return (
    <nav aria-label="Other legal pages" className="flex flex-col divide-y divide-ink/10 rounded bg-fog px-4">
      {docs.map(([href, label]) => (
        <Link key={href} href={href} className="flex items-center justify-between gap-3 py-3 text-sm font-medium">
          {label}
          <IoChevronForward className="h-4 w-4 text-neutral-400" />
        </Link>
      ))}
    </nav>
  );
}
