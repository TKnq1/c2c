import Link from "next/link";
import { Logo } from "@/components/logo";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";

const PRIMARY_BUTTON =
  "rounded bg-ink text-paper px-6 py-3 text-sm font-medium hover:bg-graphite transition";
const SECONDARY_BUTTON =
  "rounded border border-neutral-300 px-6 py-3 text-sm font-medium hover:bg-neutral-50 transition dark:border-neutral-700 dark:hover:bg-neutral-800/50";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <section className="px-6 py-20 md:py-28 flex flex-col items-center text-center gap-6">
        <Logo large />
        <h1 className="font-display text-4xl md:text-5xl font-normal max-w-2xl">
          Find the right creator. Pay only when the work is live.
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-xl">
          C2C matches brands with creators by niche and reach, then holds every payment in escrow
          until the collab is actually posted.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Link href="/signup" className={PRIMARY_BUTTON}>
            Get started
          </Link>
          <Link href="/login" className={SECONDARY_BUTTON}>
            Log in
          </Link>
        </div>
      </section>

      <section className="border-t border-ink/10 px-6 py-16">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-2xl font-normal mb-3">For brands</h2>
            <ul className="flex flex-col gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>Post a request — niche, minimum followers, product category.</li>
              <li>Matching creators apply. No manual searching or cold outreach.</li>
              <li>Pay through escrow — funds release only once the work is posted.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-normal mb-3">For creators</h2>
            <ul className="flex flex-col gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>See requests that actually match your niche and reach.</li>
              <li>Message brands directly once you&apos;re interested.</li>
              <li>Get paid securely — held in escrow until you post.</li>
            </ul>
          </div>
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
