"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AppHeader, PhoneFrame } from "@/components/landing/phone-frame";
import { deck } from "@/components/landing/landing-data";
import { PlatformIcon } from "@/components/platform-icons";
import { RequestCardFace } from "@/components/request-card-face";
import { useI18n } from "@/components/i18n-provider";
import type { SignupRole } from "@/lib/signup-role";

const [, FEED_CARD] = deck(0);

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

// Two full-height halves. Each one shows the landing-page phone for that
// side, cut off so only the top half is in view. A tap continues.
export function OnboardingRoleStep({ onChoose }: { onChoose: (role: SignupRole) => void }) {
  const { t } = useI18n();
  return (
    <div className="relative left-1/2 flex w-screen min-h-0 max-w-[100vw] flex-1 -translate-x-1/2 flex-col gap-3 px-3 sm:flex-row sm:px-6">
      <Half
        onClick={() => onChoose("CREATOR")}
        tone="ink"
        title={t("screens.auth.imCreator")}
        line={t("onboarding.role.creatorLine")}
      >
        <CreatorScreen />
      </Half>
      <Half
        onClick={() => onChoose("STARTUP")}
        tone="fog"
        title={t("screens.auth.imBrand")}
        line={t("onboarding.role.brandLine")}
      >
        <BrandScreen />
      </Half>
    </div>
  );
}

const PHONE_W = 260;
const PHONE_H = 560;

function Half({
  onClick,
  tone,
  title,
  line,
  children,
}: {
  onClick: () => void;
  tone: "ink" | "fog";
  title: string;
  line: string;
  children: React.ReactNode;
}) {
  const ink = tone === "ink";
  const ref = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  // Scale of the 260×560 phone. Its top half fills the room above the label.
  const [scale, setScale] = useState(0.9);

  useLayoutEffect(() => {
    const el = ref.current;
    const label = labelRef.current;
    if (!el || !label) return;
    const measure = () => {
      const roomH = el.clientHeight - label.offsetHeight - 16;
      const roomW = el.clientWidth - 40;
      if (roomH < 80 || roomW < 80) return;
      setScale(Math.min(roomH / (PHONE_H / 2), roomW / PHONE_W));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded text-left transition ${
        ink
          ? "bg-ink text-paper hover:bg-graphite"
          : "border border-ink/10 bg-fog text-ink hover:border-ink"
      }`}
    >
      <div aria-hidden className="relative mt-auto w-full overflow-hidden" style={{ height: (PHONE_H / 2) * scale }}>
        <div
          className="absolute top-0 left-1/2 origin-top"
          style={{ width: PHONE_W, height: PHONE_H, transform: `translateX(-50%) scale(${scale})` }}
        >
          <PhoneFrame className="h-full w-full shadow-[0_40px_70px_-36px_rgb(0_0_0/0.55)]">{children}</PhoneFrame>
        </div>
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t ${ink ? "from-ink" : "from-fog"} to-transparent`} />
      </div>
      <span ref={labelRef} className="px-5 pt-4 pb-6">
        <span className="block font-display text-title-2 font-bold">{title}</span>
        <span className={`mt-1 block max-w-[24ch] text-sm ${ink ? "text-paper/80" : "text-neutral-600 dark:text-neutral-400"}`}>
          {line}
        </span>
      </span>
    </button>
  );
}

function CreatorScreen() {
  return (
    <>
      <AppHeader title="Feed" />
      <div className="relative mt-3 h-[440px]">
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-b-[28px] border border-ink/10 bg-paper shadow-xl">
          <RequestCardFace request={FEED_CARD} />
        </div>
      </div>
    </>
  );
}

function BrandScreen() {
  return (
    <>
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
    </>
  );
}
