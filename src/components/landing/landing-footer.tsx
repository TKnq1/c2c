import Image from "next/image";
import Link from "next/link";
import { SwitchSideLink } from "@/components/landing/switch-side-link";

const LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/login", label: "Log in" },
  { href: "/legal/imprint", label: "Imprint" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/licenses", label: "Licenses" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper px-4 pt-10 pb-[calc(var(--safe-bottom)+28px)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={40} height={40} className="dark:invert" />
          <span className="font-display text-[28px] font-black tracking-tight">comtor</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-2 text-footnote text-neutral-500 md:flex-row md:justify-between dark:text-neutral-400">
        <SwitchSideLink />
        <p>© 2026 comtor · Photos from Unsplash · 3D icons: Microsoft Fluent Emoji (MIT)</p>
      </div>
    </footer>
  );
}
