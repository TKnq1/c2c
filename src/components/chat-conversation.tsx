"use client";

import { useLayoutEffect, useOptimistic, useRef, useState, useTransition, type ReactNode } from "react";
import { IoArrowDown, IoArrowUp } from "react-icons/io5";
import { sendMessageAction, type MessageActionState } from "@/lib/actions/messages";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { dayKey, formatDayLabel, formatMessageTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { ChatOfferCard, MakeOfferButton, type ChatOffer } from "@/components/chat-offer";

export type ChatMessage = { id: string; body: string; createdAt: number; isMine: boolean; read: boolean };
export type ChatEvent = { at: number; label: string; href?: string };

type FeedMessage = ChatMessage & { pending?: boolean };

type FeedItem =
  | { kind: "day"; key: string; label: string }
  | { kind: "unread"; key: string; count: number }
  | { kind: "event"; key: string; event: ChatEvent }
  | { kind: "offer"; key: string; offer: ChatOffer }
  | { kind: "message"; key: string; message: FeedMessage; seen: boolean; groupStart: boolean; groupEnd: boolean };

type UnreadAtOpen = { firstId: string; count: number } | null;

const NEAR_BOTTOM_PX = 80;
const MAX_COMPOSER_HEIGHT_PX = 140;
const DISMISS_DRAG_PX = 10;
// Back-to-back messages from the same side within this window read as one
// burst — tighter together, one timestamp under the last.
const GROUP_WINDOW_MS = 5 * 60 * 1000;

// http(s)://, www., or one of the social platforms creators share all the
// time typed bare with a path (tiktok.com/@name) — up to the next
// whitespace, minus trailing punctuation that almost always belongs to the
// sentence ("see example.com." / "(…)"). Other bare domains stay plain
// text, or "Node.js" and "e.g." would turn into links. Only these fixed
// prefixes ever become links, so nothing like javascript: can reach an href.
const URL_PATTERN =
  /\b(?:https?:\/\/|www\.|(?:tiktok|instagram|youtube|linkedin|twitter|x)\.com\/|youtu\.be\/)[^\s<]*[^\s<.,:;"')\]!?]/gi;

function pinToBottom(el: HTMLElement | null, behavior: ScrollBehavior = "auto") {
  el?.scrollTo({ top: el.scrollHeight, behavior });
}

function linkify(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0];
    const start = match.index;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <a
        key={start}
        href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="break-all underline underline-offset-2"
      >
        {url}
      </a>,
    );
    last = start + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// Squares off the corners where bubbles in one burst touch, like iMessage —
// the side facing the sender stays rounded only at the burst's outer ends.
function groupCorners(isMine: boolean, groupStart: boolean, groupEnd: boolean): string {
  if (groupStart && groupEnd) return "";
  if (isMine) return groupStart ? "rounded-br-[6px]" : groupEnd ? "rounded-tr-[6px]" : "rounded-r-[6px]";
  return groupStart ? "rounded-bl-[6px]" : groupEnd ? "rounded-tl-[6px]" : "rounded-l-[6px]";
}

// Messages, the current offer, and collab milestones in one chronological
// list — a divider wherever the calendar day changes on the viewer's own
// clock, plus one above the first message that was unread when the thread
// opened. Messages still being sent always sort last: their timestamp is
// the phone's clock, which can run a little behind the server's.
function buildFeed(
  messages: FeedMessage[],
  events: ChatEvent[],
  offer: ChatOffer | null,
  unread: UnreadAtOpen,
  timeZone: string,
): FeedItem[] {
  let lastSentMineIndex = -1;
  messages.forEach((m, i) => {
    if (m.isMine && !m.pending) lastSentMineIndex = i;
  });

  const entries: { sortAt: number; at: number; item: FeedItem }[] = [
    ...messages.map((m, i) => ({
      sortAt: m.pending ? Number.POSITIVE_INFINITY : m.createdAt,
      at: m.createdAt,
      item: {
        kind: "message" as const,
        key: m.id,
        message: m,
        seen: i === lastSentMineIndex && m.read,
        groupStart: true,
        groupEnd: true,
      },
    })),
    ...events.map((e) => ({
      sortAt: e.at,
      at: e.at,
      item: { kind: "event" as const, key: `event-${e.at}-${e.label}`, event: e },
    })),
    ...(offer
      ? [
          {
            sortAt: offer.at,
            at: offer.at,
            // Amount and proposer in the key: a counter-offer is a new card
            // (and animates in as one), a status change updates in place.
            item: { kind: "offer" as const, key: `offer-${offer.at}-${offer.amountCents}-${offer.offerRole}`, offer },
          },
        ]
      : []),
  ].sort((a, b) => a.sortAt - b.sortAt);

  const feed: FeedItem[] = [];
  let currentDay: string | null = null;
  for (const entry of entries) {
    const day = dayKey(entry.at, timeZone);
    if (day !== currentDay) {
      feed.push({ kind: "day", key: `day-${day}`, label: formatDayLabel(entry.at, timeZone) });
      currentDay = day;
    }
    if (unread && entry.item.key === unread.firstId) {
      feed.push({ kind: "unread", key: "unread-divider", count: unread.count });
    }
    feed.push(entry.item);
  }

  for (let i = 1; i < feed.length; i++) {
    const item = feed[i];
    const prev = feed[i - 1];
    if (
      item.kind === "message" &&
      prev.kind === "message" &&
      prev.message.isMine === item.message.isMine &&
      item.message.createdAt - prev.message.createdAt < GROUP_WINDOW_MS
    ) {
      item.groupStart = false;
      prev.groupEnd = false;
    }
  }
  return feed;
}

export function ChatConversation({
  interestId,
  messages,
  events,
  offer,
  makeOffer,
  requestTitle,
  blockedNotice,
}: {
  interestId: string;
  messages: ChatMessage[];
  events: ChatEvent[];
  offer: ChatOffer | null;
  makeOffer: { feeRatePercent: number } | null;
  requestTitle: string;
  blockedNotice: string | null;
}) {
  const timeZone = useViewerTimeZone();
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<FeedMessage[], FeedMessage>(
    messages,
    (current, message) => [...current, message],
  );
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [sendCount, setSendCount] = useState(0);

  // Snapshots from the moment the thread opened. The unread divider stays
  // where it was even after opening marks everything read; and only things
  // that show up after this point animate in, so opening a chat doesn't
  // replay its whole history.
  const [unreadAtOpen] = useState<UnreadAtOpen>(() => {
    const unread = messages.filter((m) => !m.isMine && !m.read);
    return unread.length > 0 ? { firstId: unread[0].id, count: unread.length } : null;
  });
  const [initialKeys] = useState(
    () => new Set(buildFeed(messages, events, offer, unreadAtOpen, timeZone).map((item) => item.key)),
  );
  const [initiallyReadIds] = useState(() => new Set(messages.filter((m) => m.read).map((m) => m.id)));

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const unreadDividerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);
  const hasScrolledInitiallyRef = useRef(false);

  const lastMessage = optimisticMessages.at(-1);
  const lastId = lastMessage?.id;
  const lastIsMine = lastMessage?.isMine ?? false;
  const [atBottom, setAtBottom] = useState(true);
  const [seenLastId, setSeenLastId] = useState(lastId);
  const showNewMessagePill = !atBottom && !lastIsMine && lastId !== seenLastId;

  const feed = buildFeed(optimisticMessages, events, offer, unreadAtOpen, timeZone);

  // Opening the thread lands on the first unread message (divider near the
  // top) when there is one, otherwise on the newest. After that it only
  // follows new messages if you were already at the bottom or just sent one
  // yourself — never yanks someone reading older history back down (they
  // get the "New message" pill instead).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!hasScrolledInitiallyRef.current) {
      hasScrolledInitiallyRef.current = true;
      const divider = unreadDividerRef.current;
      if (el && divider) {
        el.scrollTop += divider.getBoundingClientRect().top - el.getBoundingClientRect().top - 12;
        atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
      } else {
        pinToBottom(el);
      }
      return;
    }
    if (lastIsMine || atBottomRef.current) pinToBottom(el, "smooth");
  }, [lastId, lastIsMine]);

  // Stays pinned while the feed's box shrinks (phone keyboard opening, the
  // composer growing a line) or its content grows without a new message
  // (a "Seen" appearing).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const observer = new ResizeObserver(() => {
      if (atBottomRef.current) pinToBottom(el);
    });
    observer.observe(el);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  // Grows with the text up to ~5 lines, then scrolls inside. scrollHeight
  // leaves out the border, so it's added back — otherwise border-box sizing
  // clips the last line by those two pixels.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + el.offsetHeight - el.clientHeight, MAX_COMPOSER_HEIGHT_PX)}px`;
  }, [draft]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    atBottomRef.current = nearBottom;
    setAtBottom(nearBottom);
    if (nearBottom) setSeenLastId(lastId);
  };

  // Dragging through the conversation puts the keyboard away and gives the
  // messages the full screen again, like iMessage/WhatsApp. Only a real
  // drag — a tap on a link or the offer card's buttons leaves it up — and
  // only a finger: new messages scrolling the list in never close it.
  const touchStartYRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const startY = touchStartYRef.current;
    const y = e.touches[0]?.clientY;
    if (startY === null || y === undefined || Math.abs(y - startY) < DISMISS_DRAG_PX) return;
    if (document.activeElement === textareaRef.current) textareaRef.current?.blur();
  };

  // Shows up as a bubble immediately (useOptimistic) instead of after the
  // server round-trip; the real message replaces it once the send's own
  // revalidation lands. On failure the bubble drops out and the text comes
  // back into the box, so nothing typed is lost.
  const send = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setSendCount((count) => count + 1);
    startTransition(async () => {
      addOptimisticMessage({ id: `pending-${Date.now()}`, body, createdAt: Date.now(), isMine: true, read: false, pending: true });
      const formData = new FormData();
      formData.set("body", body);
      // A dropped connection rejects the action instead of returning an
      // error — and anything thrown inside startTransition goes to the
      // nearest error boundary, which would swap the whole chat for the
      // error page over one flaky send.
      let result: MessageActionState;
      try {
        result = await sendMessageAction(interestId, undefined, formData);
      } catch {
        result = { error: "Couldn't send — check your connection and try again." };
      }
      if (result?.error) {
        toast.error(result.error);
        setDraft((current) => current || body);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // isComposing: Enter confirming an IME candidate (Japanese, Chinese…)
    // is finishing a character, not the message.
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    // On phones the return key is the only way to type a line break, so
    // sending stays on the button there — same as WhatsApp/iMessage.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    e.preventDefault();
    send();
  };

  return (
    <>
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="h-full overflow-y-auto overscroll-contain px-4 md:px-0"
        >
          <div ref={contentRef} className="flex flex-col gap-0.5 py-4">
            {feed.map((item) => {
              const isNew = !initialKeys.has(item.key);

              if (item.kind === "day") {
                return (
                  <div key={item.key} className={`flex justify-center py-2 ${isNew ? "animate-fade-in" : ""}`}>
                    <span className="rounded-full bg-fog px-3 py-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      {item.label}
                    </span>
                  </div>
                );
              }

              if (item.kind === "unread") {
                return (
                  <div key={item.key} ref={unreadDividerRef} className="flex items-center gap-3 py-2">
                    <span className="h-px flex-1 bg-ink/15" />
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      {item.count} unread message{item.count === 1 ? "" : "s"}
                    </span>
                    <span className="h-px flex-1 bg-ink/15" />
                  </div>
                );
              }

              if (item.kind === "event") {
                const text = `${item.event.label} · ${formatMessageTime(item.event.at, timeZone)}`;
                return (
                  <p
                    key={item.key}
                    className={`py-1.5 text-center text-xs text-neutral-500 dark:text-neutral-400 ${isNew ? "animate-fade-in" : ""}`}
                  >
                    {item.event.href ? (
                      <a href={item.event.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {text}
                      </a>
                    ) : (
                      text
                    )}
                  </p>
                );
              }

              if (item.kind === "offer") {
                return (
                  <ChatOfferCard
                    key={item.key}
                    interestId={interestId}
                    offer={item.offer}
                    timeLabel={formatMessageTime(item.offer.at, timeZone)}
                    isNew={isNew}
                  />
                );
              }

              const m = item.message;
              // New incoming messages, and your own the moment you send
              // them, rise in. The confirmed copy that replaces your pending
              // bubble only settles from dimmed to solid instead — it's
              // already in place, so a second entrance would read as a jump.
              const riseIn = isNew && (m.pending || !m.isMine);
              const settle = isNew && !m.pending && m.isMine;
              return (
                <div
                  key={item.key}
                  className={`flex ${m.isMine ? "origin-bottom-right justify-end" : "origin-bottom-left justify-start"} ${
                    item.groupStart ? "mt-1.5" : ""
                  } ${riseIn ? "animate-bubble-in" : ""}`}
                >
                  <div
                    className={`max-w-[80%] rounded-[18px] px-3.5 py-2 ${groupCorners(m.isMine, item.groupStart, item.groupEnd)} ${
                      m.isMine ? "bg-ink text-paper" : "bg-fog text-neutral-900 dark:text-neutral-100"
                    } ${m.pending ? "opacity-60" : ""} ${settle ? "animate-bubble-confirm" : ""}`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">{linkify(m.body)}</p>
                    {item.groupEnd && (
                      <p
                        className={`mt-0.5 text-right text-[11px] ${
                          m.isMine ? "text-neutral-300 dark:text-neutral-500" : "text-neutral-500 dark:text-neutral-400"
                        }`}
                      >
                        {m.pending ? "Sending…" : formatMessageTime(m.createdAt, timeZone)}
                        {item.seen && (
                          <span className={initiallyReadIds.has(m.id) ? "" : "animate-fade-in"}> · Seen</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {optimisticMessages.length === 0 && (
              <p className="px-6 pt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No messages yet — say hi. This conversation is about &ldquo;{requestTitle}&rdquo;.
              </p>
            )}
          </div>
        </div>

        {showNewMessagePill && (
          <button
            type="button"
            onClick={() => pinToBottom(scrollRef.current, "smooth")}
            className="animate-pop-in absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper shadow-lg"
          >
            <IoArrowDown className="h-3.5 w-3.5" />
            New message
          </button>
        )}
      </div>

      <div className="chat-composer shrink-0 border-t border-ink/10 bg-background px-3 pt-2 pb-[max(var(--safe-bottom),8px)] md:px-0 md:pt-3 md:pb-0">
        {blockedNotice ? (
          <p className="py-2 text-center text-sm text-neutral-500 dark:text-neutral-400">{blockedNotice}</p>
        ) : (
          <>
            {makeOffer && (
              <div className="pb-2">
                <MakeOfferButton interestId={interestId} feeRatePercent={makeOffer.feeRatePercent} />
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2"
            >
              {/* text-base on phones, not text-sm: iOS zooms the whole page
                  into any field under 16px the moment it's focused. */}
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={2000}
                placeholder="Message…"
                aria-label="Message"
                className="max-h-[140px] flex-1 resize-none rounded-[20px] border border-neutral-300 bg-transparent px-4 py-2 text-base leading-6 md:text-sm md:leading-6 dark:border-neutral-700"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send message"
                // Keeps focus — and the phone keyboard — in the textarea
                // instead of handing it to the button on tap.
                onMouseDown={(e) => e.preventDefault()}
                // Springs up from slightly shrunk as soon as there's text to
                // send (overshooting easing), rather than just fading in.
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-[opacity,scale,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-graphite disabled:scale-90 disabled:opacity-30 disabled:hover:bg-ink"
              >
                {/* Keyed on the send count so every send remounts the icon
                    and replays its hop — none on the very first render. */}
                <IoArrowUp key={sendCount} className={`h-5 w-5 ${sendCount > 0 ? "animate-send-hop" : ""}`} />
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
