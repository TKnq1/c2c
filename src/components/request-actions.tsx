"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IoCopyOutline, IoEllipsisHorizontal, IoLockClosedOutline, IoLockOpenOutline } from "react-icons/io5";
import { ActionButton } from "@/components/action-button";
import { closeRequestAction, duplicateRequestAction, reopenRequestAction } from "@/lib/actions/requests";
import { useExitAnimation } from "@/lib/use-exit-animation";

const ITEM = "flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition hover:bg-fog disabled:opacity-50";

// A request's actions on its detail page: Edit as the one obvious button,
// the occasional ones (duplicate, close/reopen) behind a "…" menu.
export function RequestActions({ requestId, isOpen }: { requestId: string; isOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const menu = useExitAnimation(open);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href={`/dashboard/startup/requests/${requestId}/edit`}
        className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-ink dark:border-neutral-700"
      >
        Edit
      </Link>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="More actions"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-neutral-300 transition hover:border-ink dark:border-neutral-700"
        >
          <IoEllipsisHorizontal className="h-4 w-4" aria-hidden />
        </button>
        {menu.present && (
          <div
            role="menu"
            onAnimationEnd={menu.onExitEnd}
            className={`${
              menu.closing ? "animate-dropdown-out pointer-events-none" : "animate-dropdown-in"
            } absolute right-0 top-full z-20 mt-2 flex w-52 flex-col gap-0.5 rounded border border-ink/10 bg-background p-1 shadow-lg`}
          >
            <form action={duplicateRequestAction.bind(null, requestId)}>
              <button type="submit" role="menuitem" className={ITEM}>
                <IoCopyOutline className="h-4 w-4 shrink-0" aria-hidden />
                Duplicate
              </button>
            </form>
            <ActionButton
              action={isOpen ? closeRequestAction.bind(null, requestId) : reopenRequestAction.bind(null, requestId)}
              successMessage={isOpen ? "Request closed." : "Request reopened."}
              onSuccess={() => setOpen(false)}
              className={ITEM}
            >
              {isOpen ? (
                <IoLockClosedOutline className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <IoLockOpenOutline className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {isOpen ? "Close request" : "Reopen request"}
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}
