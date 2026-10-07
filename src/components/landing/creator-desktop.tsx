"use client";

import { FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoStarOutline } from "react-icons/io5";
import { FeedScopeTabs } from "@/components/feed-scope-tabs";
import { useI18n } from "@/components/i18n-provider";
import { deck } from "@/components/landing/landing-data";
import { DesktopSidebar, MacWindow } from "@/components/landing/mac-window";
import { PageTitle } from "@/components/page-title";
import { RequestDetailsPanel } from "@/components/request-details-panel";
import { SwipeCard } from "@/components/swipe-card";

// The creator's Feed on a computer, as the app draws it (swipe-card-stack.tsx): the card stack with its buttons
// on the left, the open card's details on the right. The same components, at the real size, in a Mac window
// (see MacWindow). The requests are made-up and nothing in it responds.
export function CreatorDesktop({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  // Not the phone's first card, so the two don't show the same request.
  const stack = deck(0, locale).slice(1, 4);

  return (
    <MacWindow className={className}>
      <DesktopSidebar side="creator" active="feed" />
      <div aria-hidden="true" inert className="min-w-0 flex-1 px-7 pt-7 pr-[100px]">
        <div className="flex flex-col gap-6">
          <PageTitle>{t("nav.feed")}</PageTitle>
          <div className="flex justify-center">
            <FeedScopeTabs scope="forYou" />
          </div>
          <div className="flex items-start justify-center gap-12">
            <div className="flex w-[400px] shrink-0 flex-col items-center gap-3">
              <div className="relative h-[600px] w-[400px]">
                {stack.map((request, i) => (
                  <SwipeCard key={request.id} request={request} stackIndex={i} onSwipe={() => {}} />
                ))}
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("screens.ui.leftMany", { count: 7 })}</p>
              <div className="grid w-full max-w-md grid-cols-5 items-center">
                <div />
                <span className="flex h-14 w-14 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-600 dark:text-neutral-400">
                  <FiX className="h-6 w-6" />
                </span>
                <span className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-400">
                  <IoStarOutline className="h-4 w-4" />
                </span>
                <span className="flex h-14 w-14 items-center justify-center justify-self-center rounded-full bg-ink text-paper">
                  <FiHeart className="h-6 w-6" />
                </span>
                <span className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-ink/10 text-neutral-400 opacity-40">
                  <FiRotateCcw className="h-4 w-4" />
                </span>
              </div>
            </div>
            <div className="w-full max-w-md">
              <RequestDetailsPanel request={stack[0]} />
            </div>
          </div>
        </div>
      </div>
    </MacWindow>
  );
}
