"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FiAlertTriangle,
  FiCheckSquare,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiMail,
  FiSearch,
  FiSend,
  FiSidebar,
  FiSliders,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { setPanelOpenAction } from "@/lib/actions/admin-dashboard";
import { OPEN_ADMIN_PALETTE } from "@/components/admin/admin-palette";

type Item = { href: string; label: string; icon: IconType; badge?: number };
type Group = { label: string; items: Item[] };

function groups(counts: { attention: number; tasks: number }): Group[] {
  return [
    {
      label: "Übersicht",
      items: [
        { href: "/admin", label: "Heute", icon: FiGrid },
        { href: "/admin/offen", label: "Offen", icon: FiCheckSquare, badge: counts.tasks },
      ],
    },
    { label: "Auswertung", items: [{ href: "/admin/onboarding", label: "Onboarding", icon: FiTrendingUp }] },
    {
      label: "Marketing",
      items: [
        { href: "/admin/mailing", label: "Mailing", icon: FiMail },
        { href: "/admin/waitlist", label: "Warteliste", icon: FiMail },
        { href: "/admin/email", label: "E-Mail-Vorschau", icon: FiSend },
      ],
    },
    { label: "Betrieb", items: [{ href: "/admin/moderation", label: "Moderation", icon: FiAlertTriangle, badge: counts.attention }] },
    {
      label: "Verwaltung",
      items: [
        { href: "/admin/users", label: "Nutzer", icon: FiUsers },
        { href: "/admin/requests", label: "Anfragen", icon: FiFileText },
        { href: "/admin/payments", label: "Zahlungen", icon: FiCreditCard },
        { href: "/admin/anpassen", label: "Anpassen", icon: FiSliders },
      ],
    },
  ];
}

// Layout: navigation on the left, the page in the middle, Claude's panel on the right. The panel folds away (and the
// choice is remembered); below the large breakpoint it never shows and the pages bring their own "Offen" block.
export function AdminShell({
  counts,
  email,
  backToApp,
  panelOpen,
  panel,
  overlays,
  children,
}: {
  counts: { attention: number; tasks: number };
  email: string;
  backToApp: boolean;
  panelOpen: boolean;
  panel: React.ReactNode;
  overlays?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(panelOpen);
  const nav = groups(counts);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const toggle = (next: boolean) => {
    setOpen(next);
    void setPanelOpenAction(next);
  };

  return (
    <div className="group/shell flex min-h-dvh flex-1 flex-col pt-[var(--safe-top)] lg:flex-row" data-panel={open ? "open" : "closed"}>
      <aside className="hidden w-56 shrink-0 flex-col gap-5 border-r border-ink/10 px-3 py-5 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:overflow-y-auto">
        <Link href="/admin" className="flex items-center gap-2.5 px-2">
          <Logo />
          <span className="rounded-full border border-ink/10 px-2 py-0.5 text-xs font-bold text-graphite">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_ADMIN_PALETTE))}
          className="flex items-center gap-2 rounded border border-ink/10 px-3 py-2 text-sm text-graphite transition hover:bg-fog"
        >
          <FiSearch className="h-4 w-4" aria-hidden />
          Suchen
          <kbd className="ml-auto rounded border border-ink/10 px-1.5 text-[0.6875rem]">⌘K</kbd>
        </button>
        <nav aria-label="Admin" className="flex flex-col gap-5">
          {nav.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <p className="px-2.5 pb-1 text-xs text-graphite">{group.label}</p>
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition ${
                      active ? "bg-fog font-bold text-ink" : "text-neutral-600 hover:bg-fog hover:text-ink dark:text-neutral-400"
                    }`}
                  >
                    {active && <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r bg-accent" aria-hidden />}
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span>{label}</span>
                    {!!badge && (
                      <span className="ml-auto min-w-5 rounded-full bg-ink px-1.5 text-center text-xs font-bold text-paper tabular-nums">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-ink/10 pt-3">
          <p className="truncate px-2 text-xs text-graphite">{email}</p>
          <div className="flex items-center gap-2 px-1">
            {backToApp && (
              <Link href="/dashboard" className="text-xs underline">
                Zur App
              </Link>
            )}
            <LogoutButton className="ml-auto rounded-full border border-ink/10 px-3 py-1 text-xs font-bold transition hover:bg-fog">Abmelden</LogoutButton>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 lg:hidden">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Logo />
              <span className="rounded-full border border-ink/10 px-2 py-0.5 text-xs font-bold text-graphite">Admin</span>
            </Link>
            <LogoutButton className="rounded-full border border-ink/10 px-3 py-1 text-xs font-bold">Abmelden</LogoutButton>
          </header>
          <nav aria-label="Admin" className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-ink/10 px-4 py-2 lg:hidden">
            {nav
              .flatMap((g) => g.items)
              .map(({ href, label, icon: Icon, badge }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
                      active ? "bg-ink font-bold text-paper" : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                    {!!badge && <span className={`rounded-full px-1.5 text-xs font-bold ${active ? "bg-paper text-ink" : "bg-ink text-paper"}`}>{badge}</span>}
                  </Link>
                );
              })}
          </nav>
          <main className="relative min-w-0 px-4 py-6 lg:px-8 lg:py-8">
            <button
              type="button"
              onClick={() => toggle(true)}
              aria-label="Claude-Panel öffnen"
              className="absolute top-8 right-4 hidden items-center gap-2 rounded-full border border-ink/10 bg-paper px-3 py-1.5 text-xs font-bold transition hover:bg-fog group-data-[panel=closed]/shell:lg:inline-flex"
            >
              <FiSidebar className="h-4 w-4" aria-hidden />
              Claude
            </button>
            {children}
          </main>
        </div>

        <aside
          aria-label="Claude"
          className="hidden w-[372px] shrink-0 flex-col gap-4 border-l border-ink/10 bg-fog px-5 py-5 group-data-[panel=open]/shell:lg:sticky group-data-[panel=open]/shell:lg:top-0 group-data-[panel=open]/shell:lg:flex group-data-[panel=open]/shell:lg:h-dvh group-data-[panel=open]/shell:lg:overflow-y-auto"
        >
          <button
            type="button"
            onClick={() => toggle(false)}
            aria-label="Claude-Panel schließen"
            className="absolute top-4 right-4 rounded p-1.5 text-graphite transition hover:bg-ink/10 hover:text-ink"
          >
            <FiSidebar className="h-4 w-4" aria-hidden />
          </button>
          {panel}
        </aside>
      </div>
      {overlays}
    </div>
  );
}
