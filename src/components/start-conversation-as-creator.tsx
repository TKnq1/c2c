import Link from "next/link";
import { IoChatbubble } from "react-icons/io5";
import { startConversationAsCreatorAction } from "@/lib/actions/requests";

type Props = {
  existingInterestId: string | null;
  matchingRequests: { id: string; title: string }[];
};

// Full-width, like a profile's own Follow button (Instagram etc.) — sits
// on its own row under the header instead of competing for space with the
// favorite star up there. Same chat-bubble glyph as the Messages tab in
// the bottom nav (see TAB_ICONS in nav.tsx).
const wideButtonClassName =
  "flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-40 disabled:hover:bg-ink";

export function StartConversationAsCreator({ existingInterestId, matchingRequests }: Props) {
  if (existingInterestId) {
    return (
      <Link href={`/dashboard/messages/${existingInterestId}`} className={wideButtonClassName}>
        <IoChatbubble className="h-4 w-4" />
        Message
      </Link>
    );
  }

  // Always visible now, not hidden when there's nothing to message about —
  // dimmed and disabled instead, with the reason underneath, so the action
  // reads as "not available yet" rather than silently missing.
  if (matchingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <button type="button" disabled aria-label="You don't match any of their open requests yet" className={wideButtonClassName}>
          <IoChatbubble className="h-4 w-4" />
          Message
        </button>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">You don&apos;t match their requirements yet.</p>
      </div>
    );
  }

  // Defaults to the first match when there's more than one — the others
  // stay reachable via their own small button on the matching card in
  // Open Requests (see the detail page), rather than asking which one
  // first here.
  return (
    <form action={startConversationAsCreatorAction}>
      <input type="hidden" name="requestId" value={matchingRequests[0].id} />
      <button type="submit" className={wideButtonClassName}>
        <IoChatbubble className="h-4 w-4" />
        Message
      </button>
    </form>
  );
}
