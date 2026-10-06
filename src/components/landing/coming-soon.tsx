import { FiArrowRight } from "react-icons/fi";
import { PhotoBackdrop } from "@/components/landing/photo-backdrop";
import { SignupLink } from "@/components/landing/signup-link";
import { Reveal } from "@/components/landing/reveal";
import { WaitlistForm } from "@/components/landing/waitlist-form";

// The end of the page: the apps aren't in the stores yet, the web app is
// ready now. No store badges until there is a store page to link them to: Apple and Google allow their
// badges only for apps that are available. Add the current official badges, linked, at launch.
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
          The apps are on their way. The web app is ready now, right in your browser.
        </p>
        <SignupLink className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-paper transition hover:bg-graphite">
          Start in your browser
          <FiArrowRight className="h-4 w-4" />
        </SignupLink>
        <p className="mx-auto mt-9 text-sm text-neutral-700 dark:text-neutral-300">
          Soon on the App Store and Google Play. Leave your email below and we&apos;ll tell you the day they&apos;re out.
        </p>
        <WaitlistForm />
      </Reveal>
    </section>
  );
}
