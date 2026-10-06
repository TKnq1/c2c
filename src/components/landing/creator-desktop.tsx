"use client";

import { FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoStarOutline } from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { useI18n } from "@/components/i18n-provider";
import { DesktopSidebar, MacWindow } from "@/components/landing/mac-window";
import { deck } from "@/components/landing/landing-data";
import { RequestCardFace } from "@/components/request-card-face";
import { RatingSummary } from "@/components/stars";
import { categoryLabel, contentLanguageLabel, nicheLabel } from "@/lib/i18n/labels";

// The creator's Feed on a computer: the web app in a Mac window, next to the phone. The request is a made-up
// one that isn't the phone's first card, and nothing in it responds.
export function CreatorDesktop({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const request = deck(0, locale)[1];
  const rows: [string, string][] = [
    [t("screens.requests.postBy"), t("screens.requests.flexible")],
    [t("screens.requests.product"), categoryLabel(t, request.productCategory)],
    [t("screens.requests.niche"), nicheLabel(t, request.niche)],
    [t("screens.requests.language"), contentLanguageLabel(t, request.languages[0])],
    [t("screens.requests.minFollowers"), request.minFollowers.toLocaleString(locale === "de" ? "de-DE" : "en-US")],
  ];

  return (
    <MacWindow className={`h-[640px] w-[600px] xl:w-[800px] ${className}`}>
      <DesktopSidebar side="creator" active="feed" className="flex" />
      <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col px-6 pt-5 xl:pr-16">
        <p className="font-display text-[22px] font-bold">{t("nav.feed")}</p>
        <div className="mt-3 flex justify-center">
          <span className="inline-flex rounded bg-fog p-1 text-[12px]">
            <span className="rounded-[3px] bg-paper px-4 py-1 font-medium shadow-sm">{t("feed.forYou")}</span>
            <span className="px-4 py-1 text-neutral-500 dark:text-neutral-400">{t("feed.all")}</span>
          </span>
        </div>
        <div className="mt-4 flex min-h-0 flex-1 items-start justify-center gap-6">
          <div className="flex flex-col items-center">
            <div className="relative h-[352px] w-[240px] shrink-0 rounded-[26px] shadow-xl">
              <div className="flex h-full flex-col overflow-hidden rounded-[26px] bg-paper ring-1 ring-ink/10 ring-inset [clip-path:inset(0_round_26px)]">
                <RequestCardFace request={request} />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-neutral-400">{t("screens.ui.leftMany", { count: 7 })}</p>
            <div className="mt-2 flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-neutral-600 dark:text-neutral-400">
                <FiX className="h-[18px] w-[18px]" />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 text-neutral-400">
                <IoStarOutline className="h-3.5 w-3.5" />
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper">
                <FiHeart className="h-[18px] w-[18px]" />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 text-neutral-300 dark:text-neutral-600">
                <FiRotateCcw className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
          <div className="hidden w-[250px] shrink-0 flex-col gap-3 xl:flex">
            <div className="flex items-center gap-2.5">
              <Avatar src={null} name={request.companyName} size={34} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{request.companyName}</p>
                <RatingSummary average={request.rating.average} count={request.rating.count} />
              </div>
            </div>
            <p className="font-display text-[17px] leading-tight font-bold">{request.title}</p>
            <div className="rounded bg-fog px-3.5 text-[12px]">
              {rows.map(([label, value]) => (
                <p key={label} className="flex justify-between gap-3 border-ink/10 py-2 [&+&]:border-t">
                  <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
                  <span className="font-medium">{value}</span>
                </p>
              ))}
            </div>
            <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">{request.description}</p>
          </div>
        </div>
      </div>
    </MacWindow>
  );
}
