import Link from "next/link";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        <Logo large />
        <span className="text-xs font-medium rounded bg-fog text-neutral-700 px-3 py-1 dark:text-neutral-300">
          In progress
        </span>
        <div>
          <h1 className="font-display text-3xl font-normal">We&apos;re putting the finishing touches on things</h1>
          <p className="text-sm text-neutral-600 mt-3 dark:text-neutral-400">
            C2C is a marketplace that connects brands with content creators for paid collaborations.
            Brands post what they&apos;re looking for, creators apply, and payment is held safely in
            escrow through Stripe until the work is delivered.
          </p>
          <p className="text-sm text-neutral-600 mt-3 dark:text-neutral-400">
            We&apos;re still wiring up the last few things behind the scenes — check back soon.
          </p>
        </div>
        <Link href="/login" className="text-sm font-medium text-neutral-500 underline hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100">
          Already have an account? Log in
        </Link>
      </div>
    </main>
  );
}
