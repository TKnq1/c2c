"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoEllipsisHorizontal } from "react-icons/io5";
import {
  reportUserAction,
  blockUserAction,
  unblockUserAction,
  type ReportActionState,
} from "@/lib/actions/moderation";
import { TextareaWithCounter } from "@/components/textarea-with-counter";
import { Dialog } from "@/components/dialog";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";
import { useExitAnimation } from "@/lib/use-exit-animation";

const REASONS = ["Spam", "Harassment or abuse", "Scam or fraud", "Inappropriate content", "Other"];

const menuItemClassName =
  "block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800";

// One "⋯" button instead of two loose Report/Block text links. Blocking
// asks first — it's a single tap otherwise, sitting right next to Report.
// Unblocking doesn't, since it only restores what was there before.
export function ReportBlockActions({
  otherUserId,
  otherName,
  initialBlockedByMe,
  bordered = false,
}: {
  otherUserId: string;
  otherName: string;
  // Only a block this viewer placed — unblockUserAction can't lift one the
  // other side placed, so a mutual isBlocked() here would offer an
  // "Unblock" that silently does nothing.
  initialBlockedByMe: boolean;
  bordered?: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useExitAnimation(menuOpen);
  const [dialog, setDialog] = useState<"report" | "block" | null>(null);
  const [blocked, setBlocked] = useState(initialBlockedByMe);
  const [blockPending, setBlockPending] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const setBlockedTo = async (next: boolean) => {
    setBlockPending(true);
    setBlockError(null);
    try {
      if (next) await blockUserAction(otherUserId);
      else await unblockUserAction(otherUserId);
      setBlocked(next);
      setDialog(null);
      toast.success(next ? `Blocked ${otherName}.` : `Unblocked ${otherName}.`);
      // The actions only revalidate list pages, not whatever page this
      // menu sits on — refresh so e.g. a chat's composer swaps to (or back
      // from) its blocked notice right away.
      router.refresh();
    } catch (err) {
      // Blocking fails inside its confirmation sheet, which sits in the
      // browser's top layer above any toast — so the error goes in the
      // sheet. Unblocking has no sheet open, so a toast is visible there.
      if (next) setBlockError(errorMessage(err));
      else toast.error(errorMessage(err));
    } finally {
      setBlockPending(false);
    }
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="More actions"
        className={`flex h-10 w-10 items-center justify-center rounded-full text-graphite transition hover:text-ink ${
          bordered ? "border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700" : "hover:bg-fog"
        }`}
      >
        <IoEllipsisHorizontal className="h-5 w-5" />
      </button>

      {menu.present && (
        <div
          role="menu"
          onAnimationEnd={menu.onExitEnd}
          className={`${
            menu.closing ? "animate-dropdown-out pointer-events-none" : "animate-dropdown-in"
          } absolute right-0 z-20 mt-1 min-w-40 rounded-[14px] border border-ink/10 bg-white py-1 dark:bg-neutral-900`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setDialog("report");
            }}
            className={menuItemClassName}
          >
            Report
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={blockPending}
            onClick={() => {
              setMenuOpen(false);
              if (blocked) setBlockedTo(false);
              else {
                setBlockError(null);
                setDialog("block");
              }
            }}
            className={`${menuItemClassName} disabled:opacity-50`}
          >
            {blocked ? "Unblock" : "Block"}
          </button>
        </div>
      )}

      <Dialog open={dialog === "report"} onClose={() => setDialog(null)} title={`Report ${otherName}`}>
        <ReportForm otherUserId={otherUserId} onSent={() => setDialog(null)} />
      </Dialog>

      <Dialog open={dialog === "block"} onClose={() => setDialog(null)} title={`Block ${otherName}?`}>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          You won&apos;t be able to message each other, and you&apos;ll stop seeing each other in Discover. You can
          unblock them anytime from this menu.
        </p>
        {blockError && <p className="text-sm font-medium text-ink">{blockError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDialog(null)}
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setBlockedTo(true)}
            disabled={blockPending}
            className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
          >
            {blockPending ? "Blocking…" : "Block"}
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function ReportForm({ otherUserId, onSent }: { otherUserId: string; onSent: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (prev: ReportActionState, formData: FormData) => {
      let result: ReportActionState;
      try {
        result = await reportUserAction(otherUserId, prev, formData);
      } catch (err) {
        // A dropped connection throws instead of returning an error state.
        return { error: errorMessage(err) };
      }
      if (result?.success) {
        toast.success("Report sent — our team will take a look.");
        onSent();
      }
      return result;
    },
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {/* text-base on phones, not text-sm: iOS zooms the whole page into any
          field under 16px on focus. */}
      <select
        name="reason"
        required
        defaultValue=""
        aria-label="Reason for report"
        className="rounded-[14px] border border-neutral-300 bg-white px-3 py-2.5 text-base md:text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="" disabled>
          Reason
        </option>
        {REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <TextareaWithCounter
        name="details"
        rows={3}
        maxLength={500}
        placeholder="Optional details"
        aria-label="Details"
        className="resize-none rounded-[14px] border border-neutral-300 px-3 py-2.5 text-base md:text-sm dark:border-neutral-700"
      />
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
