import Image from "next/image";
import Link from "next/link";
import { RoleToggle } from "@/components/landing/role-toggle";

// A frosted pill floating over the page: logo, the Creators | Brands switch
// from md up (phones picked their side on the way in), log in for people
// using the web app already, and the way to the store badges.
export function LandingNav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-[calc(var(--safe-top)+12px)]">
      <nav
        aria-label="Main"
        className="lp-rise pointer-events-auto flex w-full max-w-[680px] items-center gap-2 rounded-full border border-ink/10 bg-paper/75 py-1.5 pr-1.5 pl-3 shadow-[0_10px_30px_-14px_rgb(0_0_0/0.3)] backdrop-blur-xl backdrop-saturate-150"
      >
        <a href="#top" className="flex shrink-0 items-center gap-2 pr-1">
          <Image src="/logo.png" alt="" width={30} height={30} preload className="dark:invert" />
          <span className="font-display text-xl font-black tracking-tight">comtor</span>
        </a>
        <RoleToggle className="mx-auto hidden md:grid" />
        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium text-graphite transition hover:text-ink">
            Log in
          </Link>
          <a href="#get-the-app" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-graphite">
            Get the app
          </a>
        </div>
      </nav>
    </header>
  );
}
