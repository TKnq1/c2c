"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { FiBell } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { useI18n } from "@/components/i18n-provider";
import { markNotificationsReadAction } from "@/lib/actions/notifications";
import { NotificationRow } from "@/components/notification-row";
import { SidebarTooltip } from "@/components/sidebar-tooltip";
import type { NotificationItem } from "@/app/api/notifications/route";

// The sidebar's Notifications item: instead of leaving the page, it opens
// the latest notifications in a panel beside the sidebar. Opening marks
// them read (as the full page does) and refreshes the nav badges.
export function NotificationsPanelButton({
  unreadCount,
  icon: Icon,
  activeIcon: ActiveIcon,
  active,
}: {
  unreadCount: number;
  icon: IconType;
  activeIcon: IconType;
  active: boolean;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Open for the page it was opened on: any navigation (a notification's
  // link, the sidebar) closes it without an effect to reset it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // The dimmed page is only the area beside the sidebar. A press anywhere
    // else — the page, or the navbar itself — closes the panel. The
    // notifications button keeps its own toggle.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpenOn(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: NotificationItem[]) => {
        if (cancelled) return;
        setItems(data);
        if (data.some((n) => !n.read)) {
          markNotificationsReadAction().then(() => window.dispatchEvent(new Event("nav-counts:refresh")));
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const Shown = open || active ? ActiveIcon : Icon;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpenOn(open ? null : pathname)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? t("nav.notificationsNew", { count: unreadCount }) : t("nav.notifications")}
        className={`group relative flex h-11 w-full items-center justify-center gap-3.5 rounded px-3 text-sm transition lg:justify-start ${
          open || active ? "bg-fog font-semibold text-ink" : "text-graphite hover:bg-fog hover:text-ink"
        }`}
      >
        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
          <Shown className="h-6 w-6" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-ink px-0.5 text-[9px] font-semibold text-paper lg:hidden">
              {badge}
            </span>
          )}
        </span>
        <span className="hidden flex-1 text-left lg:inline">{t("nav.notifications")}</span>
        {unreadCount > 0 && (
          <span className="hidden h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-paper lg:flex">
            {badge}
          </span>
        )}
        {!open && <SidebarTooltip label={t("nav.notifications")} />}
      </button>

      {open && (
        // pointer-events-none on the shell, so a click on the sidebar reaches
        // the navbar (and the listener above closes the panel). The dimmed
        // page and the panel itself still take their own clicks.
        <div className="pointer-events-none fixed inset-0 z-40 no-print">
          <div aria-hidden className="pointer-events-auto animate-backdrop-in absolute inset-0 left-[var(--sidebar-w)] bg-black/20" onClick={() => setOpenOn(null)} />
          <div
            ref={panelRef}
            role="dialog"
            aria-label={t("notifications.title")}
            className="pointer-events-auto animate-panel-in absolute inset-y-0 left-[var(--sidebar-w)] flex w-96 max-w-[calc(100vw-var(--sidebar-w))] flex-col border-r border-ink/10 bg-background shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink/10 px-5 py-3">
              <h2 className="font-display text-title-2 font-bold">{t("notifications.title")}</h2>
              <button
                type="button"
                onClick={() => setOpenOn(null)}
                aria-label={t("common.close")}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-fog"
              >
                <IoClose className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {items === null ? (
                <div className="flex flex-col gap-2 p-4" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded bg-fog" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  <FiBell className="h-6 w-6" aria-hidden />
                  {t("notifications.empty")}
                </div>
              ) : (
                <div className="divide-y divide-ink/10">
                  {items.map((n) => (
                    <NotificationRow key={n.id} notification={n} />
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/dashboard/notifications"
              className="shrink-0 border-t border-ink/10 px-5 py-3 text-center text-sm font-medium transition hover:bg-fog"
            >
              {t("notifications.seeAll")}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
