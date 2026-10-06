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

// The app's own sidebar, drawn small: logo, search, the sections and (for brands) New request, the account at
// the bottom. Nothing in it is a link or a button.
export function DesktopSidebar({ side, active, className = "" }: { side: Side; active: NavKey; className?: string }) {
  const { t } = useI18n();
  const name = side === "creator" ? "Mia" : t("landing.builder.brandName");
  return (
    <div
      aria-hidden="true"
      className={`w-[188px] shrink-0 flex-col border-r border-ink/10 bg-paper px-3 pt-4 pb-3 text-[13px] ${className}`}
    >
      <Image src="/logo.png" alt="" width={28} height={28} className="mb-4 ml-2 dark:invert" />
      <div className="mb-3 flex h-9 items-center gap-2.5 rounded border border-ink/10 px-2.5 text-neutral-500 dark:text-neutral-400">
        <IoSearch className="h-4 w-4 shrink-0" />
        <span className="flex-1">{t("nav.search")}</span>
        <kbd className="rounded border border-ink/15 px-1 text-[10px]">⌘K</kbd>
      </div>
      <div className="flex flex-col gap-0.5">
        {NAV[side].map(({ key, icon, badge }) => {
          const on = key === active;
          const Icon = on && icon === IoHomeOutline ? IoHome : icon;
          return (
            <div
              key={key}
              className={`flex h-9 items-center gap-3 rounded px-2.5 ${on ? "bg-fog font-semibold text-ink" : "text-neutral-500 dark:text-neutral-400"}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{t(`nav.${key}` as MessageKey)}</span>
              {badge && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">
                  {badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {side === "brand" && (
        <div className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-full bg-ink font-medium text-paper">
          <IoAdd className="h-4 w-4" />
          {t("nav.newRequest")}
        </div>
      )}
      <div className="mt-auto flex items-center gap-2.5 px-1.5 pt-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f43f5e] text-[11px] font-semibold text-white">
          {name.slice(0, 1)}
        </span>
        <span className="truncate font-medium">{name}</span>
      </div>
    </div>
  );
}
