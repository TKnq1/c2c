"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FiMessageSquare } from "react-icons/fi";
import { useUrlState } from "@/lib/use-url-state";
import { SearchInput } from "@/components/search-input";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";

type Conversation = {
  interestId: string;
  requestTitle: string;
  other: { name: string; avatarUrl: string | null };
  lastMessage: { body: string } | null;
  unreadCount: number;
};

export function MessagesList({ conversations }: { conversations: Conversation[] }) {
  const [{ q: search, unread }, setParam, setParams] = useUrlState(["q", "unread"]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (unread === "1" && c.unreadCount === 0) return false;
      if (query) {
        const haystack = `${c.other.name} ${c.requestTitle}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [conversations, search, unread]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search name or request…"
          aria-label="Search conversations"
          wrapperClassName="flex-1 min-w-48"
        />
        <label className="flex items-center gap-2 text-sm text-neutral-600 whitespace-nowrap dark:text-neutral-400">
          <input
            type="checkbox"
            checked={unread === "1"}
            onChange={(e) => setParam("unread", e.target.checked ? "1" : "")}
            className="h-4 w-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-white dark:checked:bg-white"
          />
          Unread only
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FiMessageSquare}
          title="No conversations match."
          action={{ label: "Clear filters", onClick: () => setParams({ q: "", unread: "" }) }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <Link
              key={c.interestId}
              href={`/dashboard/messages/${c.interestId}`}
              className="rounded-2xl border border-ink/10 p-4 flex gap-3 items-start hover:border-neutral-400 transition dark:hover:border-neutral-600"
            >
              <Avatar src={c.other.avatarUrl} name={c.other.name} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-medium truncate ${c.unreadCount > 0 ? "text-neutral-900 dark:text-neutral-100" : ""}`}>
                    {c.other.name}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded bg-ink px-1 text-[11px] font-medium text-paper">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 truncate dark:text-neutral-400">{c.requestTitle}</p>
                <p className={`text-sm mt-1 truncate ${c.unreadCount > 0 ? "text-neutral-900 font-medium dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"}`}>
                  {c.lastMessage ? c.lastMessage.body : "No messages yet — say hi"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
