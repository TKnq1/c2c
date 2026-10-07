import Image from "next/image";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";
import { FiCheck, FiChevronLeft, FiExternalLink } from "react-icons/fi";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { RequestCardFace, RequestFacts } from "@/components/request-card-face";
import { RatingSummary } from "@/components/stars";
import { Spinner } from "@/components/spinner";
import { AppHeader, PhoneFrame } from "@/components/landing/phone-frame";
import { Reveal } from "@/components/landing/reveal";
import { PHOTOS, deck } from "@/components/landing/landing-data";
import { getLocale, getT } from "@/lib/i18n/server";
import { nicheLabel, presetLabel } from "@/lib/i18n/labels";
import type { TFunction } from "@/lib/i18n/translate";

type Feature = { icon: string; title: string; body: string; mockup: React.ReactNode };
type Example = ReturnType<typeof deck>[number];
type Ctx = { t: TFunction; odd: Example; kiez: Example };

// The deal from each side, in the order it happens. The money lines follow
// src/lib/constants.ts and the FAQ: 10% fee (3% for Pro brands), 3 days
// to approve before the payment is released anyway.
function creatorFeatures(c: Ctx): Feature[] {
  const { t } = c;
  return [
    {
      icon: "swipe",
      title: t("landing.features.creator1Title"),
      body: t("landing.features.creator1Body"),
      mockup: <SwipeMock {...c} />,
    },
    {
      icon: "money-bag",
      title: t("landing.features.creator2Title"),
      body: t("landing.features.creator2Body"),
      mockup: <BudgetMock {...c} />,
    },
    {
      icon: "locked",
      title: t("landing.features.creator3Title"),
      body: t("landing.features.creator3Body"),
      mockup: <CreatorOfferMock {...c} />,
    },
    {
      icon: "money-wings",
      title: t("landing.features.creator4Title"),
      body: t("landing.features.creator4Body", {
        price: PRO_SUBSCRIPTION_PRICE_CENTS / 100,
        keepPro: 100 - Math.round(PRO_PLATFORM_FEE_RATE * 100),
      }),
      mockup: <PayoutMock {...c} />,
    },
  ];
}

function brandFeatures(c: Ctx): Feature[] {
  const { t } = c;
  return [
    {
      icon: "megaphone",
      title: t("landing.features.brand1Title"),
      body: t("landing.features.brand1Body"),
      mockup: <RequestMock {...c} />,
    },
    {
      icon: "bell",
      title: t("landing.features.brand2Title"),
      body: t("landing.features.brand2Body"),
      mockup: <InterestedMock {...c} />,
    },
    {
      icon: "speech-balloon",
      title: t("landing.features.brand3Title"),
      body: t("landing.features.brand3Body"),
      mockup: <BrandOfferMock {...c} />,
    },
    {
      icon: "camera-flash",
      title: t("landing.features.brand4Title"),
      body: t("landing.features.brand4Body", {
        standard: Math.round(PLATFORM_FEE_RATE * 100),
        pro: Math.round(PRO_PLATFORM_FEE_RATE * 100),
        price: PRO_SUBSCRIPTION_PRICE_CENTS / 100,
      }),
      mockup: <ApproveMock {...c} />,
    },
  ];
}

export async function FeatureGrid() {
  const t = await getT();
  const [odd, kiez] = deck(0, await getLocale());
  const ctx: Ctx = { t, odd, kiez };
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-paper px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <FeatureSet role="creator" heading={t("landing.features.creatorHeading")} features={creatorFeatures(ctx)} />
        <FeatureSet role="brand" heading={t("landing.features.brandHeading")} features={brandFeatures(ctx)} />
        <p className="mt-8 text-center text-footnote text-neutral-600 dark:text-neutral-400">
          {t("landing.features.note")}
        </p>
      </div>
    </section>
  );
}

function FeatureSet({ role, heading, features }: { role: "creator" | "brand"; heading: string; features: Feature[] }) {
  return (
    <div data-for={role}>
      <Reveal>
        <h2 className="mx-auto mb-10 max-w-[18ch] text-center font-display text-[36px] leading-[1.05] font-black tracking-[-0.03em] text-balance md:mb-14 md:text-[56px]">
          {heading}
        </h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((f, i) => (
          <FeatureCard key={f.title} feature={f} delay={(i % 2) * 140} />
        ))}
      </div>
    </div>
  );
}

// A grey panel like the app's own groups: the icon, what it is, and a phone
// rising out of the bottom edge with one piece of it lifted out in front.
function FeatureCard({ feature, delay }: { feature: Feature; delay: number }) {
  return (
    <Reveal delay={delay} className="lp-card flex min-h-[620px] flex-col overflow-hidden rounded bg-fog text-center md:min-h-[680px]">
      <div className="flex flex-col items-center px-7 pt-12 md:px-10">
        <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-paper shadow-sm">
          <span className="lp-icon-tilt">
            <Image
              src={`/landing/icons/${feature.icon}.png`}
              alt=""
              width={50}
              height={50}
              className="lp-icon-img"
              style={{ "--lp-delay": `${delay * 4}ms` } as React.CSSProperties}
            />
          </span>
        </span>
        <h3 className="mt-6 max-w-[17ch] font-display text-[28px] leading-[1.08] font-black tracking-[-0.02em] text-balance md:text-[34px]">
          {feature.title}
        </h3>
        <p className="mt-3 max-w-[38ch] text-body text-neutral-600 dark:text-neutral-400">{feature.body}</p>
      </div>
      <div className="relative mt-auto h-[350px] w-full pt-10">{feature.mockup}</div>
    </Reveal>
  );
}

// The top of a phone coming up out of the card's bottom edge.
function CroppedPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex h-[330px] justify-center overflow-hidden">
      <div className="lp-rise-in">
        <PhoneFrame className="h-[560px] w-[264px]">{children}</PhoneFrame>
      </div>
    </div>
  );
}

// The piece lifted out of the phone, in front of it.
function Floating({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`absolute z-10 ${className}`}>
      <div className="lp-pop">{children}</div>
    </div>
  );
}

function ChatHeader({ name }: { name: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-ink/10 px-2 pb-2">
      <FiChevronLeft className="h-6 w-6" />
      <Avatar src={null} name={name} size={28} />
      <span className="truncate text-sm font-semibold">{name}</span>
    </div>
  );
}

function Bubble({ mine, children }: { mine?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[80%] rounded-[18px] px-3.5 py-2 text-left text-sm ${
          mine ? "bg-ink text-paper" : "bg-fog text-neutral-900 dark:text-neutral-100"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

// The chat's offer card (see chat-offer.tsx), in its states.
function OfferCard({ eyebrow, amount, detail, children }: { eyebrow: string; amount: string; detail: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-ink/10 bg-paper p-3 text-left shadow-xl">
      <p className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">{eyebrow}</p>
      <p className="text-[22px] leading-tight font-bold tabular-nums">{amount}</p>
      <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{detail}</p>
      {children}
    </div>
  );
}

function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded border border-ink/10 bg-paper px-4 py-3 text-sm whitespace-nowrap shadow-xl">
      <FiCheck className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}

function FeedCard({ request }: { request: Example }) {
  return (
    <div className="relative mt-3 h-[440px]">
      <div className="absolute inset-0 rounded-b-[28px] shadow-xl">
        <div className="flex h-full flex-col overflow-hidden rounded-b-[28px] bg-paper ring-1 ring-ink/10 ring-inset [clip-path:inset(0_round_0_0_28px_28px)]">
          <RequestCardFace request={request} lazyPhotos />
        </div>
      </div>
    </div>
  );
}

function SwipeMock({ t, kiez }: Ctx) {
  return (
    <>
      <CroppedPhone>
        <AppHeader title={t("nav.feed")} />
        <FeedCard request={kiez} />
      </CroppedPhone>
      <Floating className="top-[34%] right-[4%] rotate-[-3deg] sm:right-[10%]">
        <Toast>{t("landing.mock.interestSent")}</Toast>
      </Floating>
    </>
  );
}

function BudgetMock({ t, odd }: Ctx) {
  return (
    <>
      <CroppedPhone>
        <div className="relative h-28 shrink-0">
          <Image src={PHOTOS.serum} alt="" fill sizes="264px" className="object-cover" />
        </div>
        <div className="flex flex-col gap-3 p-3 text-left">
          <div className="flex items-center gap-2.5">
            <Avatar src={null} name={odd.companyName} size={32} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{odd.companyName}</p>
              <RatingSummary average={odd.rating.average} count={odd.rating.count} />
            </div>
          </div>
          <RequestFacts request={odd} />
        </div>
      </CroppedPhone>
      <Floating className="top-[20%] left-[4%] rotate-[-5deg] sm:left-[10%]">
        <span className="flex items-baseline gap-1.5 rounded-full bg-white px-5 py-2.5 text-neutral-900 shadow-xl">
          <span className="text-[30px] leading-none font-black">250 €</span>
          <span className="text-sm font-semibold text-neutral-500">{t("landing.mock.budgetWord")}</span>
        </span>
      </Floating>
    </>
  );
}

function CreatorOfferMock({ t, odd }: Ctx) {
  return (
    <>
      <CroppedPhone>
        <ChatHeader name={odd.companyName} />
        <div className="flex flex-col gap-1 px-3 pt-3">
          <Bubble>{t("landing.mock.oneTikTok")}</Bubble>
          <Bubble mine>{t("landing.mock.deal")}</Bubble>
        </div>
      </CroppedPhone>
      <Floating className="top-[56%] left-1/2 w-[80%] max-w-[290px] -translate-x-1/2">
        <div className="lp-cycle grid items-start">
          <OfferCard
            eyebrow={t("landing.mock.offerAccepted")}
            amount="250,00 €"
            detail={t("landing.mock.payNext", { brand: odd.companyName })}
          />
          <OfferCard
            eyebrow={t("landing.mock.offerAccepted")}
            amount="250,00 €"
            detail={t("landing.mock.payNext", { brand: odd.companyName })}
          >
            <p className="mt-2.5 flex items-center justify-center gap-2 rounded-full bg-fog px-4 py-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              <Spinner />
              {t("landing.mock.waitingPayment")}
            </p>
          </OfferCard>
          <OfferCard
            eyebrow={t("landing.mock.paidHeld")}
            amount="250,00 €"
            detail={t("landing.mock.postThenSubmit", { brand: odd.companyName })}
          />
        </div>
      </Floating>
    </>
  );
}

function PayoutMock({ t, odd, kiez }: Ctx) {
  return (
    <>
      <CroppedPhone>
        <AppHeader title={t("nav.payments")} />
        <div className="flex flex-col gap-2 p-3 text-left">
          {[
            { name: odd.companyName, title: odd.title, status: t("landing.mock.released") },
            { name: kiez.companyName, title: kiez.title, status: t("landing.mock.held") },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-2.5 rounded bg-fog p-3">
              <Avatar src={null} name={p.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{p.title}</p>
              </div>
              <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-medium">{p.status}</span>
            </div>
          ))}
        </div>
      </CroppedPhone>
      <Floating className="top-[60%] right-[4%] rotate-[2deg] sm:right-[9%]">
        <div className="w-[228px] rounded border border-ink/10 bg-paper px-3.5 py-3 text-left shadow-xl">
          <p className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">{t("landing.mock.paymentReleased")}</p>
          <div className="mt-2 flex justify-between text-sm">
            <span>{t("landing.mock.brandPaid", { brand: odd.companyName })}</span>
            <span className="tabular-nums">250,00 €</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
            <span>{t("landing.mock.feeLine")}</span>
            <span className="tabular-nums">−25,00 €</span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between border-t border-ink/10 pt-1.5">
            <span className="text-sm font-medium">{t("landing.mock.youGet")}</span>
            <span className="font-display text-[26px] leading-none font-black tabular-nums">
              <span className="lp-count" style={{ "--lp-to": 225 } as React.CSSProperties} />
              ,00 €
            </span>
          </div>
        </div>
      </Floating>
    </>
  );
}

function RequestMock({ t }: Ctx) {
  const rows: [string, React.ReactNode][] = [
    [t("landing.mock.rowTitle"), t("landing.mock.fragrance")],
    [t("landing.mock.rowBudget"), "300 €"],
    [
      t("landing.mock.rowPlatform"),
      <span key="p" className="inline-flex items-center gap-1.5">
        <PlatformIcon platform="Instagram" className="h-3.5 w-3.5" />
        Instagram
      </span>,
    ],
    [t("landing.mock.rowContent"), presetLabel(t, "1 Reel")],
    [t("landing.mock.rowPostBy"), t("landing.mock.flexible")],
    [t("landing.mock.rowProduct"), t("landing.mock.cosmeticsIncluded")],
  ];
  return (
    <>
      <CroppedPhone>
        <AppHeader title={t("nav.newRequest")} />
        <div className="p-3">
          <div className="rounded bg-fog px-3 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-ink/10 py-2.5 [&+&]:border-t">
                <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
                <span className="truncate font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </CroppedPhone>
      <Floating className="top-[80%] right-[4%] rotate-[-2deg] sm:right-[10%]">
        <Toast>{t("landing.mock.requestPosted")}</Toast>
      </Floating>
    </>
  );
}

const CREATORS = [
  { name: "Mia K.", niche: "Beauty", platform: "TikTok", followers: "58K" },
  { name: "Jonas R.", niche: "Lifestyle", platform: "Instagram", followers: "112K" },
  { name: "Aria N.", niche: "Beauty", platform: "YouTube", followers: "34K" },
];

function InterestedMock({ t }: Ctx) {
  return (
    <>
      <CroppedPhone>
        <AppHeader title={t("nav.requests")} />
        <div className="p-3 text-left">
          <p className="px-1 text-footnote text-neutral-500 dark:text-neutral-400">{t("landing.mock.interestedCreators")}</p>
          <div className="mt-1.5 divide-y divide-ink/10 rounded bg-fog">
            {CREATORS.map((c) => (
              <div key={c.name} className="flex items-center gap-2.5 px-3 py-2.5">
                <Avatar src={null} name={c.name} size={32} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {nicheLabel(t, c.niche)} ·
                    <PlatformIcon platform={c.platform} className="h-3 w-3" />
                    {c.followers}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CroppedPhone>
      {/* The push notification the brand gets, coming in over the top of
          the screen the way iOS shows one. Same text the app sends. */}
      <Floating className="top-[17%] left-1/2 w-[248px] -translate-x-1/2">
        <div className="flex items-start gap-2.5 rounded-[18px] border border-ink/10 bg-paper/90 p-2.5 text-left shadow-xl backdrop-blur-xl">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-ink">
            <Image src="/logo.png" alt="" width={22} height={22} className="invert dark:invert-0" />
          </span>
          <span className="min-w-0 flex-1 text-[13px] leading-snug">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">comtor</span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{t("landing.mock.now")}</span>
            </span>
            <span className="block">{t("landing.mock.pushText", { name: "Mia K.", title: t("landing.mock.fragrance") })}</span>
          </span>
        </div>
      </Floating>
    </>
  );
}

function BrandOfferMock({ t }: Ctx) {
  return (
    <>
      <CroppedPhone>
        <ChatHeader name="Mia K." />
        <div className="flex flex-col gap-1 px-3 pt-3">
          <Bubble>{t("landing.mock.helloLove")}</Bubble>
          <Bubble mine>{t("landing.mock.sendingOffer")}</Bubble>
        </div>
      </CroppedPhone>
      <Floating className="top-[56%] left-1/2 w-[80%] max-w-[290px] -translate-x-1/2">
        <div className="lp-cycle grid items-start">
          <OfferCard eyebrow={t("landing.mock.yourOffer")} amount="300,00 €" detail={t("landing.mock.wouldGet", { name: "Mia K." })} />
          <OfferCard eyebrow={t("landing.mock.offerAccepted")} amount="300,00 €" detail={t("landing.mock.payThrough", { name: "Mia K." })}>
            <span className="mt-2.5 flex justify-center rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper">{t("landing.mock.payNow")}</span>
          </OfferCard>
          <OfferCard eyebrow={t("landing.mock.paidHeld")} amount="300,00 €" detail={t("landing.mock.releasedWhen", { name: "Mia K." })} />
        </div>
      </Floating>
    </>
  );
}

function ApproveMock({ t }: Ctx) {
  return (
    <>
      <CroppedPhone>
        <ChatHeader name="Mia K." />
        <div className="flex flex-col gap-1 px-3 pt-3">
          <Bubble>{t("landing.mock.itsLive")}</Bubble>
          <div className="mt-1 flex items-center gap-2 rounded bg-fog p-2.5 text-left text-xs">
            <PlatformIcon platform="TikTok" className="h-4 w-4 shrink-0" />
            <span className="truncate">tiktok.com/@miak/video/7428</span>
            <FiExternalLink className="ml-auto h-3.5 w-3.5 shrink-0" />
          </div>
        </div>
      </CroppedPhone>
      <Floating className="top-[56%] left-1/2 w-[80%] max-w-[290px] -translate-x-1/2">
        <div className="lp-cycle grid items-start">
          <OfferCard eyebrow={t("landing.mock.postSubmitted")} amount="300,00 €" detail={t("landing.mock.checkPost")}>
            <span className="mt-2.5 flex gap-2">
              <span className="flex-1 rounded-full bg-ink px-4 py-1.5 text-center text-sm font-medium text-paper">{t("landing.mock.approve")}</span>
              <span className="flex-1 rounded-full border border-neutral-300 px-4 py-1.5 text-center text-sm font-medium dark:border-neutral-700">
                {t("landing.mock.report")}
              </span>
            </span>
          </OfferCard>
          <OfferCard eyebrow={t("landing.mock.postSubmitted")} amount="300,00 €" detail={t("landing.mock.checkPost")}>
            <span className="mt-2.5 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper">
              <Spinner />
              {t("landing.mock.approving")}
            </span>
          </OfferCard>
          <OfferCard eyebrow={t("landing.mock.paymentReleased")} amount="300,00 €" detail={t("landing.mock.received", { name: "Mia K." })} />
        </div>
      </Floating>
    </>
  );
}
