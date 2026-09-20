import Link from "next/link";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/avatar";
import { RatingSummary } from "@/components/stars";
import { PlatformIcon } from "@/components/platform-icons";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";

const PRIMARY_BUTTON =
  "rounded bg-ink text-paper px-6 py-3 text-sm font-medium hover:bg-graphite transition";
const SECONDARY_BUTTON =
  "rounded border border-neutral-300 px-6 py-3 text-sm font-medium hover:bg-neutral-50 transition dark:border-neutral-700 dark:hover:bg-neutral-800/50";

// Static, fictional preview data for the hero mockup below — not fetched
// from anywhere, just illustrating the actual Discover feed's own card
// design (same Avatar/RatingSummary/PlatformIcon components the real
// dashboard uses) so a cold visitor sees roughly what signing up gets them.
const MOCK_CREATORS = [
  {
    name: "Mia K.",
    niche: "Beauty",
    rating: 4.8,
    count: 21,
    platform: "Instagram",
    followers: "58K+",
  },
  {
    name: "Jonas R.",
    niche: "Fitness",
    rating: 4.9,
    count: 34,
    platform: "TikTok",
    followers: "112K+",
  },
];

function DiscoverMockup() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-ink/10 shadow-sm overflow-hidden bg-paper dark:bg-fog">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-ink/10">
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        <span className="ml-3 text-xs text-neutral-400 dark:text-neutral-500">
          companytocreator.com/discover
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {MOCK_CREATORS.map((c) => (
          <div
            key={c.name}
            className="rounded-xl border border-ink/10 p-4 flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <Avatar src={null} name={c.name} size={36} />
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <RatingSummary average={c.rating} count={c.count} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[11px] rounded bg-fog text-neutral-700 px-2 py-0.5 dark:bg-neutral-800 dark:text-neutral-300">
                {c.niche}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                <PlatformIcon platform={c.platform} className="h-3 w-3" />
                {c.followers}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Post or match",
    body: "Brands post a request — niche, minimum followers, product category. Creators see the ones that actually match their reach.",
  },
  {
    title: "Connect directly",
    body: "Interested creators message the brand right in the platform. No cold outreach, no guessing who's actually a fit.",
  },
  {
    title: "Pay through escrow",
    body: "Funds are held until the creator marks the work as posted, then released — minus our fee. Cancel and refund anytime before that.",
  },
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Logo />
        <Link href="/login" className="text-sm font-medium underline">
          Log in
        </Link>
      </header>

      <section className="px-6 pt-12 pb-20 md:pt-16 flex flex-col items-center text-center gap-6">
        <h1 className="font-display text-4xl md:text-5xl font-normal max-w-2xl">
          Find the right creator. Pay only when the work is live.
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-xl">
          C2C matches brands with creators by niche and reach, then holds every payment in escrow
          until the collab is actually posted.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className={PRIMARY_BUTTON}>
            Get started
          </Link>
          <Link href="/faq" className={SECONDARY_BUTTON}>
            See how it works
          </Link>
        </div>
        <div className="mt-8 w-full flex justify-center">
          <DiscoverMockup />
        </div>
      </section>

      <section className="border-t border-ink/10 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-normal text-center mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-ink/10 p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/20 text-xs font-medium mb-3">
                  {i + 1}
                </span>
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
            Payments
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-normal mb-3">
            Nobody gets paid for work that never happened
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Every payment sits in escrow the moment a brand sends it — not with the creator, not
            back with the brand. It only moves once the creator marks the collab as posted. If
            that never happens, the brand cancels and gets a full refund.
          </p>
        </div>
      </section>

      <section className="border-t border-ink/10 px-6 py-12 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
          We take a {PLATFORM_FEE_RATE * 100}% fee on completed payments — no subscriptions
          required, no listing fees. Brands doing regular volume can drop that to{" "}
          {PRO_PLATFORM_FEE_RATE * 100}% with Pro.{" "}
          <Link href="/faq" className="underline">
            More in the FAQ
          </Link>
          .
        </p>
      </section>

      <section className="border-t border-ink/10 px-6 py-16 flex flex-col items-center gap-4 text-center">
        <h2 className="font-display text-2xl font-normal">Ready to get started?</h2>
        <Link href="/signup" className={PRIMARY_BUTTON}>
          Create your account
        </Link>
      </section>
    </main>
  );
}
