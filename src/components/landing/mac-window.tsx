"use client";

import type { IconType } from "react-icons";
import { FiChevronDown } from "react-icons/fi";
import {
  IoAdd,
  IoCard,
  IoCardOutline,
  IoChatbubbleOutline,
  IoHeartOutline,
  IoHome,
  IoNotificationsOutline,
  IoSearch,
  IoSearchOutline,
} from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { useI18n } from "@/components/i18n-provider";
import { Logo } from "@/components/logo";
import type { MessageKey } from "@/lib/i18n/translate";

// A Mac's window around a page of the web app, for the hero on desktop: the three dots on the left, the address
// in the middle.
//
// The page inside is laid out at the size it really has on a computer (1280 px wide, VIEW_HEIGHT tall) and
// shrunk with CSS zoom to fit the window, so it is the app's own layout, not a redrawn copy: the same
// components, the same type sizes, the same spacing. Both sides of the landing page use the same window.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 960;

export function MacTitleBar() {
  return (
    <div aria-hidden="true" className="relative flex h-11 shrink-0 items-center gap-2 border-b border-ink/10 bg-fog px-4">
      <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      <span className="absolute left-1/2 -translate-x-1/2 rounded-md bg-ink/[0.06] px-14 py-1 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
        comtor.app
      </span>
    </div>
  );
}

// 44px of title bar plus the page at 55% (704 px wide) on small desktops and 62.5% (800 px) from xl up.
export function MacWindow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`lp-window relative flex h-[572px] w-[704px] flex-col overflow-hidden rounded-[14px] bg-background text-left text-ink xl:h-[644px] xl:w-[800px] ${className}`}
    >
      <MacTitleBar />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="absolute top-0 left-0 flex bg-background [zoom:0.55] xl:[zoom:0.625]"
          style={{ width: VIEW_WIDTH, height: VIEW_HEIGHT }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

type Side = "creator" | "brand";
type NavKey = "requests" | "feed" | "discover" | "matches" | "messages" | "payments" | "notifications";

const NAV: Record<Side, { key: NavKey; icon: IconType; filled?: IconType; badge?: number }[]> = {
  creator: [
    { key: "feed", icon: IoHome },
    { key: "discover", icon: IoSearchOutline },
    { key: "matches", icon: IoHeartOutline },
    { key: "messages", icon: IoChatbubbleOutline, badge: 2 },
    { key: "payments", icon: IoCardOutline, filled: IoCard, badge: 1 },
    { key: "notifications", icon: IoNotificationsOutline },
  ],
  brand: [
    { key: "requests", icon: IoHome },
    { key: "discover", icon: IoSearchOutline },
    { key: "messages", icon: IoChatbubbleOutline },
    { key: "payments", icon: IoCardOutline },
    { key: "notifications", icon: IoNotificationsOutline },
  ],
};

// The app's own sidebar at its real size (nav.tsx): logo, search, the sections, New request for brands, the
// account at the bottom. Nothing in it is a link or a button.
export function DesktopSidebar({ side, active }: { side: Side; active: NavKey }) {
  const { t } = useI18n();
  const name = side === "creator" ? "Mia Summers" : t("landing.builder.brandName");
  return (
    <div aria-hidden="true" className="flex h-full w-[248px] shrink-0 flex-col border-r border-ink/10 bg-background px-3 pt-5 pb-5">
      <div className="mb-6 flex h-10 shrink-0 items-center px-3">
        <Logo />
      </div>
      <div className="mb-4 flex h-10 shrink-0 items-center gap-3 rounded border border-ink/10 px-3 text-sm text-neutral-500 dark:text-neutral-400">
        <IoSearch className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{t("nav.search")}</span>
        <kbd className="rounded border border-ink/15 px-1.5 text-[11px]">⌘K</kbd>
      </div>
      <div className="flex flex-col gap-1">
        {NAV[side].map(({ key, icon, badge }) => {
          const on = key === active;
          const Icon = icon;
          return (
            <div
              key={key}
              className={`flex h-11 items-center gap-3.5 rounded px-3 text-sm ${on ? "bg-fog font-semibold text-ink" : "text-graphite"}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                <Icon className="h-6 w-6" />
              </span>
              <span className="flex-1">{t(`nav.${key}` as MessageKey)}</span>
              {badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-paper">
                  {badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {side === "brand" && (
        <div className="mt-5 flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-paper">
          <IoAdd className="h-5 w-5" />
          {t("nav.newRequest")}
        </div>
      )}
      <div className="mt-auto flex items-center gap-3 rounded px-3 py-2 text-sm">
        <Avatar src={null} name={name} size={32} />
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        <FiChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
      </div>
    </div>
  );
}
