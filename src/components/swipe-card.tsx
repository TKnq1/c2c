"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FiHeart, FiX } from "react-icons/fi";
import { IoCubeOutline, IoLanguageOutline, IoPeopleOutline } from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { RatingSummary } from "@/components/stars";
import { Dialog } from "@/components/dialog";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";

export type SwipeRequest = {
  id: string;
  startupId: string;
  isBrandFavorited: boolean;
  title: string;
  description: string;
  niche: string;
  languages: string[];
  minFollowers: number;
  productCategory: string;
  companyName: string;
  companyAvatarUrl: string | null;
  rating: { average: number; count: number };
  imageUrl: string | null;
};

const SWIPE_THRESHOLD = 100;
const TAP_MAX_MOVEMENT = 6;
const FLY_OUT_DISTANCE = 600;
const EXIT_MS = 250;
// A fast flick commits the swipe even short of SWIPE_THRESHOLD — matching
// Tinder's own feel, where a quick flick counts and a slow drag needs the
// full distance. Velocity is px/ms measured over the last VELOCITY_WINDOW_MS
// of movement (see handlePointerMove), not the whole drag from the start,
// so a drag that begins slowly and ends in a fast flick still reads as one.
const FLICK_VELOCITY = 0.5;
const MIN_FLICK_DISTANCE = 24;
const VELOCITY_WINDOW_MS = 100;
// Floor for a velocity-shortened exit (see commitSwipe) — fast enough to
// read as a flick continuing its own momentum, not so fast the card just
// vanishes with nothing to follow.
const MIN_EXIT_MS = 120;
// How much the card grows while actively held — a subtle "picked up off the
// stack" cue. Only applied while dragging; the transform's own transition
// (return spring or exit ease) carries it back to 1 once released.
const DRAG_LIFT_SCALE = 1.03;

// Lets a parent (the Pass/Interested buttons, which aren't part of this
// card's own pointer handling) trigger the exact same fly-out exit as a
// completed drag, instead of the two paths diverging — a ref + imperative
// handle is the standard fit here, same as React's own docs recommend for
// "parent tells this specific child to play an animation."
export type SwipeCardHandle = {
  triggerExit: (direction: "left" | "right") => void;
};

export const SwipeCard = forwardRef<SwipeCardHandle, {
  request: SwipeRequest;
  stackIndex: number;
  onSwipe: (direction: "left" | "right") => void;
  // Set only for the one card a parent just put back — undoing a pass, or
  // an "interested" swipe that failed to send — to the side it flew off
  // to. This is a brand new mount (the card was fully removed from the
  // stack array, so it comes back as a fresh instance, not the same one
  // re-appearing), so without this it would just pop into place at rest
  // with no transition to animate through. Starting it off-screen on that
  // side and stepping back to center one frame later gives it the same fly
  // (reversed) that swiping it away had, using the exact spring curve
  // below — it reads as the swipe undoing itself, not a separate effect.
  restoredFrom?: "left" | "right";
}>(function SwipeCard({ request, stackIndex, onSwipe, restoredFrom }, ref) {
  const isTop = stackIndex === 0;
  const [drag, setDrag] = useState(() =>
    restoredFrom
      ? { x: restoredFrom === "left" ? -FLY_OUT_DISTANCE : FLY_OUT_DISTANCE, y: 0, dragging: false }
      : { x: 0, y: 0, dragging: false },
  );
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  // Normally just EXIT_MS (see commitSwipe) — shortened when the release
  // was fast enough to measure, so the exit continues at roughly the speed
  // the card was already moving instead of the transition restarting from
  // a standstill.
  const [exitMs, setExitMs] = useState(EXIT_MS);
  const [showDetails, setShowDetails] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  // handlePointerUp needs the position from the very last pointermove, not
  // a possibly-stale one — on a fast flick, pointerup can fire before
  // React has re-rendered (and hooked up a new closure) after the last
  // setDrag call, so reading drag.x there sometimes saw an older value
  // than what was actually dragged, quietly failing to commit swipes that
  // had clearly crossed the threshold. A ref is always current the
  // instant it's written, with no render/closure lag to race against.
  const dragRef = useRef({ x: 0, y: 0 });
  // Rolling window of recent {x, t} samples, used only to measure velocity
  // at release (see handlePointerUp) — trimmed in handlePointerMove to the
  // last VELOCITY_WINDOW_MS so an early slow start doesn't dilute a flick
  // at the end of the drag.
  const historyRef = useRef<{ x: number; t: number }[]>([]);
  // Direct handle to the card's own DOM node — handlePointerMove writes
  // transform onto it straight away instead of going through setDrag on
  // every sample (see there for why: routing every pointermove through
  // React state was the actual source of the choppiness, not the release
  // curve). React still owns transform at rest, mid snap-back/exit, and at
  // drag start/end — see the style object below.
  const cardElRef = useRef<HTMLDivElement | null>(null);
  // Which side of the commit threshold the live drag is currently past, if
  // either — drives the heart/X stamp. A ref for the per-move check (cheap,
  // no re-render) plus state that only actually updates on the rare frame
  // where the side flips, instead of setDrag's old every-pixel updates.
  const thresholdSideRef = useRef<"like" | "pass" | null>(null);
  const [thresholdSide, setThresholdSide] = useState<"like" | "pass" | null>(null);

  // Runs once, only for a card that mounted off-screen (see the drag
  // initializer above) — requestAnimationFrame so the off-screen position
  // actually paints first; setting x:0 in the same tick as the initial
  // render would never give the browser anything to transition from.
  useEffect(() => {
    if (!restoredFrom) return;
    const id = requestAnimationFrame(() => {
      dragRef.current = { x: 0, y: 0 };
      setDrag({ x: 0, y: 0, dragging: false });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately mount-only, matching the lazy initializer above
  }, []);

  // velocityPxMs is the measured release speed (see handlePointerUp) — left
  // at 0 for a button-triggered exit (triggerExit below), which has no drag
  // to measure and always gets the plain fixed-duration exit.
  // Once per card, whichever way it's triggered (drag, the stack's buttons,
  // the details sheet) — a double tap would otherwise fire onSwipe twice,
  // i.e. send the same interest twice. A ref, not the exiting state, since
  // two taps can land before a re-render.
  const committedRef = useRef(false);

  function commitSwipe(direction: "left" | "right", velocityPxMs = 0) {
    if (committedRef.current) return;
    committedRef.current = true;
    const speed = Math.abs(velocityPxMs);
    let duration = EXIT_MS;
    if (speed > FLICK_VELOCITY) {
      const remaining = FLY_OUT_DISTANCE - Math.abs(dragRef.current.x);
      duration = Math.min(EXIT_MS, Math.max(MIN_EXIT_MS, remaining / speed));
    }
    // Hands transform back to React at exactly the position the manual
    // drag last painted (see handlePointerMove) — offsetX ignores this x
    // once exiting is set below, but y carries the release's vertical
    // offset into the exit so a diagonal flick keeps flying on the same
    // diagonal instead of snapping level the instant you let go.
    setDrag({ x: dragRef.current.x, y: dragRef.current.y, dragging: false });
    setExiting(direction);
    setExitMs(duration);
    setTimeout(() => onSwipe(direction), duration);
  }

  useImperativeHandle(ref, () => ({
    triggerExit: (direction) => {
      if (!exiting) commitSwipe(direction);
    },
  }));

  function handlePointerDown(e: React.PointerEvent) {
    if (!isTop || exiting) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    dragRef.current = { x: 0, y: 0 };
    historyRef.current = [{ x: e.clientX, t: e.timeStamp }];
    thresholdSideRef.current = null;
    setThresholdSide(null);
    // Applied directly (not via the setDrag re-render below) so the lift
    // shows the instant a finger lands, not one pointermove later.
    if (cardElRef.current) {
      cardElRef.current.style.transform = `translate(0px, 0px) rotate(0deg) scale(${DRAG_LIFT_SCALE})`;
    }
    setDrag({ x: 0, y: 0, dragging: true });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isTop || !startRef.current) return;
    const x = e.clientX - startRef.current.x;
    const y = e.clientY - startRef.current.y;
    if (Math.abs(x) > TAP_MAX_MOVEMENT || Math.abs(y) > TAP_MAX_MOVEMENT) movedRef.current = true;
    dragRef.current = { x, y };
    const cutoff = e.timeStamp - VELOCITY_WINDOW_MS;
    const history = historyRef.current;
    history.push({ x: e.clientX, t: e.timeStamp });
    while (history.length > 2 && history[0].t < cutoff) history.shift();

    // Mutate the DOM node directly rather than calling setDrag here — a
    // native pointermove stream can fire faster than React wants to
    // re-render a whole component, and routing every single sample through
    // setState was exactly what made the drag itself feel choppy (not just
    // the release, which the exit-duration change above already covers).
    // This bypasses React's render/commit cycle for the 1:1 tracking and
    // rides the browser's own compositor path instead. React is only
    // brought back in for things that aren't raw position — the threshold
    // flip below, and handlePointerUp.
    if (cardElRef.current) {
      const rotate = x / 18;
      cardElRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${DRAG_LIFT_SCALE})`;
    }

    const side: "like" | "pass" | null = x >= SWIPE_THRESHOLD ? "like" : -x >= SWIPE_THRESHOLD ? "pass" : null;
    if (side !== thresholdSideRef.current) {
      thresholdSideRef.current = side;
      setThresholdSide(side);
    }
  }

  function handlePointerUp() {
    if (!isTop || !startRef.current) return;
    startRef.current = null;
    const { x: dragX } = dragRef.current;
    const history = historyRef.current;
    const oldest = history[0];
    const newest = history[history.length - 1];
    const dt = oldest && newest ? newest.t - oldest.t : 0;
    const velocity = dt > 0 ? (newest.x - oldest.x) / dt : 0;
    const isFlick =
      Math.abs(dragX) > MIN_FLICK_DISTANCE &&
      Math.abs(velocity) > FLICK_VELOCITY &&
      Math.sign(velocity) === Math.sign(dragX);
    if (Math.abs(dragX) > SWIPE_THRESHOLD || isFlick) {
      commitSwipe(dragX > 0 ? "right" : "left", velocity);
    } else {
      thresholdSideRef.current = null;
      setThresholdSide(null);
      // Resets the ref too, not just the state — a later button-triggered
      // commitSwipe (no drag of its own) reads dragRef for its exit
      // position, and it would otherwise stay pointed at wherever this
      // snapped-back drag last reached.
      dragRef.current = { x: 0, y: 0 };
      setDrag({ x: 0, y: 0, dragging: false });
      // A real drag (even one that snapped back without crossing the swipe
      // threshold) shouldn't also open the modal — only a clean tap does.
      if (!movedRef.current) setShowDetails(true);
    }
  }

  const offsetX = exiting ? (exiting === "right" ? FLY_OUT_DISTANCE : -FLY_OUT_DISTANCE) : drag.x;
  const rotate = offsetX / 18;
  const scale = 1 - stackIndex * 0.04;
  const restY = stackIndex * 10;

  // Only the snap-back (drag released short of the threshold) gets the
  // spring overshoot — it's settling INTO a resting position, where a
  // slight rebound past center reads as elastic. The exit stays a plain
  // ease: it's leaving the screen, not settling anywhere, so overshooting
  // past FLY_OUT_DISTANCE would just be an unnecessary wobble at the edge.
  const returnTransition = `transform ${EXIT_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
  // ease (slow start) is right for the plain/button exit — nothing was
  // moving beforehand, so easing into motion reads fine. A velocity-
  // shortened exit (see commitSwipe) already has real momentum behind it;
  // starting that one with another slow ramp-up reads as a stutter right
  // at the moment of release, so it goes out at the constant speed the
  // shortened duration was computed for instead.
  const exitTransition = `transform ${exitMs}ms ${exitMs < EXIT_MS ? "linear" : "ease"}`;

  const style: React.CSSProperties = isTop
    ? {
        // While actively dragging, transform is owned entirely by the
        // direct DOM writes in handlePointerMove (see there) — omitting
        // the key here, rather than setting it to the same value, is what
        // keeps React from clobbering those writes on the threshold-flip
        // re-renders. It comes back the instant dragging ends (below),
        // which is exactly the render that hands off to the CSS
        // snap-back/exit transition.
        ...(drag.dragging
          ? {}
          : { transform: `translate(${offsetX}px, ${drag.y}px) rotate(${rotate}deg) scale(1)` }),
        transition: drag.dragging ? "none" : exiting ? exitTransition : returnTransition,
        touchAction: "none",
        cursor: drag.dragging ? "grabbing" : "grab",
        willChange: "transform",
        zIndex: 10,
      }
    : {
        transform: `translateY(${restY}px) scale(${scale})`,
        transition: "transform 200ms ease",
        zIndex: 10 - stackIndex,
      };

  // The color wash switches on once the drag actually crosses the commit
  // threshold — the same point handlePointerUp itself checks — rather than
  // tracking distance continuously, so it reads as a discrete "this will go
  // through" signal. thresholdSide tracks that live (see handlePointerMove);
  // offsetX alone isn't enough once dragging no longer flows through React
  // state, but exiting still forces the tint to stay up for the whole exit
  // flight, same as before, regardless of how the commit was triggered.
  const pastLikeThreshold = exiting === "right" || (drag.dragging && thresholdSide === "like");
  const pastPassThreshold = exiting === "left" || (drag.dragging && thresholdSide === "pass");

  const NicheIcon = NICHE_ICONS[request.niche] ?? DEFAULT_NICHE_ICON;

  return (
    <div
      ref={cardElRef}
      className="absolute inset-0 flex select-none flex-col overflow-hidden rounded-b-[28px] border border-ink/10 bg-paper shadow-xl"
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {isTop && (
        <>
          {/* Both stay mounted the whole time and only opacity moves —
              same reasoning as the nav icons' cross-fade — so the color
              can ease in AND back out smoothly instead of a conditional
              render's hard cut. pointer-events-none keeps a full-card
              overlay from ever being what a tap/drag actually lands on. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 bg-emerald-500 transition-opacity duration-150"
            style={{ opacity: pastLikeThreshold ? 0.35 : 0 }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 bg-rose-500 transition-opacity duration-150"
            style={{ opacity: pastPassThreshold ? 0.35 : 0 }}
          />
        </>
      )}

      {request.imageUrl ? (
        // Full-bleed — the image fills the card and everything else reads
        // as an overlay on top of it, not a separate section below it.
        <div className="relative min-h-0 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={request.imageUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
          />
          {/* All three children share one grid cell so the fade tracks the
              content's real (dynamic — avatar/title/tags wrap differently
              per card) height exactly, instead of guessing a fixed
              fraction of the card — lines up with the top of the content
              every time. z-index is explicit on each layer rather than
              relying on source order, since backdrop-filter through a
              mask turned out to composite unpredictably (rendered as a
              visible seam instead of a smooth fade) — a second, directly
              blurred copy of the image plus a plain gradient tint is more
              predictable than backdrop-blur here. */}
          <div className="absolute inset-x-0 bottom-0 grid">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={request.imageUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="relative z-0 col-start-1 row-start-1 h-full w-full select-none object-cover blur-xl"
              style={{
                maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
              }}
            />
            <div
              aria-hidden="true"
              className="relative z-[1] col-start-1 row-start-1 bg-gradient-to-t from-black/70 to-transparent"
            />
            <div className="relative z-10 col-start-1 row-start-1 flex flex-col gap-4 px-6 pt-6 pb-8 text-white">
              <div className="flex items-center gap-3.5">
                <Avatar src={request.companyAvatarUrl} name={request.companyName} size={56} />
                <div className="min-w-0">
                  <p className="text-base text-white/70">{request.companyName}</p>
                  <h3 className="font-display text-body font-bold">{request.title}</h3>
                  <RatingSummary average={request.rating.average} count={request.rating.count} light />
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 text-sm text-white/90">
                <span className="inline-flex items-center gap-1.5 rounded bg-white/25 px-3 py-1.5 backdrop-blur-sm">
                  <NicheIcon className="h-3.5 w-3.5 shrink-0" />
                  {request.niche}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded border border-white/40 px-2.5 py-1.5">
                  <IoPeopleOutline className="h-3.5 w-3.5 shrink-0" />
                  Min. {request.minFollowers.toLocaleString("en-US")} followers
                </span>
                <span className="inline-flex items-center gap-1.5 rounded border border-white/40 px-2.5 py-1.5">
                  <IoCubeOutline className="h-3.5 w-3.5 shrink-0" />
                  {request.productCategory}
                </span>
                {request.languages.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1.5 rounded border border-white/40 px-2.5 py-1.5">
                    <IoLanguageOutline className="h-3.5 w-3.5 shrink-0" />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pt-6 pb-8">
          <div className="flex items-center gap-3.5">
            <Avatar src={request.companyAvatarUrl} name={request.companyName} size={56} />
            <div className="min-w-0">
              <p className="text-base text-neutral-500 dark:text-neutral-400">{request.companyName}</p>
              <h3 className="font-display text-body font-bold">{request.title}</h3>
              <RatingSummary average={request.rating.average} count={request.rating.count} />
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-2.5 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5 rounded bg-fog px-3 py-1.5 text-neutral-700 dark:text-neutral-300">
              <NicheIcon className="h-3.5 w-3.5 shrink-0" />
              {request.niche}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5">
              <IoPeopleOutline className="h-3.5 w-3.5 shrink-0" />
              Min. {request.minFollowers.toLocaleString("en-US")} followers
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5">
              <IoCubeOutline className="h-3.5 w-3.5 shrink-0" />
              {request.productCategory}
            </span>
            {request.languages.map((l) => (
              <span key={l} className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5">
                <IoLanguageOutline className="h-3.5 w-3.5 shrink-0" />
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* The details sheet is a native <dialog>, so it renders in the top
          layer — clear of this card's transform and overflow-hidden without
          needing a portal. It's still a React (and DOM) descendant of the
          card, though, so a tap inside it would bubble into the card's own
          pointerdown and start a drag; the display:contents wrapper stops
          that without adding a box to the card's layout. */}
      <div className="contents" onPointerDown={(e) => e.stopPropagation()}>
        <Dialog
          open={showDetails}
          onClose={() => setShowDetails(false)}
          title={request.title}
          media={
            request.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={request.imageUrl} alt="" className="h-48 w-full shrink-0 object-cover" />
            ) : undefined
          }
        >
          <div className="flex items-center gap-3">
            <Avatar src={request.companyAvatarUrl} name={request.companyName} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{request.companyName}</p>
              <RatingSummary average={request.rating.average} count={request.rating.count} />
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">{request.description}</p>
          <div className="flex flex-wrap gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5 rounded bg-fog px-3 py-1.5 text-neutral-700 dark:text-neutral-300">
              <NicheIcon className="h-3.5 w-3.5 shrink-0" />
              {request.niche}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5">
              <IoPeopleOutline className="h-3.5 w-3.5 shrink-0" />
              Min. {request.minFollowers.toLocaleString("en-US")} followers
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5">
              <IoCubeOutline className="h-3.5 w-3.5 shrink-0" />
              {request.productCategory}
            </span>
            {request.languages.map((l) => (
              <span key={l} className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5">
                <IoLanguageOutline className="h-3.5 w-3.5 shrink-0" />
                {l}
              </span>
            ))}
          </div>
          {/* Decide straight from the details instead of closing them first
              — same exit as swiping, so the card flies off behind the sheet
              as it slides away. */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowDetails(false);
                commitSwipe("left");
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
            >
              <FiX className="h-4 w-4" />
              Pass
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDetails(false);
                commitSwipe("right");
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite"
            >
              <FiHeart className="h-4 w-4" />
              Interested
            </button>
          </div>
        </Dialog>
      </div>
    </div>
  );
});
