"use client";

import { FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoStarOutline } from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { useI18n } from "@/components/i18n-provider";
import { DESKTOP_SCALE, DesktopSidebar, MacWindow } from "@/components/landing/mac-window";
import { deck } from "@/components/landing/landing-data";
import { RequestCardFace, RequestFacts } from "@/components/request-card-face";
import { RatingSummary } from "@/components/stars";

// The creator's Feed on a computer: the web app in a Mac window, next to the phone, laid out as the app is at
// 1280 x 800 (sidebar, the 400px card at 70% of the height, the details next to it) and scaled as a whole. The
// request is a made-up one that isn't the phone's first card, and nothing in it responds.
export function CreatorDesktop({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const request = deck(0, locale)[1];

  return (
    <MacWindow className={className}>
      <div aria-hidden="true" className={`flex h-[800px] w-[1280px] ${DESKTOP_SCALE}`}>
        <DesktopSidebar side="creator" active="feed" className="flex" />
        <div className="min-w-0 flex-1 px-6 pt-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <p className="font-display text-title-1 font-bold">{t("nav.feed")}</p>
            <div className="flex justify-center">
              <span className="grid grid-cols-2 rounded bg-fog p-1 text-sm font-medium">
                <span className="rounded bg-white px-5 py-1.5 text-center text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100">
                  {t("feed.forYou")}
                </span>
                <span className="px-5 py-1.5 text-center text-neutral-500 dark:text-neutral-400">{t("feed.all")}</span>
              </span>
            </div>
            <div className="flex items-start justify-center gap-12">
              <div className="flex w-[400px] shrink-0 flex-col items-center gap-3">
                <div className="relative h-[560px] w-full rounded-[28px] shadow-xl">
                  <div className="flex h-full flex-col overflow-hidden rounded-[28px] bg-paper ring-1 ring-ink/10 ring-inset [clip-path:inset(0_round_28px)]">
                    <RequestCardFace request={request} />
                  </div>
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("screens.ui.leftMany", { count: 7 })}</p>
                <div className="grid w-full grid-cols-5 items-center">
                  <span />
                  <span className="flex h-14 w-14 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-600 dark:text-neutral-400">
                    <FiX className="h-6 w-6" />
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-400">
                    <IoStarOutline className="h-4 w-4" />
                  </span>
                  <span className="flex h-14 w-14 items-center justify-center justify-self-center rounded-full bg-ink text-paper">
                    <FiHeart className="h-6 w-6" />
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-300 dark:text-neutral-600">
                    <FiRotateCcw className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <div className="flex w-full max-w-md min-w-0 flex-col gap-5">
                <div className="flex items-center gap-3">
                  <Avatar src={null} name={request.companyName} size={44} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{request.companyName}</span>
                    <RatingSummary average={request.rating.average} count={request.rating.count} />
                  </span>
                </div>
                <p className="font-display text-title-2 font-bold text-balance">{request.title}</p>
                <RequestFacts request={request} />
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{request.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MacWindow>
  );
}
