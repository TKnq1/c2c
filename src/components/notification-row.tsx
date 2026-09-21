"use client";

import Link from "next/link";
import { FiX } from "react-icons/fi";
import { SwipeToDismiss } from "@/components/swipe-to-dismiss";
import { useUndoableAction } from "@/lib/use-undoable-action";
import { deleteNotificationAction } from "@/lib/actions/notifications";

type NotificationEntry = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationRow({ notification: n }: { notification: NotificationEntry }) {
  const { pending, trigger } = useUndoableAction(async () => {
    await deleteNotificationAction(n.id);
  });

  if (pending) return null;

  function dismiss() {
    trigger("Notification removed.", "Notification restored.");
  }

  const content = (
    <div
      className={`rounded-2xl border p-3 text-sm transition ${
        n.read ? "border-ink/10" : "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50"
      } ${n.link ? "hover:border-neutral-400" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-neutral-800 dark:text-neutral-200">{n.message}</p>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dismiss();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Dismiss notification"
          className="shrink-0 -m-1 p-1 text-neutral-400 hover:text-ink transition dark:hover:text-white"
        >
          <FiX className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
        {new Date(n.createdAt).toLocaleString("en-US")}
      </p>
    </div>
  );

  return (
    <SwipeToDismiss onDismiss={dismiss}>
      {n.link ? (
        // prefetch={false}: unbounded, per-notification hrefs pointing at
        // all sorts of dynamic destinations — default viewport prefetch
        // would server-render every one of them just from opening this page.
        <Link href={n.link} prefetch={false}>
          {content}
        </Link>
      ) : (
        content
      )}
    </SwipeToDismiss>
  );
}
