import Image from "next/image";
import Link from "next/link";
import { RoleToggle } from "@/components/landing/role-toggle";
import { getT } from "@/lib/i18n/server";

// A frosted pill floating over the page: logo, the Creators | Brands switch,
// log in for people using the web app already, and from sm up the way to
// the store badges (on phones that's a button in the hero, for room).
export async function LandingNav() {
  const t = await getT();
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-[calc(var(--safe-top)+12px)]">
      <nav
        aria-label={t("landing.nav.main")}
        className="lp-rise pointer-events-auto flex w-full max-w-[680px] items-center gap-2 rounded-full border border-ink/10 bg-paper/75 py-1.5 pr-1.5 pl-3 shadow-[0_10px_30px_-14px_rgb(0_0_0/0.3)] backdrop-blur-xl backdrop-saturate-150"
      >
        <a href="#top" className="flex shrink-0 items-center gap-2 pr-1">
          <Image src="/logo.png" alt="" width={30} height={30} preload className="dark:invert" />
          <span className="hidden font-display text-xl font-black tracking-tight sm:inline">comtor</span>
        </a>
        <RoleToggle className="mx-auto" />
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-[13px] font-semibold whitespace-nowrap text-ink transition hover:text-graphite sm:text-sm sm:font-medium sm:text-graphite sm:hover:text-ink"
          >
            {t("landing.nav.logIn")}
          </Link>
          <a
            href="#get-the-app"
            className="hidden rounded-full bg-ink px-4 py-2 text-sm font-semibold whitespace-nowrap text-paper transition hover:bg-graphite sm:inline-flex"
          >
            {t("landing.nav.getApp")}
          </a>
        </div>
      </nav>
    </header>
  );
}
