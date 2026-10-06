import Image from "next/image";
import Link from "next/link";
import { LanguageSwitch } from "@/components/landing/language-switch";
import { SwitchSideLink } from "@/components/landing/switch-side-link";
import { getT } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";

const LINKS: { href: string; label: MessageKey }[] = [
  { href: "/faq", label: "landing.footer.faq" },
  { href: "/ugc", label: "landing.footer.ugc" },
  { href: "/login", label: "landing.footer.logIn" },
  { href: "/legal/imprint", label: "screens.settings.imprint" },
  { href: "/legal/privacy", label: "screens.settings.privacy" },
  { href: "/legal/terms", label: "screens.settings.terms" },
  { href: "/legal/licenses", label: "screens.settings.licenses" },
];

export async function LandingFooter() {
  const t = await getT();
  return (
    <footer className="border-t border-ink/10 bg-paper px-4 pt-10 pb-[calc(var(--safe-bottom)+28px)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={40} height={40} className="dark:invert" />
          <span className="font-display text-[28px] font-black tracking-tight">comtor</span>
        </div>
        <nav aria-label={t("landing.footer.label")} className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-ink">
              {t(l.label)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-2 text-footnote text-neutral-500 md:flex-row md:justify-between dark:text-neutral-400">
        <SwitchSideLink />
        <div className="flex flex-col gap-2 md:items-end">
          <LanguageSwitch />
          <p>© 2026 comtor · {t("landing.footer.credits")}</p>
        </div>
      </div>
    </footer>
  );
}
