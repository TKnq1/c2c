"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { FiBell, FiMenu, FiX } from "react-icons/fi";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNavigationBlocker } from "@/lib/navigation-blocker";

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
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="border-b border-ink/10 no-print">
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
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Open menu"
            className="text-ink transition p-1 -m-1"
          >
            <FiMenu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Backdrop — always mounted so the drawer can animate closed, not just open */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <nav
        id="mobile-nav"
        aria-label="Main"
        aria-hidden={!open}
        className={`md:hidden fixed top-0 left-0 h-dvh w-72 max-w-[80vw] z-50 bg-background flex flex-col pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink/10">
          <Logo />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            aria-label="Close menu"
            className="text-ink transition p-1 -m-1"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col px-6 py-2 text-base text-graphite">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              onNavigate={onNavigate}
              prefetch={false}
              tabIndex={open ? 0 : -1}
              aria-current={l.href === activeHref ? "page" : undefined}
              className={`flex items-center gap-1.5 py-3 border-b border-ink/10 last:border-0 transition hover:text-ink ${
                l.href === activeHref ? "text-ink" : ""
              }`}
            >
              {l.label}
              {l.badge > 0 && <NavBadge count={l.badge} />}
            </Link>
          ))}
        </div>
      </nav>
    </header>
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
