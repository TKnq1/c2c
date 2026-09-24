"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import type { IconType } from "react-icons";
import { FiBell, FiHeart } from "react-icons/fi";
import {
  IoCard,
  IoCardOutline,
  IoChatbubble,
  IoChatbubbleOutline,
  IoHome,
  IoHomeOutline,
  IoSearch,
  IoSearchOutline,
  IoSettings,
  IoSettingsOutline,
} from "react-icons/io5";
import { Logo } from "@/components/logo";
import { useNavigationBlocker } from "@/lib/navigation-blocker";

const TAB_ICONS: Record<string, { outline: IconType; filled: IconType }> = {
  Requests: { outline: IoHomeOutline, filled: IoHome },
  Feed: { outline: IoHomeOutline, filled: IoHome },
  Discover: { outline: IoSearchOutline, filled: IoSearch },
  Messages: { outline: IoChatbubbleOutline, filled: IoChatbubble },
  Payments: { outline: IoCardOutline, filled: IoCard },
  Settings: { outline: IoSettingsOutline, filled: IoSettings },
};

export type NavCounts = { unreadCount: number; unreadMessages: number; pendingPayments: number };

const ZERO_COUNTS: NavCounts = { unreadCount: 0, unreadMessages: 0, pendingPayments: 0 };

// /dev-swipe-demo is a throwaway preview route (fake data, no real
// dashboard layout) that still wants the real chrome around it — see that
// file for why. Everything else that should show Nav lives under
// /dashboard.
function wantsNav(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname === "/dev-swipe-demo";
}

// Shown next to the logo on mobile, iOS-navbar-title style (see the
// text-headline size below — deliberately modest, not the big page-level
// heading size). Exact-match only — /dashboard/creator/discover/[id] falls
// through to null and shows the startup's own name instead, same as any
// other route without an entry here.
function getPageTitle(pathname: string) {
  if (pathname === "/dashboard/creator" || pathname === "/dev-swipe-demo") return "Feed";
  if (pathname === "/dashboard/creator/discover") return "Discover";
  if (pathname === "/dashboard/messages") return "Messages";
  return null;
}

// Rendered once, above PageTransition's key={pathname} div in the root
// layout (see app/layout.tsx) — not nested inside dashboard/layout.tsx
// like it used to be. That div intentionally remounts its contents on
// every navigation to retrigger the page fade-in, and Nav used to be
// inside it, so the tab bar was remounting right along with the page on
// every single navigation (visible as it jumping). Sitting above that
// boundary means Nav's own DOM never gets torn down; it just fetches its
// role and badge counts client-side (dashboard/layout.tsx no longer has a
// way to hand them down as props from up here) and updates in place.
export function Nav() {
  const pathname = usePathname();
  const { isBlocked } = useNavigationBlocker();
  const [role, setRole] = useState<Role | null>(null);
  const [counts, setCounts] = useState<NavCounts>(ZERO_COUNTS);

  const showNav = wantsNav(pathname);

  // dashboard-shell (see globals.css) locks the body to one viewport tall
  // with internal scroll only, which is what lets the Feed page opt out of
  // page-level scroll entirely. Every other route keeps normal document
  // scroll. Nav is the one thing that's always mounted and already knows
  // which kind of route this is, so it owns the toggle — useLayoutEffect,
  // not useEffect, so it lands before paint instead of after.
  useLayoutEffect(() => {
    document.body.classList.toggle("dashboard-shell", showNav);
  }, [showNav]);

  useEffect(() => {
    if (!showNav) return;
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRole(data?.user?.role ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [showNav]);

  useEffect(() => {
    if (!showNav) return;
    let cancelled = false;
    fetch("/api/nav-counts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setCounts(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [showNav, pathname]);

  const onNavigate = (e: { preventDefault: () => void }) => {
    if (isBlocked && !window.confirm("You have unsaved changes. Leave without saving?")) {
      e.preventDefault();
    }
  };

  if (!showNav || !role) return null;

  const { unreadCount, unreadMessages, pendingPayments } = counts;
  const base = role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator";

  const links =
    role === "STARTUP"
      ? [
          { href: "/dashboard/startup", label: "Requests", badge: 0 },
          { href: "/dashboard/startup/discover", label: "Discover", badge: 0 },
          { href: "/dashboard/messages", label: "Messages", badge: unreadMessages },
          { href: "/dashboard/startup/payments", label: "Payments", badge: 0 },
          { href: "/dashboard/startup/settings", label: "Settings", badge: 0 },
        ]
      : [
          { href: "/dashboard/creator", label: "Feed", badge: 0 },
          { href: "/dashboard/creator/discover", label: "Discover", badge: 0 },
          { href: "/dashboard/messages", label: "Messages", badge: unreadMessages },
          { href: "/dashboard/creator/payments", label: "Payments", badge: pendingPayments },
          { href: "/dashboard/creator/settings", label: "Settings", badge: 0 },
        ];

  // Longest href wins so e.g. /dashboard/startup/discover/xyz matches
  // "Discover" rather than falling through to the more general "Requests"
  // (/dashboard/startup), which still needs to catch routes like
  // /dashboard/startup/requests/[id] and /dashboard/startup/new.
  const activeHref = [...links]
    .sort((a, b) => b.href.length - a.href.length)
    .find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))?.href;

  // Hidden on mobile while a chat thread is open — that view already fights
  // for vertical space, and the nav isn't reachable from there anyway (the
  // thread has its own "← Messages" back link). Left alone on desktop,
  // which was never cramped in the first place.
  const hideOnMobile = pathname.startsWith("/dashboard/messages/");
  const pageTitle = getPageTitle(pathname);
  // Matches heart doesn't belong on the Messages pages — you're either
  // already in a conversation or browsing your inbox, not looking to match.
  const hideMatchesLink = pathname.startsWith("/dashboard/messages");

  return (
    <>
      <header
        className={`border-b border-ink/10 pt-[env(safe-area-inset-top)] no-print ${hideOnMobile ? "hidden md:block" : ""}`}
      >
        <div className="relative max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <Link href={base} onNavigate={onNavigate} className="shrink-0">
            <Logo />
          </Link>
          {pageTitle && (
            // Centered on the bar itself, not just in the leftover space
            // next to the logo — absolute + left-1/2/-translate-x-1/2 so
            // it's dead-center regardless of how wide the logo or the
            // icons on the other side are, instead of drifting off-center
            // the way it would inside the same flex row as either side.
            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-headline font-bold md:hidden">
              {pageTitle}
            </span>
          )}

          <nav aria-label="Main" className="hidden md:flex items-center gap-5 text-sm text-graphite">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onNavigate={onNavigate}
                // Every one of these sits in the viewport on every dashboard
                // page, so default (viewport-triggered) prefetch was firing
                // all of them at once on every render — each one a full
                // server render with its own DB queries, not a free/static
                // fetch. These are deliberate destinations someone clicks,
                // not hover targets worth prefetching speculatively.
                prefetch={false}
                aria-current={l.href === activeHref ? "page" : undefined}
                className={`flex items-center gap-1.5 transition hover:text-ink ${
                  l.href === activeHref ? "text-ink" : ""
                }`}
              >
                {l.label}
                {l.badge > 0 && <NavBadge count={l.badge} />}
              </Link>
            ))}
            {role === "CREATOR" && !hideMatchesLink && <MatchesLink onNavigate={onNavigate} />}
            <NotificationsLink unreadCount={unreadCount} onNavigate={onNavigate} />
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            {role === "CREATOR" && !hideMatchesLink && <MatchesLink onNavigate={onNavigate} />}
            <NotificationsLink unreadCount={unreadCount} onNavigate={onNavigate} />
          </div>
        </div>
      </header>

      {/* Bottom tab bar — mobile only. Every destination is one tap away,
          app-style, instead of behind a hamburger drawer. */}
      <nav
        aria-label="Main"
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 rounded-t-[20px] border-t border-ink/10 bg-background pb-[max(env(safe-area-inset-bottom),8px)] no-print ${
          hideOnMobile ? "hidden" : ""
        }`}
      >
        <div className="flex items-stretch">
          {links.map((l) => {
            const icons = TAB_ICONS[l.label] ?? { outline: IoSearchOutline, filled: IoSearch };
            const isActive = l.href === activeHref;
            const Outline = icons.outline;
            const Filled = icons.filled;
            return (
              <Link
                key={l.href}
                href={l.href}
                onNavigate={onNavigate}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                aria-label={l.label}
                className={`flex flex-1 items-center justify-center pt-3 pb-2 transition ${
                  isActive ? "text-ink" : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {/* Two stacked icons cross-fading, not a conditional swap —
                    swapping which component renders would remount the SVG
                    and skip the transition entirely, so both stay mounted
                    and only opacity/scale move. */}
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <Outline
                    className={`absolute inset-0 h-6 w-6 transition duration-150 ease-out active:scale-90 ${
                      isActive ? "scale-75 opacity-0" : "scale-100 opacity-100"
                    }`}
                  />
                  <Filled
                    className={`absolute inset-0 h-6 w-6 transition duration-150 ease-out active:scale-90 ${
                      isActive ? "scale-110 opacity-100" : "scale-75 opacity-0"
                    }`}
                  />
                  {l.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-ink px-0.5 text-[9px] font-semibold text-paper">
                      {l.badge > 9 ? "9+" : l.badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function NavBadge({ count }: { count: number }) {
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-ink px-1 text-[10px] font-medium text-paper">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function MatchesLink({ onNavigate }: { onNavigate: (e: { preventDefault: () => void }) => void }) {
  return (
    <Link
      href="/dashboard/creator/matches"
      onNavigate={onNavigate}
      prefetch={false}
      className="flex items-center text-graphite hover:text-ink transition"
      aria-label="Your matches"
    >
      <FiHeart className="h-5 w-5 md:h-4 md:w-4" />
    </Link>
  );
}

function NotificationsLink({
  unreadCount,
  onNavigate,
}: {
  unreadCount: number;
  onNavigate: (e: { preventDefault: () => void }) => void;
}) {
  return (
    <Link
      href="/dashboard/notifications"
      onNavigate={onNavigate}
      prefetch={false}
      className="relative flex items-center text-graphite hover:text-ink transition"
      aria-label="Notifications"
    >
      <FiBell className="h-5 w-5 md:h-4 md:w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-ink px-0.5 text-[10px] font-medium text-paper">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
