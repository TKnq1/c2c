"use client";

import { useState } from "react";
import Image from "next/image";
import { FiCheck, FiHeart, FiX } from "react-icons/fi";
import { useI18n } from "@/components/i18n-provider";
import { RequestCardFace, type CardRequest } from "@/components/request-card-face";
import { PlatformIcon } from "@/components/platform-icons";
import { Switch } from "@/components/switch";
import { formatBudget } from "@/lib/format";
import { presetLabel } from "@/lib/i18n/labels";
import { AppHeader, AppTabBar, PhoneFrame } from "@/components/landing/phone-frame";
import { PHOTOS, cardPhoto, type PhotoKey } from "@/components/landing/landing-data";

const PHOTO_CHOICES: PhotoKey[] = ["flask", "serum", "tote"];
const PLATFORMS = ["Instagram", "TikTok", "YouTube"] as const;
type Platform = (typeof PLATFORMS)[number];
// The same one-tap presets as the app's New request form.
const CONTENT: Record<Platform, string[]> = {
  Instagram: ["1 Reel", "1 Reel + 2 Stories", "3 Stories"],
  TikTok: ["1 Video", "2 Videos"],
  YouTube: ["1 Short", "1 Video", "1 Integration"],
};

// A brand's New request, cut down to what changes the card: whatever is
// set here shows on the card the way creators will see it in their Feed.
// On phones the card sits right above the controls; from lg up it's in a
// phone next to them. The chosen photo colours the hero (onPhoto).
export function BrandBuilder({ onPhoto }: { onPhoto: (photo: PhotoKey) => void }) {
  const { locale, t } = useI18n();
  const [photo, setPhoto] = useState<PhotoKey>("flask");
  const [title, setTitle] = useState(() => t("landing.builder.defaultTitle"));
  const [budget, setBudget] = useState(300);
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [content, setContent] = useState("1 Reel");
  const [productIncluded, setProductIncluded] = useState(true);

  const request: CardRequest = {
    title: title.trim() || t("landing.builder.fallbackTitle"),
    description: "",
    niche: "Beauty",
    languages: [locale === "de" ? "German" : "English"],
    minFollowers: 1000,
    productCategory: "Cosmetics",
    companyName: t("landing.builder.brandName"),
    companyAvatarUrl: null,
    rating: { average: 0, count: 0 },
    photos: [cardPhoto(photo)],
    budgetMinCents: budget * 100,
    budgetMaxCents: budget * 100,
    platform,
    deliverables: content,
    postBy: null,
    productIncluded,
  };

  const card = (
    <div className="absolute inset-0 rounded-b-[28px] text-left shadow-xl">
      <div className="flex h-full flex-col overflow-hidden rounded-b-[28px] bg-paper ring-1 ring-ink/10 ring-inset [clip-path:inset(0_round_0_0_28px_28px)]">
        <RequestCardFace request={request} />
      </div>
    </div>
  );

  return (
    <div className="flex w-full flex-col items-center lg:flex-row lg:items-center lg:justify-center lg:gap-16">
      {/* Phones: the top of the phone, down to the card's bottom edge, then
          fading out under the controls, so the card and what changes it
          fit on one screen. */}
      <div className="lp-phone-crop relative h-[540px] w-full max-w-[350px] overflow-hidden px-5 pt-2 lg:hidden">
        <PhoneFrame className="h-[640px] w-full">
          <AppHeader title={t("nav.feed")} />
          <div className="relative mt-3 h-[380px] shrink-0">{card}</div>
        </PhoneFrame>
      </div>

      <div className="relative z-10 order-last -mt-8 w-full max-w-[360px] lg:order-none lg:mt-0">
        <div className="flex flex-col gap-5 rounded border border-ink/10 bg-paper/85 p-5 text-left shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lp-title" className="text-sm font-medium">
              {t("landing.builder.title")}
            </label>
            <input
              id="lp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2.5 text-base md:text-sm dark:border-neutral-700"
            />
          </div>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">{t("landing.builder.photo")}</legend>
            <div className="flex gap-2">
              {PHOTO_CHOICES.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setPhoto(key);
                    onPhoto(key);
                  }}
                  aria-label={t("landing.builder.usePhoto", { n: PHOTO_CHOICES.indexOf(key) + 1 })}
                  aria-pressed={photo === key}
                  className={`relative h-14 w-14 overflow-hidden rounded transition ${
                    photo === key ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={PHOTOS[key]} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="lp-budget" className="text-sm font-medium">
                {t("landing.builder.budget")}
              </label>
              <span className="font-display text-title-3 font-black tabular-nums">{formatBudget(budget * 100, budget * 100)}</span>
            </div>
            <input
              id="lp-budget"
              type="range"
              min={50}
              max={1500}
              step={10}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-ink"
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("landing.builder.platform")}</legend>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlatform(p);
                    setContent(CONTENT[p][0]);
                  }}
                  aria-pressed={platform === p}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                    platform === p ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink"
                  }`}
                >
                  <PlatformIcon platform={p} mono className="h-3.5 w-3.5" />
                  {p}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("landing.builder.content")}</legend>
            <div className="flex flex-wrap gap-2">
              {CONTENT[platform].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setContent(c)}
                  aria-pressed={content === c}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${
                    content === c ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink"
                  }`}
                >
                  {content === c && <FiCheck className="h-3.5 w-3.5" />}
                  {presetLabel(t, c)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("landing.builder.productIncluded")}</span>
            <Switch checked={productIncluded} onChange={setProductIncluded} label={t("landing.builder.productIncluded")} />
          </div>
        </div>
      </div>

      {/* From lg: the card in a phone, in the Feed, as creators get it. */}
      <div className="relative hidden lg:block">
        <p className="mb-4 text-center text-sm font-medium text-graphite">{t("landing.builder.whatCreatorsSee")}</p>
        <PhoneFrame className="h-[660px] w-[320px]">
          <AppHeader title={t("nav.feed")} />
          <div className="relative mt-3 flex-1">{card}</div>
          <div aria-hidden="true" className="grid shrink-0 grid-cols-5 items-center py-3">
            <span />
            <span className="flex h-12 w-12 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-600 dark:text-neutral-400">
              <FiX className="h-5 w-5" />
            </span>
            <span />
            <span className="flex h-12 w-12 items-center justify-center justify-self-center rounded-full bg-ink text-paper">
              <FiHeart className="h-5 w-5" />
            </span>
            <span />
          </div>
          <AppTabBar />
        </PhoneFrame>
      </div>
    </div>
  );
}
