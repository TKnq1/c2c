"use client";

import Link from "next/link";
import { FiX } from "react-icons/fi";
import { SwipeToDismiss } from "@/components/swipe-to-dismiss";
import { RelativeTime } from "@/components/relative-time";
import { useUndoableAction } from "@/lib/use-undoable-action";
import { deleteNotificationAction } from "@/lib/actions/notifications";
import { useI18n } from "@/components/i18n-provider";
import { localizeNotification } from "@/lib/i18n/labels";

type NotificationEntry = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationRow({ notification: n }: { notification: NotificationEntry }) {
  const { t } = useI18n();
  const { pending, trigger } = useUndoableAction(async () => {
    await deleteNotificationAction(n.id);
  });

  if (pending) return null;

  function dismiss() {
    trigger(t("screens.notifications.removed"), t("screens.notifications.restored"));
  }

  // A row in the Notifications group: unread ones get a dot and bold text
  // instead of a box of their own.
  const content = (
    <div className={`bg-fog px-4 py-3 text-sm transition ${n.link ? "hover:bg-ink/5" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        {!n.read && <span aria-label={t("screens.notifications.unread")} className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" />}
        <p className={`min-w-0 flex-1 ${n.read ? "text-neutral-700 dark:text-neutral-300" : "font-bold text-ink"}`}>{localizeNotification(n.message, t)}</p>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dismiss();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t("screens.notifications.dismiss")}
          className="shrink-0 -m-1 p-1 text-neutral-400 hover:text-ink transition dark:hover:text-white"
        >
          <FiX className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
        <RelativeTime ms={Date.parse(n.createdAt)} />
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
