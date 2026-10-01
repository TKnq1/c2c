import Image from "next/image";
import { FiBell, FiCheck, FiChevronLeft, FiExternalLink } from "react-icons/fi";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { RequestCardFace, RequestFacts } from "@/components/request-card-face";
import { RatingSummary } from "@/components/stars";
import { Spinner } from "@/components/spinner";
import { AppHeader, PhoneFrame } from "@/components/landing/phone-frame";
import { Reveal } from "@/components/landing/reveal";
import { PHOTOS, deck } from "@/components/landing/landing-data";

const [ODD_BLOOM, KIEZ_GOODS] = deck(0);

type Feature = { icon: string; title: string; body: string; mockup: React.ReactNode };

// The deal from each side, in the order it happens. The money lines follow
// src/lib/constants.ts and the FAQ: 10% fee (3% for Pro brands), 3 days
// to approve before the payment is released anyway.
const CREATOR_FEATURES: Feature[] = [
  {
    icon: "swipe",
    title: "Swipe through brand deals",
    body: "Right means you're interested. The brand sees your profile and can message you.",
    mockup: <SwipeMock />,
  },
  {
    icon: "money-bag",
    title: "The budget is on the card",
    body: "No more DMs about rates. Every request says what it pays, what to post and whether the product comes with it.",
    mockup: <BudgetMock />,
  },
  {
    icon: "locked",
    title: "Paid before you post",
    body: "Accept an offer and the brand pays first. The money waits in escrow until your post is up.",
    mockup: <CreatorOfferMock />,
  },
  {
    icon: "money-wings",
    title: "You keep 90%",
    body: "The brand has 3 days to approve your post. If they don't answer, it's released to you anyway.",
    mockup: <PayoutMock />,
  },
];

const BRAND_FEATURES: Feature[] = [
  {
    icon: "megaphone",
    title: "Post a request in a minute",
    body: "Photos, budget, platform and what to post. Creators get it as a card in their feed.",
    mockup: <RequestMock />,
  },
  {
    icon: "bell",
    title: "Creators come to you",
    body: "Creators in your niche swipe right on it. You see their reach and reviews and pick who fits.",
    mockup: <InterestedMock />,
  },
  {
    icon: "speech-balloon",
    title: "Agree on it in the chat",
    body: "Send an offer. When they accept, you pay, and the money is held in escrow until the post is live.",
    mockup: <BrandOfferMock />,
  },
  {
    icon: "camera-flash",
    title: "Approve the post, then it's paid out",
    body: "Check the live post first. No subscription: comtor keeps 10% of each payment, or 3% on Pro.",
    mockup: <ApproveMock />,
  },
];

export function FeatureGrid() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-paper px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <FeatureSet role="creator" heading="From swipe to payout." features={CREATOR_FEATURES} />
        <FeatureSet role="brand" heading="From request to live post." features={BRAND_FEATURES} />
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
    <div className="rounded-[18px] border border-ink/10 bg-paper p-3.5 text-left shadow-xl">
      <p className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">{eyebrow}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums">{amount}</p>
      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{detail}</p>
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

function FeedCard({ request }: { request: typeof ODD_BLOOM }) {
  return (
    <div className="relative mt-3 h-[440px]">
      <div className="absolute inset-0 flex flex-col overflow-hidden rounded-b-[28px] border border-ink/10 bg-paper shadow-xl">
        <RequestCardFace request={request} />
      </div>
    </div>
  );
}

function SwipeMock() {
  return (
    <>
      <CroppedPhone>
        <AppHeader title="Feed" />
        <FeedCard request={KIEZ_GOODS} />
      </CroppedPhone>
      <Floating className="top-[34%] right-[4%] rotate-[-3deg] sm:right-[10%]">
        <Toast>Interest sent.</Toast>
      </Floating>
    </>
  );
}

function BudgetMock() {
  return (
    <>
      <CroppedPhone>
        <div className="relative h-28 shrink-0">
          <Image src={PHOTOS.serum} alt="" fill sizes="264px" className="object-cover" />
        </div>
        <div className="flex flex-col gap-3 p-3 text-left">
          <div className="flex items-center gap-2.5">
            <Avatar src={null} name={ODD_BLOOM.companyName} size={32} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{ODD_BLOOM.companyName}</p>
              <RatingSummary average={ODD_BLOOM.rating.average} count={ODD_BLOOM.rating.count} />
            </div>
          </div>
          <RequestFacts request={ODD_BLOOM} />
        </div>
      </CroppedPhone>
      <Floating className="top-[20%] left-[4%] rotate-[-5deg] sm:left-[10%]">
        <span className="flex items-baseline gap-1.5 rounded-full bg-white px-5 py-2.5 text-neutral-900 shadow-xl">
          <span className="text-[30px] leading-none font-black">250 €</span>
          <span className="text-sm font-semibold text-neutral-500">budget</span>
        </span>
      </Floating>
    </>
  );
}

function CreatorOfferMock() {
  return (
    <>
      <CroppedPhone>
        <ChatHeader name="Odd Bloom" />
        <div className="flex flex-col gap-1 px-3 pt-3">
          <Bubble>One TikTok for 250 €?</Bubble>
          <Bubble mine>Deal!</Bubble>
        </div>
      </CroppedPhone>
      <Floating className="top-[56%] left-1/2 w-[80%] max-w-[290px] -translate-x-1/2">
        <div className="lp-cycle grid items-start">
          <OfferCard eyebrow="Offer accepted" amount="250,00 €" detail="Odd Bloom pays next. It's held in escrow until you post." />
          <OfferCard eyebrow="Offer accepted" amount="250,00 €" detail="Odd Bloom pays next. It's held in escrow until you post.">
            <p className="mt-3 flex items-center justify-center gap-2 rounded-full bg-fog px-4 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              <Spinner />
              Waiting for payment
            </p>
          </OfferCard>
          <OfferCard
            eyebrow="Paid · held in escrow"
            amount="250,00 €"
            detail="Post the content, then submit the link. You get 225,00 € once Odd Bloom approves it."
          />
        </div>
      </Floating>
    </>
  );
}

function PayoutMock() {
  return (
    <>
      <CroppedPhone>
        <AppHeader title="Payments" />
        <div className="flex flex-col gap-2 p-3 text-left">
          {[
            { name: "Odd Bloom", title: "Serum launch, first impressions", status: "Released" },
            { name: "Kiez Goods", title: "Iced matcha for the summer menu", status: "In escrow" },
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
      <Floating className="top-[46%] right-[4%] rotate-[2deg] sm:right-[9%]">
        <div className="w-[236px] rounded border border-ink/10 bg-paper p-4 text-left shadow-xl">
          <p className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">Payment released</p>
          <div className="mt-2 flex justify-between text-sm">
            <span>Odd Bloom paid</span>
            <span className="tabular-nums">250,00 €</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
            <span>comtor fee (10%)</span>
            <span className="tabular-nums">−25,00 €</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-2">
            <span className="text-sm font-medium">You get</span>
            <span className="font-display text-[28px] font-black tabular-nums">
              <span className="lp-count" style={{ "--lp-to": 225 } as React.CSSProperties} />
              ,00 €
            </span>
          </div>
        </div>
      </Floating>
    </>
  );
}

const REQUEST_ROWS: [string, React.ReactNode][] = [
  ["Title", "Our new fragrance"],
  ["Budget", "300 €"],
  [
    "Platform",
    <span key="p" className="inline-flex items-center gap-1.5">
      <PlatformIcon platform="Instagram" className="h-3.5 w-3.5" />
      Instagram
    </span>,
  ],
  ["Content", "1 Reel"],
  ["Post by", "Flexible"],
  ["Product", "Cosmetics · included"],
];

function RequestMock() {
  return (
    <>
      <CroppedPhone>
        <AppHeader title="New request" />
        <div className="p-3">
          <div className="rounded bg-fog px-3 text-sm">
            {REQUEST_ROWS.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-ink/10 py-2.5 [&+&]:border-t">
                <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
                <span className="truncate font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </CroppedPhone>
      <Floating className="top-[64%] right-[4%] rotate-[-2deg] sm:right-[10%]">
        <Toast>Request posted.</Toast>
      </Floating>
    </>
  );
}

const CREATORS = [
  { name: "Mia K.", niche: "Beauty", platform: "TikTok", followers: "58K" },
  { name: "Jonas R.", niche: "Lifestyle", platform: "Instagram", followers: "112K" },
  { name: "Aria N.", niche: "Beauty", platform: "YouTube", followers: "34K" },
];

function InterestedMock() {
  return (
    <>
      <CroppedPhone>
        <AppHeader title="Requests" />
        <div className="p-3 text-left">
          <p className="px-1 text-footnote text-neutral-500 dark:text-neutral-400">Interested creators</p>
          <div className="mt-1.5 divide-y divide-ink/10 rounded bg-fog">
            {CREATORS.map((c) => (
              <div key={c.name} className="flex items-center gap-2.5 px-3 py-2.5">
                <Avatar src={null} name={c.name} size={32} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {c.niche} ·
                    <PlatformIcon platform={c.platform} className="h-3 w-3" />
                    {c.followers}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CroppedPhone>
      <Floating className="top-[66%] left-[3%] rotate-[-3deg] sm:left-[8%]">
        <div className="flex w-[250px] items-start gap-3 rounded border border-ink/10 bg-paper p-3.5 text-left shadow-xl">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
            <FiBell className="h-4 w-4" />
          </span>
          <span className="min-w-0 text-sm">
            <span className="font-bold">Mia K. is interested</span> in Our new fragrance.
            <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">Just now</span>
          </span>
        </div>
      </Floating>
    </>
  );
}

function BrandOfferMock() {
  return (
    <>
      <CroppedPhone>
        <ChatHeader name="Mia K." />
        <div className="flex flex-col gap-1 px-3 pt-3">
          <Bubble>Hi! I&apos;d love to do this.</Bubble>
          <Bubble mine>Great, sending an offer.</Bubble>
        </div>
      </CroppedPhone>
      <Floating className="top-[56%] left-1/2 w-[80%] max-w-[290px] -translate-x-1/2">
        <div className="lp-cycle grid items-start">
          <OfferCard eyebrow="Your offer" amount="300,00 €" detail="Mia K. would get 270,00 € after the 10% fee." />
          <OfferCard eyebrow="Offer accepted" amount="300,00 €" detail="Pay through Stripe. It's held in escrow until Mia K. posts and you approve it.">
            <span className="mt-3 flex justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">Pay now</span>
          </OfferCard>
          <OfferCard eyebrow="Paid · held in escrow" amount="300,00 €" detail="Released to Mia K. once they post and you approve it." />
        </div>
      </Floating>
    </>
  );
}

function ApproveMock() {
  return (
    <>
      <CroppedPhone>
        <ChatHeader name="Mia K." />
        <div className="flex flex-col gap-1 px-3 pt-3">
          <Bubble>It&apos;s live! Here&apos;s the link.</Bubble>
          <div className="mt-1 flex items-center gap-2 rounded bg-fog p-2.5 text-left text-xs">
            <PlatformIcon platform="TikTok" className="h-4 w-4 shrink-0" />
            <span className="truncate">tiktok.com/@miak/video/7428</span>
            <FiExternalLink className="ml-auto h-3.5 w-3.5 shrink-0" />
          </div>
        </div>
      </CroppedPhone>
      <Floating className="top-[56%] left-1/2 w-[80%] max-w-[290px] -translate-x-1/2">
        <div className="lp-cycle grid items-start">
          <OfferCard eyebrow="Post submitted" amount="300,00 €" detail="Check the post, then approve it or report a problem within 3 days.">
            <span className="mt-3 flex gap-2">
              <span className="flex-1 rounded-full bg-ink px-4 py-2 text-center text-sm font-medium text-paper">Approve</span>
              <span className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-center text-sm font-medium dark:border-neutral-700">
                Report
              </span>
            </span>
          </OfferCard>
          <OfferCard eyebrow="Post submitted" amount="300,00 €" detail="Check the post, then approve it or report a problem within 3 days.">
            <span className="mt-3 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
              <Spinner />
              Approving
            </span>
          </OfferCard>
          <OfferCard eyebrow="Payment released" amount="300,00 €" detail="Mia K. received 270,00 €." />
        </div>
      </Floating>
    </>
  );
}
