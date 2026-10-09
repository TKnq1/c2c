"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMessageSquare } from "react-icons/fi";
import { IoFilterOutline } from "react-icons/io5";
import { useUrlState } from "@/lib/use-url-state";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { useExitAnimation } from "@/lib/use-exit-animation";
import { formatMessageTimestamp } from "@/lib/format";
import { SearchInput } from "@/components/search-input";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/components/i18n-provider";

type Conversation = {
  interestId: string;
  requestTitle: string;
  other: { name: string; avatarUrl: string | null };
  lastMessage: { body: string; createdAt: number; isMine: boolean } | null;
  messageSearchText: string;
  unreadCount: number;
};

// `compact` is the desktop column next to an open thread (see
// messages/layout.tsx): narrower, and the open conversation is marked.
export function MessagesList({ conversations, compact = false }: { conversations: Conversation[]; compact?: boolean }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [{ q: search, unread }, setParam, setParams] = useUrlState(["q", "unread"]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterPanel = useExitAnimation(filterOpen);
  const filterRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = unread === "1" ? 1 : 0;
  const timeZone = useViewerTimeZone();

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [filterOpen]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (unread === "1" && c.unreadCount === 0) return false;
      if (query) {
        const haystack = `${c.other.name} ${c.requestTitle} ${c.messageSearchText}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [conversations, search, unread]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-stretch gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder={compact ? t("screens.messages.searchShort") : t("screens.messages.search")}
          aria-label={t("screens.messages.searchLabel")}
          wrapperClassName="flex-1 min-w-48"
        />
        <div ref={filterRef} className="relative flex shrink-0">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={filterOpen}
            aria-label={t("screens.messages.filter")}
            className={`flex h-full items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              activeFilterCount > 0
                ? "border-ink bg-ink text-paper"
                : "border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600"
            }`}
          >
            <IoFilterOutline className="h-4 w-4" />
            {t("screens.discover.filter")}
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-paper px-1 text-[10px] font-semibold text-ink">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterPanel.present && (
            <div
              role="menu"
              onAnimationEnd={filterPanel.onExitEnd}
              className={`${
                filterPanel.closing ? "animate-dropdown-out pointer-events-none" : "animate-dropdown-in"
              } absolute right-0 top-full z-20 mt-1 min-w-40 rounded border border-ink/10 bg-white py-1 dark:bg-neutral-900`}
            >
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 whitespace-nowrap hover:bg-neutral-50 cursor-pointer dark:text-neutral-300 dark:hover:bg-neutral-800">
                <input
                  type="checkbox"
                  checked={unread === "1"}
                  onChange={(e) => setParam("unread", e.target.checked ? "1" : "")}
                  className="h-4 w-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-white dark:checked:bg-white"
                />
                {t("screens.messages.unreadOnly")}
              </label>
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FiMessageSquare}
          title={t("screens.messages.none")}
          action={{ label: t("screens.messages.clearFilters"), onClick: () => setParams({ q: "", unread: "" }) }}
        />
      ) : (
        // One grey group, a hairline between conversations, like iOS Messages
        // inside the app's grouped look.
        <div
          key={`${search}|${unread}`}
          className="discover-results-fade divide-y divide-ink/10 overflow-hidden rounded bg-fog"
        >
          {filtered.map((c) => {
            const href = `/dashboard/messages/${c.interestId}`;
            const open = compact && pathname === href;
            return (
              <Link
                key={c.interestId}
                href={href}
                transitionTypes={compact ? undefined : ["nav-forward"]}
                aria-current={open ? "page" : undefined}
                className={`flex items-start gap-3 px-4 py-3 transition ${open ? "bg-ink/10" : "hover:bg-ink/5"}`}
              >
                <Avatar src={c.other.avatarUrl} name={c.other.name} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium truncate ${c.unreadCount > 0 ? "text-neutral-900 dark:text-neutral-100" : ""}`}>
                      {c.other.name}
                    </p>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {c.lastMessage && (
                        <p className="text-xs text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                          {formatMessageTimestamp(c.lastMessage.createdAt, timeZone, locale)}
                        </p>
                      )}
                      {c.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-medium text-paper">
                          {c.unreadCount > 9 ? "9+" : c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm mt-1 truncate ${c.unreadCount > 0 ? "text-neutral-900 font-medium dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"}`}>
                    {c.lastMessage ? `${c.lastMessage.isMine ? t("screens.messages.you") : ""}${c.lastMessage.body}` : t("screens.messages.emptyThread")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
