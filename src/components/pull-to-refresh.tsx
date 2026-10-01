"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { haptic } from "@/lib/haptics";

// How far the page has to come down to refresh, and where it rests while
// it does — in pixels of page movement, not of finger travel (see rubber).
const TRIGGER = 64;
const HOLD = 56;
// A fast refresh still shows the spinner this long, rather than a blink.
const MIN_SPIN_MS = 600;
// <main>'s own top padding (pt-8): the spinner centres in the gap that and
// the pull open up under the header.
const PAGE_GAP = 32;
const SPINNER = 24;
// The arc's length all the way round (r = 6).
const ARC = 2 * Math.PI * 6;

// The pages worth reloading by hand: the lists, and what they open. Not
// the Feed (its cards take the drag), chats, forms or Settings.
export function canPullToRefresh(pathname: string) {
  return (
    pathname === "/dashboard/startup" ||
    pathname === "/dashboard/messages" ||
    pathname === "/dashboard/notifications" ||
    pathname === "/dashboard/creator/matches" ||
    /^\/dashboard\/(creator|startup)\/(payments|discover)(\/[^/]+)?$/.test(pathname) ||
    /^\/dashboard\/startup\/requests\/[^/]+$/.test(pathname)
  );
}

// iOS's rubber band: the page follows the finger less the further it goes.
function rubber(dy: number) {
  return (1 - 1 / ((dy * 0.55) / 400 + 1)) * 400;
}

// Somewhere inside the page that scrolls on its own and isn't at its top:
// a pull there scrolls that, not the page.
function inScrolledArea(el: Element | null, main: HTMLElement) {
  for (; el && el !== main; el = el.parentElement) if (el.scrollTop > 0) return true;
  return false;
}

// Pull a list down from its top to reload it, as in any iOS app (an
// installed web app has nothing of the kind, and no reload button either).
// The page comes down with the finger, a ring fills in above it, and
// letting go past the point refreshes the page's data in place. Rendered
// next to <main>, not inside it: <main> is what moves.
export function PullToRefresh() {
  return canPullToRefresh(usePathname()) ? <PullDown /> : null;
}

function PullDown() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const startedAtRef = useRef(0);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  // Moves the page and the ring; set once the listeners are attached.
  const moveRef = useRef<(offset: number, animate: boolean) => void>(() => {});

  useEffect(() => {
    const main = document.getElementById("main-content");
    const indicator = indicatorRef.current;
    const svg = svgRef.current;
    const arc = arcRef.current;
    if (!main || !indicator || !svg || !arc) return;

    const move = (offset: number, animate: boolean) => {
      const ease = "300ms cubic-bezier(0.2, 0.9, 0.3, 1)";
      main.style.transition = animate ? `transform ${ease}` : "none";
      main.style.transform = offset > 0 ? `translateY(${offset}px)` : "";
      indicator.style.transition = animate ? `transform ${ease}, opacity 300ms` : "none";
      indicator.style.transform = `translateY(${(offset + PAGE_GAP - SPINNER) / 2}px)`;
      indicator.style.opacity = String(Math.min(offset / TRIGGER, 1));
    };
    moveRef.current = move;

    // While pulling, the ring fills in and turns with the pull; letting go
    // past the point (see onTouchEnd) leaves a quarter of it spinning.
    const fill = (progress: number) => {
      arc.style.strokeDasharray = `${progress * 0.8 * ARC} ${ARC}`;
      svg.style.transform = `rotate(${progress * 270}deg)`;
    };

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let pulling = false;
    let offset = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (pulling) return;
      tracking = false;
      if (refreshingRef.current || e.touches.length !== 1 || main.scrollTop > 0) return;
      const target = e.target as Element;
      // Dialogs (details sheets and the like) live inside <main> too.
      if (target.closest("dialog, [data-no-pull-refresh]") || inScrolledArea(target, main)) return;
      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!pulling) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        // Up, or more sideways than down (a row swiped away, a photo
        // strip): not a pull, so the browser keeps it.
        if (dy <= 0 || Math.abs(dx) > dy || main.scrollTop > 0 || !e.cancelable) {
          tracking = false;
          return;
        }
        pulling = true;
      }
      // Otherwise the browser would bounce the page as well.
      if (e.cancelable) e.preventDefault();
      offset = rubber(Math.max(dy, 0));
      move(offset, false);
      fill(Math.min(offset / TRIGGER, 1));
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!pulling || e.touches.length > 0) return;
      tracking = pulling = false;
      if (offset < TRIGGER) {
        move(0, true);
        return;
      }
      // Still inside the user's gesture, which iOS needs for its tick.
      haptic();
      arc.style.strokeDasharray = `${ARC / 4} ${ARC}`;
      refreshingRef.current = true;
      startedAtRef.current = Date.now();
      setRefreshing(true);
      move(HOLD, true);
      startTransition(() => router.refresh());
      // The badges in the tab bar aren't part of the page; Nav refetches them.
      window.dispatchEvent(new Event("nav-counts:refresh"));
    };

    const onTouchCancel = () => {
      if (pulling) move(0, true);
      tracking = pulling = false;
    };

    main.addEventListener("touchstart", onTouchStart, { passive: true });
    main.addEventListener("touchmove", onTouchMove, { passive: false });
    main.addEventListener("touchend", onTouchEnd);
    main.addEventListener("touchcancel", onTouchCancel);
    return () => {
      main.removeEventListener("touchstart", onTouchStart);
      main.removeEventListener("touchmove", onTouchMove);
      main.removeEventListener("touchend", onTouchEnd);
      main.removeEventListener("touchcancel", onTouchCancel);
      main.style.transition = "";
      main.style.transform = "";
      moveRef.current = () => {};
    };
  }, [router]);

  // Done once the refreshed page is in: it slides back up, the ring fades.
  useEffect(() => {
    if (!refreshing || isPending) return;
    const timeout = setTimeout(
      () => {
        refreshingRef.current = false;
        setRefreshing(false);
        moveRef.current(0, true);
      },
      Math.max(0, startedAtRef.current + MIN_SPIN_MS - Date.now()),
    );
    return () => clearTimeout(timeout);
  }, [refreshing, isPending]);

  return (
    // Below the header's z-30, in case the two ever meet.
    <div
      ref={indicatorRef}
      className="pointer-events-none fixed inset-x-0 top-[var(--header-h)] z-20 flex justify-center opacity-0"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={`h-6 w-6 text-graphite ${refreshing ? "motion-safe:animate-spin" : ""}`}
      >
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.2" />
        <path
          ref={arcRef}
          d="M8 2a6 6 0 1 1 0 12a6 6 0 1 1 0-12"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={`0 ${ARC}`}
        />
      </svg>
      <span role="status" className="sr-only">
        {refreshing ? "Refreshing" : ""}
      </span>
    </div>
  );
}
