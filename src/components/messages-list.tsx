"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMessageSquare } from "react-icons/fi";
import { useUrlState } from "@/lib/use-url-state";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { formatMessageTimestamp } from "@/lib/format";
import { SearchInput } from "@/components/search-input";
import { FilterButton, FilterChip, FilterGroup, FilterSheet, searchFieldClass } from "@/components/filters";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeFilterCount = unread === "1" ? 1 : 0;
  const timeZone = useViewerTimeZone();

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
      <div className="flex gap-2">
        <SearchInput
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder={compact ? t("screens.messages.searchShort") : t("screens.messages.search")}
          aria-label={t("screens.messages.searchLabel")}
          wrapperClassName="min-w-0 flex-1"
          className={searchFieldClass}
        />
        <FilterButton
          count={activeFilterCount}
          label={t("screens.discover.filter")}
          activeLabel={t("screens.discover.filtersActive", { count: activeFilterCount })}
          onClick={() => setSheetOpen(true)}
        />
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("screens.messages.filter")}
        resetLabel={t("screens.discover.resetFilters")}
        onReset={() => setParam("unread", "")}
        showLabel={filtered.length === 1 ? t("screens.messages.showOne", { count: filtered.length }) : t("screens.messages.showMany", { count: filtered.length })}
      >
        <FilterGroup label={t("screens.messages.showGroup")}>
          <FilterChip active={unread !== "1"} onClick={() => setParam("unread", "")}>
            {t("screens.messages.all")}
          </FilterChip>
          <FilterChip active={unread === "1"} onClick={() => setParam("unread", "1")}>
            {t("screens.messages.unreadOnly")}
          </FilterChip>
        </FilterGroup>
      </FilterSheet>

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
