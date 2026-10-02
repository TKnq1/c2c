import Image from "next/image";
import { FiBell, FiHeart } from "react-icons/fi";
import { IoCardOutline, IoChatbubbleOutline, IoHome, IoSearchOutline, IoSettingsOutline } from "react-icons/io5";

// A phone drawn in CSS around a screen of the real app. The screen follows
// the visitor's light or dark mode, the same as the app itself would.
export function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`lp-phone relative shrink-0 rounded-[3rem] bg-[#0c0c0d] p-[9px] ${className}`}>
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.45rem] bg-paper text-left text-ink">
        <StatusBar />
        {children}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute top-[18px] left-1/2 z-30 h-[24px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
    </div>
  );
}

// 11:11, as in the launch video.
function StatusBar() {
  return (
    <div aria-hidden="true" className="flex h-11 shrink-0 items-center justify-between px-7 pt-1 text-[13px] font-bold">
      <span>11:11</span>
      <span className="flex items-center gap-1">
        <svg viewBox="0 0 18 12" className="h-[11px] w-auto" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12" className="h-[11px] w-auto" fill="currentColor">
          <path d="M8 2.2c2.4 0 4.6.9 6.2 2.5l1.3-1.3A10.6 10.6 0 0 0 8 .3 10.6 10.6 0 0 0 .5 3.4l1.3 1.3A8.7 8.7 0 0 1 8 2.2Zm0 3.7c1.4 0 2.7.5 3.6 1.4l1.3-1.3A7 7 0 0 0 8 4a7 7 0 0 0-4.9 2l1.3 1.3c1-.9 2.2-1.4 3.6-1.4Zm0 3.6c.5 0 .9.2 1.2.5L8 11.2 6.8 10c.3-.3.7-.5 1.2-.5Z" />
        </svg>
        <svg viewBox="0 0 27 13" className="h-[12px] w-auto" fill="none">
          <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" />
          <path d="M24.5 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

// The app's own header: logo, the screen's name, matches and notifications.
export function AppHeader({ title }: { title: string }) {
  return (
    <div className="relative flex shrink-0 items-center justify-between border-b border-ink/10 px-4 pb-2.5">
      <Image src="/logo.png" alt="" width={28} height={28} className="dark:invert" />
      <span className="absolute left-1/2 -translate-x-1/2 font-display text-headline font-bold">{title}</span>
      <span className="flex items-center gap-3 text-graphite">
        <FiHeart className="h-[18px] w-[18px]" />
        <FiBell className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}

const TABS = [IoHome, IoSearchOutline, IoChatbubbleOutline, IoCardOutline, IoSettingsOutline];

// The app's tab bar, Feed (home) selected.
export function AppTabBar() {
  return (
    <div aria-hidden="true" className="mt-auto shrink-0 rounded-t-[18px] border-t border-ink/10 bg-paper pb-5">
      <div className="flex">
        {TABS.map((Icon, i) => (
          <span key={i} className={`flex flex-1 justify-center pt-2.5 pb-1 ${i === 0 ? "text-ink" : "text-neutral-400 dark:text-neutral-500"}`}>
            <Icon className="h-[22px] w-[22px]" />
          </span>
        ))}
      </div>
      <div className="mx-auto mt-2 h-[4px] w-[110px] rounded-full bg-ink/80" />
    </div>
  );
}
