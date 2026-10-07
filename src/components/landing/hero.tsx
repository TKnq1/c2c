"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandBuilder } from "@/components/landing/brand-builder";
import { CreatorDeck } from "@/components/landing/creator-deck";
import { CreatorDesktop } from "@/components/landing/creator-desktop";
import { PhotoBackdrop } from "@/components/landing/photo-backdrop";
import { SignupLink } from "@/components/landing/signup-link";
import { useI18n } from "@/components/i18n-provider";
import { FIRST_PHOTO, type PhotoKey } from "@/components/landing/landing-data";

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
export function Hero({ brands, creators }: { brands: number; creators: number }) {
  const { t } = useI18n();
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

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-[calc(var(--safe-top)+112px)] pb-20 text-center md:pt-40 md:pb-28">
        <h1
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
        </h1>
        <h1
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
        </h1>

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

        {/* Phones: the nav has Log in where Get the app is on bigger
            screens, so the button sits here, with a word on the web app. */}
        <div className="lp-rise mt-7 flex flex-col items-center gap-2.5 sm:hidden" style={delay(330)}>
          <a
            href="#get-the-app"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-graphite"
          >
            {t("landing.nav.getApp")}
          </a>
          <p className="lp-glow text-footnote font-medium text-ink">
            {t("landing.hero.liveOnWeb")}{" "}
            <Link href="/login" className="font-semibold underline underline-offset-2">
              {t("landing.hero.logIn")}
            </Link>{" "}
            {t("landing.hero.or")}{" "}
            <SignupLink className="font-semibold underline underline-offset-2">{t("landing.hero.signUp")}</SignupLink>
            .
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

function CrowdLine({ side, count, one, many }: { side: "creator" | "brand"; count: number; one: string; many: string }) {
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
