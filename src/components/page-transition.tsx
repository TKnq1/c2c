"use client";

import { ViewTransition, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

// Only navigations from a <Link transitionTypes={["nav-forward"]}> (or
// "nav-back") slide — see the .nav-forward/.nav-back view-transition rules
// in globals.css. Everything else resolves to "none" and keeps just the
// CSS fade-in below.
const directional = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

// Keying on the pathname forces a remount on every real navigation (query
// string changes alone don't count, so this doesn't fight the welcome
// overlay's own ?welcome=1 -> replace() step), which retriggers the CSS
// fade-in below. The key sits on the ViewTransition, not the div, because
// React only fires enter/exit on the outermost boundary of what gets
// inserted/removed — with the whole tree below here remounting, a boundary
// inside an individual page would never count as entering.
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
  // On desktop Messages is two columns (see messages/layout.tsx): opening
  // another conversation should swap the thread, not remount and fade the
  // list next to it, so every Messages page shares one key there.
  // Discover likewise: a profile opened from the list shows as a panel over
  // it (see discover/@panel), so the list must stay mounted and scrolled.
  const discover = pathname.match(/^\/dashboard\/(creator|startup)\/discover(?=\/|$)/)?.[0];
  const key = discover ?? (isDesktop && pathname.startsWith("/dashboard/messages") ? "/dashboard/messages" : pathname);
  return (
    <ViewTransition key={key} enter={directional} exit={directional} default="none">
      <div className="page-transition-fade flex-1 min-h-0 flex flex-col">{children}</div>
    </ViewTransition>
  );
}
