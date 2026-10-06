import { FiArrowRight } from "react-icons/fi";
import { PhotoBackdrop } from "@/components/landing/photo-backdrop";
import { SignupLink } from "@/components/landing/signup-link";
import { Reveal } from "@/components/landing/reveal";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { getT } from "@/lib/i18n/server";

// The end of the page: the apps aren't in the stores yet, the web app is
// ready now. No store badges until there is a store page to link them to: Apple and Google allow their
// badges only for apps that are available. Add the current official badges, linked, at launch.
export async function ComingSoon() {
  const t = await getT();
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
      {/* A frosted panel, like the nav: the small grey copy and the form stay readable on whatever photo colour is behind. */}
      <Reveal className="mx-auto max-w-2xl rounded bg-paper/65 px-5 py-10 text-center backdrop-blur-xl md:px-12 md:py-14">
        <h2 className="font-display text-[44px] leading-[0.98] font-black tracking-[-0.035em] text-balance md:text-[72px]">
          {t("landing.comingSoon.title")}
        </h2>
        <p className="mx-auto mt-5 max-w-[34ch] text-[19px] leading-snug text-neutral-800 md:text-[22px] dark:text-neutral-200">
          {t("landing.comingSoon.body")}
        </p>
        <SignupLink className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-paper transition hover:bg-graphite">
          {t("landing.comingSoon.cta")}
          <FiArrowRight className="h-4 w-4" />
        </SignupLink>
        <p className="mx-auto mt-9 text-sm text-neutral-800 dark:text-neutral-200">
          {t("landing.comingSoon.note")}
        </p>
        <WaitlistForm />
      </Reveal>
    </section>
  );
}
