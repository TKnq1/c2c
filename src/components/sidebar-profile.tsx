"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IoChevronUp, IoLogOutOutline, IoSettingsOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { LogoutButton } from "@/components/logout-button";
import { useExitAnimation } from "@/lib/use-exit-animation";
import type { Me } from "@/app/api/me/route";

const ITEM = "flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition hover:bg-fog";

// The account at the bottom of the desktop sidebar: photo and name (photo
// only on tablets), opening a small menu upwards with Settings, Admin for
// admins, and Log out, the way Linear or Notion put the account last.
export function SidebarProfile({
  me,
  isAdmin,
  settingsHref,
  active,
  onNavigate,
}: {
  me: Me | null;
  isAdmin: boolean;
  settingsHref: string;
  // On Settings or Admin, so the button reads as the current place.
  active: boolean;
  onNavigate: (e: { preventDefault: () => void }) => void;
}) {
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

  const name = me?.name ?? "Account";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={name}
        className={`flex h-12 w-full items-center justify-center gap-3 rounded px-2 transition lg:justify-start ${
          active || open ? "bg-fog" : "hover:bg-fog"
        }`}
      >
        <Avatar src={me?.avatarUrl ?? null} name={name} size={32} />
        <span className="hidden min-w-0 flex-1 truncate text-left text-[15px] font-medium lg:block">{name}</span>
        <IoChevronUp
          className={`hidden h-4 w-4 shrink-0 text-graphite transition lg:block ${open ? "" : "rotate-180"}`}
          aria-hidden
        />
      </button>

      {menu.present && (
        <div
          role="menu"
          onAnimationEnd={menu.onExitEnd}
          className={`${
            menu.closing ? "animate-dropdown-out pointer-events-none" : "animate-dropdown-in"
          } absolute bottom-full left-0 z-40 mb-2 flex w-56 flex-col gap-0.5 rounded border border-ink/10 bg-background p-1 shadow-lg`}
        >
          <Link
            href={settingsHref}
            onNavigate={onNavigate}
            onClick={() => setOpen(false)}
            role="menuitem"
            className={ITEM}
          >
            <IoSettingsOutline className="h-4 w-4 shrink-0" aria-hidden />
            Settings
          </Link>
          {isAdmin && (
            <Link href="/admin" onNavigate={onNavigate} onClick={() => setOpen(false)} role="menuitem" className={ITEM}>
              <IoShieldCheckmarkOutline className="h-4 w-4 shrink-0" aria-hidden />
              Admin dashboard
            </Link>
          )}
          <div className="my-1 border-t border-ink/10" aria-hidden />
          <LogoutButton className={ITEM}>
            <IoLogOutOutline className="h-4 w-4 shrink-0" aria-hidden />
            Log out
          </LogoutButton>
        </div>
      )}
    </div>
  );
}
