"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { BrandBuilder } from "@/components/landing/brand-builder";
import { CreatorDeck } from "@/components/landing/creator-deck";
import { CreatorDesktop } from "@/components/landing/creator-desktop";
import { PhotoBackdrop } from "@/components/landing/photo-backdrop";
import { SignupLink } from "@/components/landing/signup-link";
import { useI18n } from "@/components/i18n-provider";
import { FIRST_PHOTO, type PhotoKey } from "@/components/landing/landing-data";
import type { LandingRole } from "@/components/landing/landing-role";

const delay = (ms: number) => ({ "--lp-delay": `${ms}ms` }) as React.CSSProperties;

// The number is real text, not a CSS counter. A counter on the hidden side
// stays at 0, and switching creator/brand never brings it up to date.
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    started.current = false;
    let frame = 0;

    const run = () => {
      if (started.current || el.getClientRects().length === 0) return;
      started.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setValue(to);
        return;
      }
      const began = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - began) / 1200);
        const eased = 1 - (1 - progress) ** 3;
        setValue(Math.round(eased * to));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      setValue(0);
      frame = requestAnimationFrame(tick);
    };

    run();
    const observer = new MutationObserver(run);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-landing-role"] });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [to]);

  return (
    <span ref={ref} className="font-semibold tabular-nums">
      {value}
    </span>
  );
}

// The headline over the thing itself: creators get the Feed to swipe,
// brands the card they'd post, live. Either way the photo in play colours
// the whole section.
// One h1 per address: the side the page stands for ("/" creators, /marken brands) gets it, the other side's
// headline is the same text as a plain paragraph.
export function Hero({ brands, creators, primary }: { brands: number; creators: number; primary: LandingRole }) {
  const { t } = useI18n();
  const CreatorHeading = primary === "creator" ? "h1" : "p";
  const BrandHeading = primary === "brand" ? "h1" : "p";
  const [creatorPhoto, setCreatorPhoto] = useState<PhotoKey>(FIRST_PHOTO);
  const [brandPhoto, setBrandPhoto] = useState<PhotoKey>("flask");

  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div data-for="creator" className="lp-fade-out absolute inset-0 -z-10">
        <PhotoBackdrop photo={creatorPhoto} />
      </div>
      <div data-for="brand" className="lp-fade-out absolute inset-0 -z-10">
        <PhotoBackdrop photo={brandPhoto} />
      </div>
      <div aria-hidden="true" className="lp-grain lp-fade-out" />

      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pt-[calc(var(--safe-top)+112px)] pb-20 text-center md:pt-40 md:pb-28">
        <p data-for="creator" className="lp-rise lp-glow mb-4 text-sm font-semibold tracking-wide text-ink uppercase md:mb-5">
          {t("landing.hero.creatorKicker")}
        </p>
        <p data-for="brand" className="lp-rise lp-glow mb-4 text-sm font-semibold tracking-wide text-ink uppercase md:mb-5">
          {t("landing.hero.brandKicker")}
        </p>
        <CreatorHeading
          data-for="creator"
          className="font-display text-[clamp(34px,11.4vw,44px)] leading-[0.98] font-black tracking-[-0.035em] sm:text-[64px] lg:text-[88px]"
        >
          <span className="lp-line">
            <span>{t("landing.hero.creatorTitleA")}</span>
          </span>
          <span className="lp-line">
            <span style={delay(90)}>
              {t("landing.hero.creatorTitleB1")}
              {t("landing.hero.creatorTitleB2") && (
                <>
                  {" "}
                  {/* Three lines on phones, so the German words aren't broken in the middle. */}
                  <br className="sm:hidden" />
                  {t("landing.hero.creatorTitleB2")}
                </>
              )}
            </span>
          </span>
        </CreatorHeading>
        <BrandHeading
          data-for="brand"
          className="font-display text-[clamp(34px,11.4vw,44px)] leading-[0.98] font-black tracking-[-0.035em] sm:text-[64px] lg:text-[88px]"
        >
          <span className="lp-line">
            <span>{t("landing.hero.brandTitleA")}</span>
          </span>
          <span className="lp-line">
            {/* Three lines on phones rather than "you." left on its own. */}
            <span style={delay(90)}>
              {t("landing.hero.brandTitleB1")} <br className="sm:hidden" />
              {t("landing.hero.brandTitleB2")}
            </span>
          </span>
        </BrandHeading>

        <p
          data-for="creator"
          className="lp-rise lp-glow mt-6 max-w-[36ch] text-[19px] leading-snug font-medium text-ink md:text-[22px]"
          style={delay(250)}
        >
          {t("landing.hero.creatorBody")}
        </p>
        <p
          data-for="brand"
          className="lp-rise lp-glow mt-6 max-w-[38ch] text-[19px] leading-snug font-medium text-ink md:text-[22px]"
          style={delay(250)}
        >
          {t("landing.hero.brandBody")}
        </p>

        <CrowdLine side="creator" count={brands} one={t("landing.hero.crowdBrandOne")} many={t("landing.hero.crowdBrandMany")} />
        <CrowdLine side="brand" count={creators} one={t("landing.hero.crowdCreatorOne")} many={t("landing.hero.crowdCreatorMany")} />

        {/* The one thing to do here, on every screen size: sign up (the web app is live, the store apps aren't). */}
        <div className="lp-rise mt-7 flex flex-col items-center gap-3" style={delay(330)}>
          <SignupLink className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-paper transition hover:bg-graphite">
            {t("landing.nav.start")}
            <FiArrowRight className="h-4 w-4" />
          </SignupLink>
          <p className="lp-glow text-footnote font-medium text-ink">
            {t("landing.waitlist.haveAccount")}{" "}
            <Link href="/login" className="font-semibold underline underline-offset-2">
              {t("landing.waitlist.logIn")}
            </Link>
          </p>
        </div>

        <div className="mt-10 flex w-full justify-center sm:mt-12 md:mt-16">
          {/* From lg: the web app in a Mac window, with the phone in front of its right edge. */}
          <div data-for="creator" className="flex items-end justify-center">
            <div className="lp-phone-in hidden lg:block" style={delay(250)}>
              <CreatorDesktop />
            </div>
            <div className="lp-phone-in relative z-10 lg:-ml-14" style={delay(350)}>
              <CreatorDeck onTop={setCreatorPhoto} />
            </div>
          </div>
          <div data-for="brand" className="lp-phone-in w-full" style={delay(350)}>
            <BrandBuilder onPhoto={setBrandPhoto} />
          </div>
        </div>
        <p className="lp-rise lp-glow mt-5 text-footnote font-medium text-ink" style={delay(900)}>
          {t("landing.hero.examples")}
        </p>
        <p data-for="creator" className="lp-rise lp-glow mt-2 text-sm font-medium text-ink" style={delay(900)}>
          {t("landing.hero.drag")}
        </p>
      </div>
    </section>
  );
}

// Below this the count says "hardly anyone here yet" more than it says "join them", so the line stays out.
const CROWD_MIN = 100;

function CrowdLine({ side, count, one, many }: { side: "creator" | "brand"; count: number; one: string; many: string }) {
  if (count < CROWD_MIN) return null;
  const word = count === 1 ? one : many;
  return (
    <p
      data-for={side}
      className="lp-rise lp-glow mt-4 text-[19px] leading-snug font-medium text-ink md:text-[22px]"
      style={delay(300)}
    >
      <CountUp to={count} />{" "}
      {word}
    </p>
  );
}
