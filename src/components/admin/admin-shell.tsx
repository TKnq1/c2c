"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowLeft,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCheckSquare,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiInbox,
  FiLogOut,
  FiMail,
  FiSearch,
  FiSend,
  FiShoppingBag,
  FiSliders,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { LogoMark } from "@/components/admin/logo-mark";
import { OPEN_ADMIN_PALETTE } from "@/components/admin/admin-palette";

type Item = { href: string; label: string; icon: IconType; badge?: number };
// A plain link, or a group whose pages open in a small menu next to the rail. Six of these make up the menu; the rest sit
// one click deeper.
type Section = { key: string; label: string; icon: IconType; href?: string; items?: Item[]; badge?: number };

function sections(counts: { attention: number; tasks: number; notices: number }): { main: Section[]; footer: Item[] } {
  return {
    main: [
      { key: "heute", label: "Heute", icon: FiHome, href: "/admin" },
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

// Two letters for the avatar: the initials of the name, or the start of the address.
function initials(name: string | null, email: string) {
  const words = (name?.trim() || email.split("@")[0]).split(/[\s._-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

const badgeText = (n: number) => (n > 99 ? "99+" : String(n));

// The search and command palette, opened from the top bar, the sidebar and the phone's header alike.
const openSearch = () => window.dispatchEvent(new Event(OPEN_ADMIN_PALETTE));

// One row of the sidebar: icon, name and, where something waits, a count. The page you are on has a soft background and the
// accent as a bar on the sidebar's edge.
const ITEM = "relative flex items-center gap-3 rounded-[var(--adm-r-row)] px-3.5 py-2.5 text-[0.9375rem] transition";
const ITEM_ON = "bg-ink/[0.08] font-bold text-ink";
const ITEM_OFF = "text-graphite hover:bg-ink/5 hover:text-ink";
const BAR = "absolute top-2.5 bottom-2.5 -left-3 w-[3px] rounded-r bg-accent";
const COUNT = "ml-auto min-w-5 rounded-full bg-ink px-1.5 text-center text-xs font-bold text-paper tabular-nums";

// The search, the inbox, the account and the sign-out, top right on every page. On "Heute" the search is a wide field; elsewhere
// it shrinks to a button so the page's own heading keeps its room.
function TopControls({ counts, email, name, wide }: { counts: { notices: number }; email: string; name: string | null; wide: boolean }) {
  return (
    <div className="absolute top-0 right-0 z-20 hidden items-center gap-2.5 lg:flex">
      {wide && (
        <button
          type="button"
          onClick={openSearch}
          className="adm-field hidden h-12 w-[17.5rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-5 text-left text-sm text-graphite xl:grid"
        >
          <FiSearch className="h-[18px] w-[18px]" aria-hidden />
          <span className="truncate">Suchen oder Befehl…</span>
          <kbd className="rounded-md border border-ink/15 px-1.5 py-0.5 text-[0.6875rem] font-bold">⌘K</kbd>
        </button>
      )}
      <button type="button" onClick={openSearch} aria-label="Suchen" className={`adm-round grid h-11 w-11 place-items-center text-graphite hover:text-ink ${wide ? "xl:hidden" : ""}`}>
        <FiSearch className="h-[18px] w-[18px]" aria-hidden />
      </button>
      <Link href="/admin/mitteilungen" aria-label={counts.notices > 0 ? `Mitteilungen, ${counts.notices} ungelesen` : "Mitteilungen"} className="adm-round relative grid h-11 w-11 place-items-center text-graphite hover:text-ink">
        <FiBell className="h-[18px] w-[18px]" aria-hidden />
        {counts.notices > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-paper bg-accent px-1 text-[0.6875rem] font-black text-on-accent tabular-nums">
            {counts.notices > 9 ? "9+" : counts.notices}
          </span>
        )}
      </Link>
      <Link href="/admin/anpassen" aria-label="Anpassen" title={email} className="adm-avatar grid h-11 w-11 place-items-center rounded-full text-sm font-black">
        {initials(name, email)}
      </Link>
      <LogoutButton className="adm-round grid h-11 w-11 place-items-center text-graphite hover:text-ink">
        <FiLogOut className="h-[18px] w-[18px]" aria-hidden />
        <span className="sr-only">Abmelden</span>
      </LogoutButton>
    </div>
  );
}

// The inbox on a phone: reports, urgent notices and the daily and weekly report. The count is what has not been looked at yet.
function Bell({ count }: { count: number }) {
  return (
    <Link
      href="/admin/mitteilungen"
      aria-label={count > 0 ? `Mitteilungen, ${count} ungelesen` : "Mitteilungen"}
      className="relative rounded-full p-2 text-graphite transition hover:bg-fog hover:text-ink"
    >
      <FiBell className="h-[18px] w-[18px]" aria-hidden />
      {count > 0 && (
        <span className="absolute top-0.5 right-0 min-w-4 rounded-full bg-accent px-1 text-center text-[0.625rem] leading-4 font-bold text-on-accent tabular-nums">{count > 9 ? "9+" : count}</span>
      )}
    </Link>
  );
}

// Layout: the sidebar on the left, the page in the middle. The pages of a group fold open under its name; the group you are in
// is open by itself. Below the large breakpoint the sidebar turns into a row of pills across the top.
export function AdminShell({
  counts,
  email,
  name,
  backToApp,
  overlays,
  children,
}: {
  counts: { attention: number; tasks: number; notices: number };
  email: string;
  name: string | null;
  backToApp: boolean;
  overlays?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { main, footer } = sections(counts);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const sectionActive = (section: Section) => (section.href ? isActive(section.href) : !!section.items?.some((i) => isActive(i.href)));
  // A group is open when the page you are on belongs to it, unless you folded it yourself.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const isOpen = (section: Section) => toggled[section.key] ?? sectionActive(section);
  const activeGroup = main.find((section) => section.items && sectionActive(section));

  return (
    <div className="group/shell flex min-h-dvh flex-1 flex-col pt-[var(--safe-top)] lg:flex-row">
      <aside className="hidden w-[14rem] shrink-0 flex-col gap-1.5 px-3 pt-6 pb-5 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:overflow-y-auto">
        <Link href="/admin" aria-label="comtor Admin, Heute" className="mb-4 flex items-center gap-3 px-3">
          <LogoMark width={48} />
          <span className="rounded-full border border-ink/15 px-2 py-px text-[0.6875rem] font-bold text-graphite">Admin</span>
        </Link>
        <button type="button" onClick={openSearch} className="adm-field mb-2.5 flex h-10 items-center gap-2.5 px-3.5 text-left text-sm text-graphite hover:text-ink">
          <FiSearch className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1 truncate">Suchen…</span>
          <kbd className="rounded-md border border-ink/15 px-1.5 py-0.5 text-[0.6875rem] font-bold">⌘K</kbd>
        </button>
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {main.map((section) => {
            const Icon = section.icon;
            const active = sectionActive(section);
            if (section.href) {
              return (
                <Link key={section.key} href={section.href} aria-current={active ? "page" : undefined} className={`${ITEM} ${active ? ITEM_ON : ITEM_OFF}`}>
                  {active && <span className={BAR} aria-hidden />}
                  <Icon className="h-[19px] w-[19px] shrink-0" aria-hidden />
                  <span>{section.label}</span>
                  {!!section.badge && <span className={COUNT}>{badgeText(section.badge)}</span>}
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
                  className={`${ITEM} w-full text-left ${active ? "font-bold text-ink" : ITEM_OFF}`}
                >
                  {active && !open && <span className={BAR} aria-hidden />}
                  <Icon className="h-[19px] w-[19px] shrink-0" aria-hidden />
                  <span>{section.label}</span>
                  {!!section.badge && !open && <span className={COUNT}>{badgeText(section.badge)}</span>}
                  <FiChevronDown className={`h-4 w-4 shrink-0 text-graphite transition ${section.badge && !open ? "" : "ml-auto"} ${open ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {open && (
                  <div id={`nav-${section.key}`} className="mb-1 ml-[1.625rem] flex flex-col gap-0.5 border-l border-(--adm-line) pl-2">
                    {section.items?.map(({ href, label, badge }) => {
                      const itemActive = isActive(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          aria-current={itemActive ? "page" : undefined}
                          className={`relative flex items-center gap-2 rounded-[var(--adm-r-row)] px-3 py-2 text-sm transition ${itemActive ? ITEM_ON : ITEM_OFF}`}
                        >
                          {itemActive && <span className="absolute top-2 bottom-2 -left-[calc(0.5rem+1px)] w-[3px] rounded-r bg-accent" aria-hidden />}
                          <span>{label}</span>
                          {!!badge && <span className={COUNT}>{badgeText(badge)}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-(--adm-line) pt-3">
          {backToApp && (
            <Link href="/dashboard" className={`${ITEM} ${ITEM_OFF} py-2 text-sm`}>
              <FiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Zur App
            </Link>
          )}
          {footer.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`${ITEM} py-2 text-sm ${active ? ITEM_ON : ITEM_OFF}`}>
                {active && <span className={BAR} aria-hidden />}
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
          <p className="truncate px-3.5 pt-1 text-xs text-graphite" title={email}>
            {email}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-(--adm-line) px-4 py-3 lg:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo />
            <span className="rounded-full border border-ink/10 px-2 py-0.5 text-xs font-bold text-graphite">Admin</span>
          </Link>
          <div className="flex items-center gap-1">
            <button type="button" onClick={openSearch} aria-label="Suchen" className="rounded-full p-2 text-graphite transition hover:bg-fog hover:text-ink">
              <FiSearch className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <Bell count={counts.notices} />
            <LogoutButton className="rounded-full border border-ink/10 px-3 py-1 text-xs font-bold">Abmelden</LogoutButton>
          </div>
        </header>
        <nav aria-label="Admin" className="border-b border-(--adm-line) px-4 py-2 lg:hidden">
          <div className="scrollbar-hide flex gap-1 overflow-x-auto">
            {[
              ...main.map((section) => ({ key: section.key, label: section.label, icon: section.icon, href: section.href ?? section.items![0].href, active: sectionActive(section), badge: section.badge })),
              ...footer.map((item) => ({ key: item.href, label: item.label, icon: item.icon, href: item.href, active: isActive(item.href), badge: undefined })),
            ].map(({ key, label, icon: Icon, href, active, badge }) => (
              <Link
                key={key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${active ? "bg-ink font-bold text-paper" : "text-neutral-600 dark:text-neutral-400"}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
                {!!badge && <span className={`rounded-full px-1.5 text-xs font-bold ${active ? "bg-paper text-ink" : "bg-ink text-paper"}`}>{badge}</span>}
              </Link>
            ))}
          </div>
          {activeGroup && (
            <div className="scrollbar-hide mt-1.5 flex gap-1 overflow-x-auto border-t border-(--adm-line) pt-1.5">
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
        <main className="min-w-0 px-4 py-6 lg:pr-8 lg:pl-2">
          {/* The page stands in the middle with a widest measure, so a wide window leaves its sides free; the top controls sit on this frame's edge. */}
          <div className="relative mx-auto w-full max-w-[80rem]">
            <TopControls counts={counts} email={email} name={name} wide={pathname === "/admin"} />
            {children}
          </div>
        </main>
      </div>
      {overlays}
    </div>
  );
}
