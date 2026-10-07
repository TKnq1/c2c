"use client";

import Image from "next/image";
import type { IconType } from "react-icons";
import {
  IoAdd,
  IoCardOutline,
  IoChatbubbleOutline,
  IoHeartOutline,
  IoHome,
  IoHomeOutline,
  IoNotificationsOutline,
  IoSearch,
  IoSearchOutline,
} from "react-icons/io5";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/translate";

// A Mac's window around a screen of the web app, for the hero on desktop: the three dots on the left, the
// address in the middle. The screen inside follows the visitor's light or dark mode, like the app.
export function MacTitleBar({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-11 shrink-0 items-center gap-2 border-b border-ink/10 bg-fog px-4 ${className}`}>
      <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      <span className="absolute left-1/2 -translate-x-1/2 rounded-md bg-ink/[0.06] px-14 py-1 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
        comtor.app
      </span>
    </div>
  );
}

export function MacWindow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`lp-window flex flex-col overflow-hidden rounded-[14px] bg-paper text-left text-ink ${className}`}>
      <MacTitleBar className="flex" />
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}

type Side = "creator" | "brand";
type NavKey = "requests" | "feed" | "discover" | "matches" | "messages" | "payments" | "notifications";

const NAV: Record<Side, { key: NavKey; icon: IconType; badge?: number }[]> = {
  creator: [
    { key: "feed", icon: IoHomeOutline },
    { key: "discover", icon: IoSearchOutline },
    { key: "matches", icon: IoHeartOutline },
    { key: "messages", icon: IoChatbubbleOutline, badge: 2 },
    { key: "payments", icon: IoCardOutline },
    { key: "notifications", icon: IoNotificationsOutline },
  ],
  brand: [
    { key: "requests", icon: IoHomeOutline },
    { key: "discover", icon: IoSearchOutline },
    { key: "messages", icon: IoChatbubbleOutline },
    { key: "payments", icon: IoCardOutline },
    { key: "notifications", icon: IoNotificationsOutline },
  ],
};

// The app's own sidebar at its real size (see Nav): logo, search, the sections and (for brands) New request, the
// account at the bottom. The windows scale it down with the rest of the web app. Nothing in it is a link or a button.
export function DesktopSidebar({ side, active, className = "" }: { side: Side; active: NavKey; className?: string }) {
  const { t } = useI18n();
  const name = side === "creator" ? "Mia" : t("landing.builder.brandName");
  return (
    <div aria-hidden="true" className={`w-[248px] shrink-0 flex-col border-r border-ink/10 bg-paper px-3 pt-5 pb-5 text-sm ${className}`}>
      <div className="mb-6 flex h-10 items-center px-3">
        <Image src="/logo.png" alt="" width={38} height={38} className="dark:invert" />
      </div>
      <div className="mb-4 flex h-10 items-center gap-3 rounded border border-ink/10 px-3 text-neutral-500 dark:text-neutral-400">
        <IoSearch className="h-5 w-5 shrink-0" />
        <span className="flex-1">{t("nav.search")}</span>
        <kbd className="rounded border border-ink/15 px-1.5 text-[11px]">⌘K</kbd>
      </div>
      <div className="flex flex-col gap-1">
        {NAV[side].map(({ key, icon, badge }) => {
          const on = key === active;
          const Icon = on && icon === IoHomeOutline ? IoHome : icon;
          return (
            <div key={key} className={`flex h-11 items-center gap-3.5 rounded px-3 ${on ? "bg-fog font-semibold text-ink" : "text-graphite"}`}>
              <Icon className="h-6 w-6 shrink-0" />
              <span className="flex-1">{t(`nav.${key}` as MessageKey)}</span>
              {badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-paper">{badge}</span>
              )}
            </div>
          );
        })}
      </div>
      {side === "brand" && (
        <div className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 font-medium text-paper">
          <IoAdd className="h-5 w-5" />
          {t("nav.newRequest")}
        </div>
      )}
      <div className="mt-auto flex h-12 items-center gap-3 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f43f5e] text-[13px] font-semibold text-white">{name.slice(0, 1)}</span>
        <span className="truncate font-medium">{name}</span>
      </div>
    </div>
  );
}

// The web app inside a window, drawn at a real desktop size (1280 x 800) and scaled as a whole, so the sidebar,
// the type and the cards keep the app's proportions: 52% of that from lg, 72% from xl, which leaves room for the
// phone beside it.
export const DESKTOP_SCALE = "lg:[zoom:0.52] xl:[zoom:0.72]";
