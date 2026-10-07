"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiBookOpen,
  FiCheckSquare,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiInbox,
  FiMail,
  FiPlus,
  FiSearch,
  FiSend,
  FiShoppingBag,
  FiSliders,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import type { AdminSearchResult } from "@/app/api/admin/search/route";

// Opened with ⌘K / Ctrl+K from any admin page, or by the Search button in the sidebar (which fires this event).
export const OPEN_ADMIN_PALETTE = "admin-palette:open";
// The setup assistant listens for this one; the palette offers it as an action.
export const OPEN_ADMIN_SETUP = "admin-setup:open";

type Item = { key: string; title: string; subtitle?: string; icon: IconType; run: (go: (href: string) => void) => void };
type Group = { label: string; items: Item[] };

const PAGES: { href: string; title: string; icon: IconType }[] = [
  { href: "/admin", title: "Heute", icon: FiGrid },
  { href: "/admin/offen", title: "Offen", icon: FiCheckSquare },
  { href: "/admin/wachstum", title: "Wachstum", icon: FiBarChart2 },
  { href: "/admin/geld", title: "Geld", icon: FiDollarSign },
  { href: "/admin/marktplatz", title: "Marktplatz", icon: FiShoppingBag },
  { href: "/admin/onboarding", title: "Onboarding", icon: FiTrendingUp },
  { href: "/admin/ads", title: "Ads & Kanäle", icon: FiTarget },
  { href: "/admin/mails", title: "Mails", icon: FiInbox },
  { href: "/admin/mailing", title: "Mailing", icon: FiMail },
  { href: "/admin/waitlist", title: "Warteliste", icon: FiMail },
  { href: "/admin/email", title: "E-Mail-Vorschau", icon: FiSend },
  { href: "/admin/technik", title: "Technik", icon: FiActivity },
  { href: "/admin/moderation", title: "Moderation", icon: FiAlertTriangle },
  { href: "/admin/fristen", title: "Fristen", icon: FiClock },
  { href: "/admin/log", title: "Entscheidungs-Log", icon: FiBookOpen },
  { href: "/admin/users", title: "Nutzer", icon: FiUsers },
  { href: "/admin/requests", title: "Anfragen", icon: FiFileText },
  { href: "/admin/payments", title: "Zahlungen", icon: FiCreditCard },
  { href: "/admin/hilfe", title: "Hilfe", icon: FiHelpCircle },
  { href: "/admin/anpassen", title: "Anpassen", icon: FiSliders },
];

export function AdminPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<AdminSearchResult[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setOpen(false);
    setQuery("");
    setPeople([]);
    setActive(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_ADMIN_PALETTE, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_ADMIN_PALETTE, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // People come from the server, a moment after the typing stops.
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.ok) setPeople(await res.json());
      } catch {
        // Aborted or offline: the list keeps what it has.
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const groups: Group[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (text: string) => !q || text.toLowerCase().includes(q);
    const result: Group[] = [];
    const pages = PAGES.filter((p) => match(p.title)).map((p) => ({ key: p.href, title: p.title, icon: p.icon, run: (go: (href: string) => void) => go(p.href) }));
    if (pages.length > 0) result.push({ label: "Seiten", items: pages });
    const actions = ([
      { key: "a-task", title: "Neue Aufgabe anlegen", icon: FiPlus, run: (go) => go("/admin/offen#neu") },
      { key: "a-setup", title: "Einrichtung öffnen", icon: FiSliders, run: () => window.dispatchEvent(new Event(OPEN_ADMIN_SETUP)) },
    ] satisfies Item[]).filter((a) => match(a.title));
    if (actions.length > 0) result.push({ label: "Aktionen", items: actions });
    if (q.length >= 2 && people.length > 0) {
      result.push({
        label: "Nutzer",
        items: people.map((p) => ({ key: `u-${p.id}`, title: p.title, subtitle: p.subtitle, icon: FiUser, run: (go) => go(p.href) })),
      });
    }
    return result;
  }, [query, people]);

  const flat = groups.flatMap((g) => g.items);
  const clamped = Math.min(active, Math.max(flat.length - 1, 0));

  const choose = (item: Item | undefined) => {
    if (!item) return;
    close();
    item.run((href) => router.push(href));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={close} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Suchen"
        className="w-full max-w-xl overflow-hidden rounded border border-ink/10 bg-paper shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive(Math.min(clamped + 1, flat.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive(Math.max(clamped - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(flat[clamped]);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
          <FiSearch className="h-4 w-4 shrink-0 text-graphite" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Seite, Aktion oder Nutzer suchen …"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-graphite"
          />
          <kbd className="rounded border border-ink/10 px-1.5 text-[0.6875rem] text-graphite">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {flat.length === 0 && <p className="px-3 py-6 text-center text-sm text-graphite">Nichts gefunden.</p>}
          {groups.map((group) => (
            <div key={group.label} className="py-1">
              <p className="px-3 pb-1 text-xs text-graphite">{group.label}</p>
              {group.items.map((item) => {
                const index = flat.indexOf(item);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(item)}
                    className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm ${index === clamped ? "bg-fog" : ""}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-graphite" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-bold">{item.title}</span>
                      {item.subtitle && <span className="ml-2 text-xs text-graphite">{item.subtitle}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
