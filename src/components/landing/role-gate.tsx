"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { haptic } from "@/lib/haptics";
import { chooseLandingRole, type LandingRole } from "@/components/landing/landing-role";
import { PHOTOS } from "@/components/landing/landing-data";

const CHOICES: { role: LandingRole; title: string; line: string; photo: string }[] = [
  { role: "creator", title: "I'm a creator", line: "Find paid brand deals", photo: PHOTOS.serum },
  { role: "brand", title: "I'm a brand", line: "Find creators for your product", photo: PHOTOS.flask },
];

// Phones only, first visit only: brand or creator, before anything else, so
// the page after it is only about that side. Hidden by CSS once a side is
// set (see landing.css), which the inline script does before paint for a
// returning visitor.
export function RoleGate() {
  const [chosen, setChosen] = useState<LandingRole | null>(null);

  function choose(role: LandingRole) {
    if (chosen) return;
    haptic();
    setChosen(role);
    // The tiles let go first (see .lp-gate.is-leaving), then the side is set
    // and the page underneath plays its entrance.
    window.setTimeout(() => chooseLandingRole(role), 650);
  }

  return (
    <div
      className={`lp-gate fixed inset-0 z-50 flex flex-col bg-paper px-4 pt-[calc(var(--safe-top)+20px)] pb-[calc(var(--safe-bottom)+16px)] md:hidden ${
        chosen ? "is-leaving" : ""
      }`}
    >
      <div className="lp-gate-head flex flex-col items-start gap-5 px-1 pb-5">
        {/* People with an account skip the question: the gate covers the
            nav, so the way to log in has to be on it. */}
        <div className="lp-rise flex w-full items-center justify-between">
          <Image src="/logo.png" alt="comtor" width={40} height={40} preload className="dark:invert" />
          <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium text-graphite transition hover:text-ink">
            Log in
          </Link>
        </div>
        <div>
          <h1 className="lp-line font-display text-large-title font-black tracking-tight">
            <span style={{ "--lp-delay": "80ms" } as React.CSSProperties}>Who are you?</span>
          </h1>
          <p className="lp-rise mt-1 text-body text-graphite" style={{ "--lp-delay": "200ms" } as React.CSSProperties}>
            So we only show you what&apos;s yours.
          </p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {CHOICES.map((c, i) => (
          <div key={c.role} className="lp-rise flex min-h-0 flex-1" style={{ "--lp-delay": `${300 + i * 120}ms` } as React.CSSProperties}>
            <button
              type="button"
              onClick={() => choose(c.role)}
              className={`lp-gate-tile relative flex flex-1 flex-col justify-end overflow-hidden rounded p-5 text-left text-white ${
                chosen === c.role ? "is-chosen" : ""
              }`}
            >
              <Image src={c.photo} alt="" fill sizes="calc(100vw - 32px)" loading="eager" className="object-cover" />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <span className="relative flex items-end justify-between gap-3">
                <span>
                  <span className="block font-display text-title-1 font-black">{c.title}</span>
                  <span className="mt-0.5 block text-body text-white/85">{c.line}</span>
                </span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black">
                  <FiArrowRight className="h-5 w-5" />
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
