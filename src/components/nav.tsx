"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import type { IconType } from "react-icons";
import { FiBell, FiHeart } from "react-icons/fi";
import {
  IoAdd,
  IoCard,
  IoCardOutline,
  IoChatbubble,
  IoChatbubbleOutline,
  IoHeart,
  IoHeartOutline,
  IoHome,
  IoHomeOutline,
  IoNotifications,
  IoNotificationsOutline,
  IoSearch,
  IoSearchOutline,
  IoSettings,
  IoSettingsOutline,
  IoShieldCheckmark,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { Logo } from "@/components/logo";
import { useNavigationBlocker } from "@/lib/navigation-blocker";
import { isTextField, resetPageScroll } from "@/lib/keyboard";

const TAB_ICONS: Record<string, { outline: IconType; filled: IconType }> = {
  Requests: { outline: IoHomeOutline, filled: IoHome },
  Feed: { outline: IoHomeOutline, filled: IoHome },
  Discover: { outline: IoSearchOutline, filled: IoSearch },
  Messages: { outline: IoChatbubbleOutline, filled: IoChatbubble },
  Payments: { outline: IoCardOutline, filled: IoCard },
  Settings: { outline: IoSettingsOutline, filled: IoSettings },
  Matches: { outline: IoHeartOutline, filled: IoHeart },
  Notifications: { outline: IoNotificationsOutline, filled: IoNotifications },
  Admin: { outline: IoShieldCheckmarkOutline, filled: IoShieldCheckmark },
};

type NavLink = { href: string; label: string; badge: number };

// Longest href wins so e.g. /dashboard/startup/discover/xyz matches
// "Discover" rather than falling through to the more general "Requests"
// (/dashboard/startup), which still needs to catch routes like
// /dashboard/startup/requests/[id] and /dashboard/startup/new.
function activeHrefFor(links: NavLink[], pathname: string) {
  return [...links]
    .sort((a, b) => b.href.length - a.href.length)
    .find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))?.href;
}

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
  if (pathname === "/dashboard/creator/payments" || pathname === "/dashboard/startup/payments") return "Payments";
  if (pathname === "/dashboard/startup/new") return "New request";
  if (/^\/dashboard\/startup\/requests\/[^/]+\/edit$/.test(pathname)) return "Edit request";
  if (pathname === "/dashboard/creator/settings" || pathname === "/dashboard/startup/settings") return "Settings";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [counts, setCounts] = useState<NavCounts>(ZERO_COUNTS);
  // Bumped by a pull to refresh (see PullToRefresh), so the badges come
  // along with the page.
  const [countsVersion, setCountsVersion] = useState(0);

  const showNav = wantsNav(pathname);

  // dashboard-shell (see globals.css) pins the body to the screen with
  // internal scroll only — no page underneath for iOS to move, and what lets
  // the Feed page opt out of page-level scroll entirely. Every other route
  // keeps normal document scroll. Nav is the one thing that's always
  // mounted and already knows which kind of route this is, so it owns the
  // toggle — useLayoutEffect, not useEffect, so it lands before paint
  // instead of after.
  useLayoutEffect(() => {
    document.body.classList.toggle("dashboard-shell", showNav);
  }, [showNav]);

  // iOS scrolls the whole page to bring a focused field above the keyboard
  // (it doesn't resize the page — see ChatViewport) and doesn't always
  // scroll it back once the keyboard is gone, leaving everything — the
  // fixed tab bar included — shifted up until a few taps nudge it down.
  // Dashboard pages never scroll at the page level, so whatever's left
  // once no field has focus is put back. Deferred a frame: focus moves
  // before the keyboard has finished closing.
  useEffect(() => {
    if (!showNav) return;
    const vv = window.visualViewport;
    const settle = () =>
      requestAnimationFrame(() => {
        if (!isTextField(document.activeElement)) resetPageScroll();
      });
    document.addEventListener("focusout", settle);
    vv?.addEventListener("resize", settle);
    return () => {
      document.removeEventListener("focusout", settle);
      vv?.removeEventListener("resize", settle);
    };
  }, [showNav]);

  useEffect(() => {
    if (!showNav) return;
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setRole(data?.user?.role ?? null);
        setIsAdmin(data?.user?.isAdmin === true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [showNav]);

  useEffect(() => {
    const refetch = () => setCountsVersion((v) => v + 1);
    window.addEventListener("nav-counts:refresh", refetch);
    return () => window.removeEventListener("nav-counts:refresh", refetch);
  }, []);

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
  }, [showNav, pathname, countsVersion]);

  const onNavigate = (e: { preventDefault: () => void }) => {
    if (isBlocked && !window.confirm("You have unsaved changes. Leave without saving?")) {
      e.preventDefault();
    }
  };

  if (!showNav || !role) return null;

  const { unreadCount, unreadMessages, pendingPayments } = counts;
  const base = role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator";

  const links: NavLink[] =
    role === "STARTUP"
      ? [
          { href: "/dashboard/startup", label: "Requests", badge: 0 },
          { href: "/dashboard/startup/discover", label: "Discover", badge: 0 },
          { href: "/dashboard/messages", label: "Messages", badge: unreadMessages },
          { href: "/dashboard/startup/payments", label: "Payments", badge: pendingPayments },
          { href: "/dashboard/startup/settings", label: "Settings", badge: 0 },
        ]
      : [
          { href: "/dashboard/creator", label: "Feed", badge: 0 },
          { href: "/dashboard/creator/discover", label: "Discover", badge: 0 },
          { href: "/dashboard/messages", label: "Messages", badge: unreadMessages },
          { href: "/dashboard/creator/payments", label: "Payments", badge: pendingPayments },
          { href: "/dashboard/creator/settings", label: "Settings", badge: 0 },
        ];

  const activeHref = activeHrefFor(links, pathname);

  // Hidden on mobile while a chat thread is open — that view already fights
  // for vertical space, and the nav isn't reachable from there anyway (the
  // thread has its own "← Messages" back link). Left alone on desktop,
  // which was never cramped in the first place.
  const hideOnMobile = pathname.startsWith("/dashboard/messages/");
  const pageTitle = getPageTitle(pathname);
  // The heart is the way into Your matches, so it only shows where you're
  // doing the matching — the Feed you swipe in, and Discover. On Messages,
  // Payments, Settings or the matches page itself it was just clutter.
  const showMatchesLink =
    role === "CREATOR" &&
    (pathname === "/dashboard/creator" || pathname === "/dashboard/creator/discover" || pathname === "/dev-swipe-demo");

  return (
    <>
      {/* Phones only: it floats over <main>, which runs up under it (see
          --header-h in globals.css), so the page scrolls on under the
          frosted bar the way it does in an iOS app. From md up the
          sidebar below takes its place. */}
      <header
        className={`app-header fixed inset-x-0 top-0 z-30 border-b border-ink/10 bg-background/80 pt-[var(--safe-top)] backdrop-blur-xl backdrop-saturate-150 no-print md:hidden ${hideOnMobile ? "hidden" : ""}`}
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
            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-headline font-bold">
              {pageTitle}
            </span>
          )}

          <div className="flex items-center gap-4">
            {showMatchesLink && <MatchesLink onNavigate={onNavigate} />}
            <NotificationsLink unreadCount={unreadCount} onNavigate={onNavigate} />
          </div>
        </div>
      </header>

      <Sidebar
        role={role}
        isAdmin={isAdmin}
        base={base}
        pathname={pathname}
        links={links}
        unreadCount={unreadCount}
        onNavigate={onNavigate}
      />

      {/* Bottom tab bar — mobile only. Every destination is one tap away,
          app-style, instead of behind a hamburger drawer. Frosted like the
          header: the page scrolls on underneath it. */}
      <nav
        aria-label="Main"
        className={`app-tabbar md:hidden fixed inset-x-0 bottom-0 z-40 rounded-t-[20px] border-t border-ink/10 bg-background/80 pb-[var(--bar-bottom)] backdrop-blur-xl backdrop-saturate-150 no-print ${
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

// Desktop navigation, from md up: a fixed column on the left, icons only on
// tablets and icons with labels from lg (its width is --sidebar-w, which
// also offsets the page, see globals.css). The same destinations and icons
// as the phone tab bar, plus the ones the phone header carries (matches,
// notifications) and, for brands, the main action.
function Sidebar({
  role,
  isAdmin,
  base,
  pathname,
  links,
  unreadCount,
  onNavigate,
}: {
  role: Role;
  isAdmin: boolean;
  base: string;
  pathname: string;
  links: NavLink[];
  unreadCount: number;
  onNavigate: (e: { preventDefault: () => void }) => void;
}) {
  const [home, discover, ...rest] = links.filter((l) => l.label !== "Settings");
  const settings = links.find((l) => l.label === "Settings")!;
  const main: NavLink[] = [
    home,
    discover,
    // Right after Discover, where the matching happens.
    ...(role === "CREATOR" ? [{ href: "/dashboard/creator/matches", label: "Matches", badge: 0 }] : []),
    ...rest,
    { href: "/dashboard/notifications", label: "Notifications", badge: unreadCount },
  ];
  const footer: NavLink[] = [...(isAdmin ? [{ href: "/admin", label: "Admin", badge: 0 }] : []), settings];
  const activeHref = activeHrefFor([...main, ...footer], pathname);

  return (
    <aside className="app-sidebar fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-w)] flex-col border-r border-ink/10 bg-background px-3 pb-5 pt-[calc(var(--safe-top)+20px)] no-print md:flex">
      <Link href={base} onNavigate={onNavigate} className="mb-6 flex h-10 shrink-0 items-center justify-center lg:justify-start lg:px-3">
        <Logo />
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {main.map((l) => (
          <SidebarLink key={l.href} link={l} active={l.href === activeHref} onNavigate={onNavigate} />
        ))}
      </nav>

      {role === "STARTUP" && (
        <Link
          href="/dashboard/startup/new"
          onNavigate={onNavigate}
          prefetch={false}
          aria-label="New request"
          title="New request"
          className="mt-5 flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-paper transition hover:bg-graphite lg:px-4"
        >
          <IoAdd className="h-5 w-5" aria-hidden />
          <span className="hidden lg:inline">New request</span>
        </Link>
      )}

      <nav aria-label="Account" className="mt-auto flex flex-col gap-1">
        {footer.map((l) => (
          <SidebarLink key={l.href} link={l} active={l.href === activeHref} onNavigate={onNavigate} />
        ))}
      </nav>
    </aside>
  );
}

function SidebarLink({
  link,
  active,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  onNavigate: (e: { preventDefault: () => void }) => void;
}) {
  const icons = TAB_ICONS[link.label] ?? { outline: IoSearchOutline, filled: IoSearch };
  const Icon = active ? icons.filled : icons.outline;
  const badge = link.badge > 9 ? "9+" : String(link.badge);

  return (
    <Link
      href={link.href}
      onNavigate={onNavigate}
      // Every one of these sits on screen on every dashboard page, so
      // viewport-triggered prefetch would fire a full server render for each
      // of them on every page. They're deliberate destinations, not hover
      // targets worth prefetching speculatively.
      prefetch={false}
      aria-current={active ? "page" : undefined}
      // Icons only on tablets: the label shows as a tooltip there.
      title={link.label}
      className={`flex h-11 items-center justify-center gap-3.5 rounded-full px-3 text-[15px] transition lg:justify-start ${
        active ? "bg-fog font-semibold text-ink" : "text-graphite hover:bg-fog hover:text-ink"
      }`}
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        <Icon className="h-6 w-6" aria-hidden />
        {link.badge > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-ink px-0.5 text-[9px] font-semibold text-paper lg:hidden">
            {badge}
          </span>
        )}
      </span>
      <span className="hidden flex-1 lg:inline">{link.label}</span>
      {link.badge > 0 && (
        <span className="hidden h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-paper lg:flex">
          {badge}
        </span>
      )}
      {link.badge > 0 && <span className="sr-only">({link.badge} new)</span>}
    </Link>
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
