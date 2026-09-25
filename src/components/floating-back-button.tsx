"use client";

import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";

// router.back() over a plain <Link href="/dashboard/creator/discover"> —
// wherever this page was actually reached from (search results, a saved
// filter, a match) is where "back" should return to, not always the same
// hardcoded list. Needs a client component for useRouter, unlike the
// server-rendered page it sits on.
export function FloatingBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      // Same tab-bar clearance as Toaster (see toaster.tsx) — a fixed
      // bottom-right element on a route with the mobile tab bar needs the
      // same offset or it ends up half-hidden behind it.
      className="animate-pop-in fixed bottom-[calc(var(--safe-bottom)+84px)] right-4 md:bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-lg transition hover:bg-graphite no-print"
    >
      <IoArrowBack className="h-6 w-6" />
    </button>
  );
}
