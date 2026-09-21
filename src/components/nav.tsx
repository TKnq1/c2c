"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import type { IconType } from "react-icons";
import { FiBell, FiCompass, FiCreditCard, FiInbox, FiMessageCircle, FiSettings, FiZap } from "react-icons/fi";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNavigationBlocker } from "@/lib/navigation-blocker";

const TAB_ICONS: Record<string, IconType> = {
  Requests: FiInbox,
  Feed: FiZap,
  Discover: FiCompass,
  Messages: FiMessageCircle,
  Payments: FiCreditCard,
  Settings: FiSettings,
};

export function Nav({
  role,
  unreadCount,
  unreadMessages,
  pendingPayments,
}: {
  role: Role;
  unreadCount: number;
  unreadMessages: number;
  pendingPayments: number;
}) {
  const base = role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator";
  const pathname = usePathname();
  const { isBlocked } = useNavigationBlocker();

  const onNavigate = (e: { preventDefault: () => void }) => {
    if (isBlocked && !window.confirm("You have unsaved changes. Leave without saving?")) {
      e.preventDefault();
    }
  };

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

  return (
    <>
      <header className={`border-b border-ink/10 no-print ${hideOnMobile ? "hidden md:block" : ""}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
          <Link href={base} onNavigate={onNavigate} className="shrink-0">
            <Logo />
          </Link>

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
            <NotificationsLink unreadCount={unreadCount} onNavigate={onNavigate} />
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            <NotificationsLink unreadCount={unreadCount} onNavigate={onNavigate} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Bottom tab bar — mobile only. Every destination is one tap away,
          app-style, instead of behind a hamburger drawer. */}
      <nav
        aria-label="Main"
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-background pb-[env(safe-area-inset-bottom)] no-print ${
          hideOnMobile ? "hidden" : ""
        }`}
      >
        <div className="flex items-stretch">
          {links.map((l) => {
            const Icon = TAB_ICONS[l.label] ?? FiCompass;
            const isActive = l.href === activeHref;
            return (
              <Link
                key={l.href}
                href={l.href}
                onNavigate={onNavigate}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition ${
                  isActive ? "text-ink" : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {l.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-ink px-0.5 text-[9px] font-semibold text-paper">
                      {l.badge > 9 ? "9+" : l.badge}
                    </span>
                  )}
                </span>
                {l.label}
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
    <span className="flex h-4 min-w-4 items-center justify-center rounded bg-ink px-1 text-[10px] font-medium text-paper">
      {count > 9 ? "9+" : count}
    </span>
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
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded bg-ink px-0.5 text-[10px] font-medium text-paper">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
