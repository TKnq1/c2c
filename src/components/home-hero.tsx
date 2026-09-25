"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { AuthPanel } from "@/components/auth-panel";
import { PhoneMockup } from "@/components/phone-mockup";
import { ImprintLink } from "@/components/imprint-link";
import { type SignupRole } from "@/components/signup-form";
import { RELEASE_REVIEW_DAYS } from "@/lib/constants";

const COPY: Record<SignupRole, { headline: string; body: string }> = {
  STARTUP: {
    headline: "Find the right creator. Pay only when the work is live.",
    body: "C2C matches brands with creators by niche and reach, then holds every payment in escrow until the collab is posted and you've approved it.",
  },
  CREATOR: {
    headline: "Find brand collabs that fit you. Get paid for what you post.",
    body: `C2C matches you with brands by niche and reach, then holds every payment safely in escrow — released to you once the brand approves your post, or automatically after ${RELEASE_REVIEW_DAYS} days.`,
  },
};

export function HomeHero() {
  const [role, setRole] = useState<SignupRole>("STARTUP");
  const copy = COPY[role];

  return (
    <main className="flex-1 grid lg:grid-cols-2">
      <div className="flex flex-col items-center text-center gap-8 px-6 pt-16 lg:pt-24">
        <div className="max-w-md flex flex-col items-center gap-6">
          <Logo />

          <div className="flex flex-col gap-4">
            <h1 className="font-display text-3xl md:text-4xl font-normal">{copy.headline}</h1>
            <p className="text-neutral-600 dark:text-neutral-400">{copy.body}</p>
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 m-auto h-[280px] w-[280px] lg:h-[360px] lg:w-[360px] rounded-full bg-stone/25 blur-[70px]"
          />
          <div className="relative w-[220px] lg:w-[280px] h-[390px] lg:h-[440px] overflow-hidden">
            <PhoneMockup role={role} className="absolute top-0 left-0 w-full" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16 lg:py-24">
        <AuthPanel role={role} onRoleChange={setRole} />
      </div>

      <ImprintLink />
    </main>
  );
}
