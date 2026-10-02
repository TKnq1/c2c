"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandBuilder } from "@/components/landing/brand-builder";
import { CreatorDeck } from "@/components/landing/creator-deck";
import { PhotoBackdrop } from "@/components/landing/photo-backdrop";
import { FIRST_PHOTO, type PhotoKey } from "@/components/landing/landing-data";

const delay = (ms: number) => ({ "--lp-delay": `${ms}ms` }) as React.CSSProperties;

// The headline over the thing itself: creators get the Feed to swipe,
// brands the card they'd post, live. Either way the photo in play colours
// the whole section.
export function Hero() {
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
            <span>Swipe right on</span>
          </span>
          <span className="lp-line">
            <span style={delay(90)}>paid brand deals.</span>
          </span>
        </h1>
        <h1
          data-for="brand"
          className="font-display text-[clamp(34px,11.4vw,44px)] leading-[0.98] font-black tracking-[-0.035em] sm:text-[64px] lg:text-[88px]"
        >
          <span className="lp-line">
            <span>Post a deal.</span>
          </span>
          <span className="lp-line">
            {/* Three lines on phones rather than "you." left on its own. */}
            <span style={delay(90)}>
              Creators come <br className="sm:hidden" />
              to you.
            </span>
          </span>
        </h1>

        <p
          data-for="creator"
          className="lp-rise mt-6 max-w-[36ch] text-[19px] leading-snug text-neutral-800 md:text-[22px] dark:text-neutral-200"
          style={delay(250)}
        >
          Every request shows the budget upfront. The money&apos;s in before you post, and you keep 90%.
        </p>
        <p
          data-for="brand"
          className="lp-rise mt-6 max-w-[38ch] text-[19px] leading-snug text-neutral-800 md:text-[22px] dark:text-neutral-200"
          style={delay(250)}
        >
          Set the budget and what to post. Creators who fit swipe right, and your money is held until you&apos;ve
          approved the post.
        </p>

        {/* Phones: the nav has Log in where Get the app is on bigger
            screens, so the button sits here, with a word on the web app. */}
        <div className="lp-rise mt-7 flex flex-col items-center gap-2.5 sm:hidden" style={delay(330)}>
          <a
            href="#get-the-app"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-graphite"
          >
            Get the app
          </a>
          <p className="text-footnote text-neutral-700 dark:text-neutral-300">
            Already live on the web:{" "}
            <Link href="/login" className="font-semibold underline underline-offset-2">
              log in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-semibold underline underline-offset-2">
              sign up
            </Link>
            .
          </p>
        </div>

        <div className="mt-10 flex w-full justify-center sm:mt-12 md:mt-16">
          <div data-for="creator" className="lp-phone-in" style={delay(350)}>
            <CreatorDeck onTop={setCreatorPhoto} />
          </div>
          <div data-for="brand" className="lp-phone-in w-full" style={delay(350)}>
            <BrandBuilder onPhoto={setBrandPhoto} />
          </div>
        </div>
        <p data-for="creator" className="lp-rise mt-6 text-sm text-neutral-700 dark:text-neutral-300" style={delay(900)}>
          Drag the card: right is interested, left is pass.
        </p>
      </div>
    </section>
  );
}
