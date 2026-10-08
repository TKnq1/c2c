"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  IoAddCircleOutline,
  IoBriefcaseOutline,
  IoCardOutline,
  IoChatbubbleOutline,
  IoDocumentTextOutline,
  IoHeartOutline,
  IoHomeOutline,
  IoNotificationsOutline,
  IoSearch,
  IoSearchOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/translate";
import type { SearchResult } from "@/app/api/search/route";

type Role = "STARTUP" | "CREATOR";
type Item = { key: string; title: string; subtitle?: string; href: string; icon?: IconType; avatar?: { url: string | null; name: string } };
type Group = { label: string; items: Item[] };

// Opened from anywhere with ⌘K / Ctrl+K, or by the sidebar's Search button
// (which dispatches this event).
export const OPEN_COMMAND_PALETTE = "command-palette:open";

const PAGES: Record<Role, { key: string; titleKey: MessageKey; href: string; icon: IconType }[]> = {
  STARTUP: [
    { key: "p-home", titleKey: "nav.requests", href: "/dashboard/startup", icon: IoHomeOutline },
    { key: "p-new", titleKey: "nav.newRequest", href: "/dashboard/startup/new", icon: IoAddCircleOutline },
    { key: "p-discover", titleKey: "screens.search.discoverCreators", href: "/dashboard/startup/discover", icon: IoSearchOutline },
    { key: "p-messages", titleKey: "nav.messages", href: "/dashboard/messages", icon: IoChatbubbleOutline },
    { key: "p-deals", titleKey: "nav.deals", href: "/dashboard/deals", icon: IoBriefcaseOutline },
    { key: "p-payments", titleKey: "nav.payments", href: "/dashboard/startup/payments", icon: IoCardOutline },
    { key: "p-notifications", titleKey: "nav.notifications", href: "/dashboard/notifications", icon: IoNotificationsOutline },
    { key: "p-settings", titleKey: "nav.settings", href: "/dashboard/startup/settings", icon: IoSettingsOutline },
  ],
  CREATOR: [
    { key: "p-home", titleKey: "nav.feed", href: "/dashboard/creator", icon: IoHomeOutline },
    { key: "p-discover", titleKey: "screens.search.discoverBrands", href: "/dashboard/creator/discover", icon: IoSearchOutline },
    { key: "p-matches", titleKey: "nav.yourMatches", href: "/dashboard/creator/matches", icon: IoHeartOutline },
    { key: "p-messages", titleKey: "nav.messages", href: "/dashboard/messages", icon: IoChatbubbleOutline },
    { key: "p-deals", titleKey: "nav.deals", href: "/dashboard/deals", icon: IoBriefcaseOutline },
    { key: "p-payments", titleKey: "nav.payments", href: "/dashboard/creator/payments", icon: IoCardOutline },
    { key: "p-notifications", titleKey: "nav.notifications", href: "/dashboard/notifications", icon: IoNotificationsOutline },
    { key: "p-settings", titleKey: "nav.settings", href: "/dashboard/creator/settings", icon: IoSettingsOutline },
  ],
};

export function CommandPalette({ role }: { role: Role }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActive(0);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Debounced; a newer query cancels the one still waiting.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((data: SearchResult[]) => {
          setResults(data);
          setActive(0);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const groups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    const pages = PAGES[role]
      .map((p) => ({ key: p.key, title: t(p.titleKey), href: p.href, icon: p.icon }))
      .filter((p) => !q || p.title.toLowerCase().includes(q));
    // Short queries don't search; stale results from a longer one don't show.
    const found = q.length >= 2 ? results : [];
    const byKind = (kind: SearchResult["kind"]) =>
      found
        .filter((r) => r.kind === kind)
        .map<Item>((r) => ({
          key: `${r.kind}-${r.id}`,
          title: r.title,
          subtitle: r.subtitle,
          href: r.href,
          ...(r.kind === "request" ? { icon: IoDocumentTextOutline } : { avatar: { url: r.avatarUrl, name: r.title } }),
        }));
    return [
      { label: role === "STARTUP" ? t("screens.search.creators") : t("screens.search.brands"), items: byKind("person") },
      { label: t("screens.search.chats"), items: byKind("chat") },
      { label: t("nav.requests"), items: byKind("request") },
      { label: t("screens.search.pages"), items: pages },
    ].filter((g) => g.items.length > 0);
  }, [query, results, role, t]);

  const flat = groups.flatMap((g) => g.items);
  const current = Math.min(active, Math.max(flat.length - 1, 0));

  const go = (item: Item) => {
    close();
    router.push(item.href);
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${current}"]`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  if (!open) return null;

  let index = -1;
  return (
    <div className="fixed inset-0 z-[55] no-print">
      <div aria-hidden className="animate-backdrop-in absolute inset-0 bg-black/30" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.search")}
        className="animate-dropdown-in absolute inset-x-4 top-[12vh] mx-auto flex max-h-[70vh] max-w-xl flex-col overflow-hidden rounded-[20px] bg-background shadow-2xl"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-ink/10 px-4">
          <IoSearch className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((current + 1) % Math.max(flat.length, 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((current - 1 + flat.length) % Math.max(flat.length, 1));
              } else if (e.key === "Enter" && flat[current]) {
                e.preventDefault();
                go(flat[current]);
              }
            }}
            role="combobox"
            aria-expanded
            aria-controls="command-palette-list"
            aria-activedescendant={flat[current] ? `cp-${flat[current].key}` : undefined}
            placeholder={role === "STARTUP" ? t("screens.search.brandPlaceholder") : t("screens.search.creatorPlaceholder")}
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400"
          />
          <kbd className="hidden shrink-0 rounded border border-ink/15 px-1.5 py-0.5 text-[11px] text-neutral-500 sm:inline">Esc</kbd>
        </div>

        <div ref={listRef} id="command-palette-list" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
          {groups.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">{t("screens.search.noResults", { query })}</p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-1 last:mb-0">
                <p className="px-3 pt-2 pb-1 text-footnote text-neutral-500 dark:text-neutral-400">{g.label}</p>
                {g.items.map((item) => {
                  index += 1;
                  const i = index;
                  const selected = i === current;
                  return (
                    <button
                      key={item.key}
                      id={`cp-${item.key}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left transition ${selected ? "bg-fog" : ""}`}
                    >
                      {item.avatar ? (
                        <Avatar src={item.avatar.url} name={item.avatar.name} size={28} />
                      ) : (
                        item.icon && (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                            <item.icon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" aria-hidden />
                          </span>
                        )
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        {item.subtitle && (
                          <span className="block truncate text-footnote text-neutral-500 dark:text-neutral-400">{item.subtitle}</span>
                        )}
                      </span>
                      {selected && <span className="shrink-0 text-footnote text-neutral-400">↵</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
