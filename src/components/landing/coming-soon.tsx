import { PhotoBackdrop } from "@/components/landing/photo-backdrop";
import { Reveal } from "@/components/landing/reveal";
import { WaitlistForm } from "@/components/landing/waitlist-form";

// The end of the page: the apps aren't in the stores yet. The badges are
// Apple's and Google's own artwork, unaltered, as their guidelines ask, and
// not links until there's a store page to link to.
export function ComingSoon() {
  return (
    <section id="get-the-app" className="relative isolate scroll-mt-16 overflow-hidden px-4 py-24 md:py-32">
      {/* The same washed-out photo colour the page opened with. */}
      <div data-for="creator" className="lp-fade-in absolute inset-0 -z-10">
        <PhotoBackdrop photo="serum" />
      </div>
      <div data-for="brand" className="lp-fade-in absolute inset-0 -z-10">
        <PhotoBackdrop photo="flask" />
      </div>
      <div aria-hidden="true" className="lp-grain lp-fade-in" />
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[44px] leading-[0.98] font-black tracking-[-0.035em] text-balance md:text-[72px]">
          Coming soon to iOS &amp; Android
        </h2>
        <p className="mx-auto mt-5 max-w-[34ch] text-[19px] leading-snug text-neutral-700 md:text-[22px] dark:text-neutral-300">
          Leave your email and we&apos;ll tell you the day it&apos;s out.
        </p>
        <div className="mt-9 flex items-center justify-center gap-4" aria-label="Soon on the App Store and Google Play">
          {/* eslint-disable-next-line @next/next/no-img-element -- Apple's own SVG, shown as is */}
          <img src="/badges/download-on-the-app-store.svg" alt="Download on the App Store" width={144} height={48} className="h-12 w-auto" />
          {/* The PNG carries Google's own clear space around the badge; the
              negative margins take it back so both badges line up at 48px. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- Google's own PNG, shown as is */}
          <img
            src="/badges/en_badge_web_generic.png"
            alt="Get it on Google Play"
            width={185}
            height={72}
            className="-mx-[11.7px] -my-[11.7px] h-[71.4px] w-auto"
          />
        </div>
        <WaitlistForm />
      </Reveal>
    </section>
  );
}
