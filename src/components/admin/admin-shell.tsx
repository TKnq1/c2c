"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiBookOpen,
  FiCheckSquare,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiInbox,
  FiMail,
  FiSearch,
  FiSend,
  FiShoppingBag,
  FiSidebar,
  FiSliders,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { setPanelOpenAction } from "@/lib/actions/admin-dashboard";
import { OPEN_ADMIN_PALETTE } from "@/components/admin/admin-palette";

type Item = { href: string; label: string; icon: IconType; badge?: number };
// A plain link, or a group that folds open. Six of these make up the menu; the rest sit one click deeper.
type Section = { key: string; label: string; icon: IconType; href?: string; items?: Item[]; badge?: number };

function sections(counts: { attention: number; tasks: number }): { main: Section[]; footer: Item[] } {
  return {
    main: [
      { key: "heute", label: "Heute", icon: FiGrid, href: "/admin" },
      { key: "offen", label: "Offen", icon: FiCheckSquare, href: "/admin/offen", badge: counts.tasks },
      {
        key: "auswertung",
        label: "Auswertung",
        icon: FiBarChart2,
        items: [
          { href: "/admin/wachstum", label: "Wachstum", icon: FiBarChart2 },
          { href: "/admin/geld", label: "Geld", icon: FiDollarSign },
          { href: "/admin/marktplatz", label: "Marktplatz", icon: FiShoppingBag },
          { href: "/admin/onboarding", label: "Onboarding", icon: FiTrendingUp },
        ],
      },
      {
        key: "marketing",
        label: "Marketing",
        icon: FiTarget,
        items: [
          { href: "/admin/ads", label: "Ads & Kanäle", icon: FiTarget },
          { href: "/admin/mails", label: "Mails", icon: FiInbox },
          { href: "/admin/mailing", label: "Mailing", icon: FiMail },
          { href: "/admin/waitlist", label: "Warteliste", icon: FiMail },
          { href: "/admin/email", label: "E-Mail-Vorschau", icon: FiSend },
        ],
      },
      {
        key: "betrieb",
        label: "Betrieb",
        icon: FiActivity,
        badge: counts.attention,
        items: [
          { href: "/admin/moderation", label: "Moderation", icon: FiAlertTriangle, badge: counts.attention },
          { href: "/admin/fristen", label: "Fristen", icon: FiClock },
          { href: "/admin/technik", label: "Technik", icon: FiActivity },
          { href: "/admin/log", label: "Entscheidungs-Log", icon: FiBookOpen },
        ],
      },
      {
        key: "verwaltung",
        label: "Verwaltung",
        icon: FiUsers,
        items: [
          { href: "/admin/users", label: "Nutzer", icon: FiUsers },
          { href: "/admin/requests", label: "Anfragen", icon: FiFileText },
          { href: "/admin/payments", label: "Zahlungen", icon: FiCreditCard },
        ],
      },
    ],
    footer: [
      { href: "/admin/hilfe", label: "Hilfe", icon: FiHelpCircle },
      { href: "/admin/anpassen", label: "Anpassen", icon: FiSliders },
    ],
  };
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
  const { main, footer } = sections(counts);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const sectionActive = (section: Section) => (section.href ? isActive(section.href) : !!section.items?.some((i) => isActive(i.href)));
  // A group is open when the page you are on belongs to it, unless you folded it yourself.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const isOpen = (section: Section) => toggled[section.key] ?? sectionActive(section);
  const activeGroup = main.find((section) => section.items && sectionActive(section));

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
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {main.map((section) => {
            const Icon = section.icon;
            const active = sectionActive(section);
            if (section.href) {
              return (
                <Link
                  key={section.key}
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition ${
                    active ? "bg-fog font-bold text-ink" : "text-neutral-600 hover:bg-fog hover:text-ink dark:text-neutral-400"
                  }`}
                >
                  {active && <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r bg-accent" aria-hidden />}
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span>{section.label}</span>
                  {!!section.badge && <span className="ml-auto min-w-5 rounded-full bg-ink px-1.5 text-center text-xs font-bold text-paper tabular-nums">{section.badge}</span>}
                </Link>
              );
            }
            const open = isOpen(section);
            return (
              <div key={section.key} className="flex flex-col gap-0.5">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`nav-${section.key}`}
                  onClick={() => setToggled((prev) => ({ ...prev, [section.key]: !open }))}
                  className={`relative flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition ${
                    active ? "font-bold text-ink" : "text-neutral-600 hover:bg-fog hover:text-ink dark:text-neutral-400"
                  }`}
                >
                  {active && !open && <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r bg-accent" aria-hidden />}
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span>{section.label}</span>
                  {!!section.badge && !open && <span className="ml-auto min-w-5 rounded-full bg-ink px-1.5 text-center text-xs font-bold text-paper tabular-nums">{section.badge}</span>}
                  <FiChevronDown className={`h-4 w-4 shrink-0 text-graphite transition ${section.badge && !open ? "" : "ml-auto"} ${open ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {open && (
                  <div id={`nav-${section.key}`} className="ml-[1.125rem] flex flex-col gap-0.5 border-l border-ink/10 pl-2">
                    {section.items?.map(({ href, label, badge }) => {
                      const itemActive = isActive(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          aria-current={itemActive ? "page" : undefined}
                          className={`relative flex items-center gap-2 rounded px-2.5 py-1.5 text-sm transition ${
                            itemActive ? "bg-fog font-bold text-ink" : "text-neutral-600 hover:bg-fog hover:text-ink dark:text-neutral-400"
                          }`}
                        >
                          {itemActive && <span className="absolute top-2 bottom-2 -left-[calc(0.5rem+1px)] w-[3px] rounded-r bg-accent" aria-hidden />}
                          <span>{label}</span>
                          {!!badge && <span className="ml-auto min-w-5 rounded-full bg-ink px-1.5 text-center text-xs font-bold text-paper tabular-nums">{badge}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-ink/10 pt-3">
          {footer.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded px-2.5 py-1.5 text-sm transition ${
                  active ? "bg-fog font-bold text-ink" : "text-neutral-600 hover:bg-fog hover:text-ink dark:text-neutral-400"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
          <p className="truncate px-2 pt-1 text-xs text-graphite">{email}</p>
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
          <nav aria-label="Admin" className="border-b border-ink/10 px-4 py-2 lg:hidden">
            <div className="scrollbar-hide flex gap-1 overflow-x-auto">
              {[
                ...main.map((section) => ({ key: section.key, label: section.label, icon: section.icon, href: section.href ?? section.items![0].href, active: sectionActive(section), badge: section.badge })),
                ...footer.map((item) => ({ key: item.href, label: item.label, icon: item.icon, href: item.href, active: isActive(item.href), badge: undefined })),
              ].map(({ key, label, icon: Icon, href, active, badge }) => (
                <Link
                  key={key}
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
              ))}
            </div>
            {activeGroup && (
              <div className="scrollbar-hide mt-1.5 flex gap-1 overflow-x-auto border-t border-ink/10 pt-1.5">
                {activeGroup.items!.map(({ href, label, badge }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs transition ${active ? "bg-fog font-bold text-ink" : "text-neutral-600 dark:text-neutral-400"}`}
                    >
                      {label}
                      {!!badge && <span className="rounded-full bg-ink px-1.5 text-xs font-bold text-paper">{badge}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
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
