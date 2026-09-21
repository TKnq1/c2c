"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/avatar";

export type SwipeRequest = {
  id: string;
  title: string;
  description: string;
  niche: string;
  languages: string[];
  minFollowers: number;
  productCategory: string;
  companyName: string;
  companyAvatarUrl: string | null;
};

const SWIPE_THRESHOLD = 100;
const FLY_OUT_DISTANCE = 600;
const EXIT_MS = 250;

export function SwipeCard({
  request,
  stackIndex,
  onSwipe,
}: {
  request: SwipeRequest;
  stackIndex: number;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const isTop = stackIndex === 0;
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const isLongDescription = request.description.length > 160;

  function commitSwipe(direction: "left" | "right") {
    setExiting(direction);
    setTimeout(() => onSwipe(direction), EXIT_MS);
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!isTop || exiting) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, dragging: true });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isTop || !startRef.current) return;
    setDrag({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y, dragging: true });
  }

  function handlePointerUp() {
    if (!isTop || !startRef.current) return;
    startRef.current = null;
    if (Math.abs(drag.x) > SWIPE_THRESHOLD) {
      commitSwipe(drag.x > 0 ? "right" : "left");
    } else {
      setDrag({ x: 0, y: 0, dragging: false });
    }
  }

  const offsetX = exiting ? (exiting === "right" ? FLY_OUT_DISTANCE : -FLY_OUT_DISTANCE) : drag.x;
  const rotate = offsetX / 18;
  const scale = 1 - stackIndex * 0.04;
  const restY = stackIndex * 10;

  const style: React.CSSProperties = isTop
    ? {
        transform: `translate(${offsetX}px, ${drag.y}px) rotate(${rotate}deg)`,
        transition: drag.dragging ? "none" : `transform ${EXIT_MS}ms ease`,
        touchAction: "none",
        cursor: drag.dragging ? "grabbing" : "grab",
        zIndex: 10,
      }
    : {
        transform: `translateY(${restY}px) scale(${scale})`,
        transition: "transform 200ms ease",
        zIndex: 10 - stackIndex,
      };

  const likeOpacity = Math.min(Math.max(offsetX / SWIPE_THRESHOLD, 0), 1);
  const passOpacity = Math.min(Math.max(-offsetX / SWIPE_THRESHOLD, 0), 1);

  return (
    <div
      className="absolute inset-0 flex select-none flex-col gap-4 rounded-2xl border border-ink/10 bg-paper p-6 shadow-xl"
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {isTop && (
        <>
          <span
            aria-hidden="true"
            className="absolute left-6 top-6 -rotate-12 rounded border-2 border-ink px-3 py-1 text-sm font-bold uppercase tracking-wide"
            style={{ opacity: likeOpacity }}
          >
            Interested
          </span>
          <span
            aria-hidden="true"
            className="absolute right-6 top-6 rotate-12 rounded border-2 border-ink px-3 py-1 text-sm font-bold uppercase tracking-wide"
            style={{ opacity: passOpacity }}
          >
            Pass
          </span>
        </>
      )}

      <div className="flex items-center gap-3.5">
        <Avatar src={request.companyAvatarUrl} name={request.companyName} size={56} />
        <div className="min-w-0">
          <p className="text-base text-neutral-500 dark:text-neutral-400">{request.companyName}</p>
          <h3 className="font-display text-2xl font-normal">{request.title}</h3>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p
          className={`text-base text-neutral-600 dark:text-neutral-400 ${
            expanded ? "max-h-40 overflow-y-auto" : "line-clamp-4"
          }`}
        >
          {request.description}
        </p>
        {isLongDescription && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            onPointerDown={(e) => e.stopPropagation()}
            className="self-start text-sm font-medium text-ink underline underline-offset-2 dark:text-white"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <span className="rounded bg-fog px-3 py-1.5 text-neutral-700 dark:text-neutral-300">{request.niche}</span>
        <span className="rounded border border-ink/10 px-2.5 py-1.5">
          Min. {request.minFollowers.toLocaleString("en-US")} followers
        </span>
        <span className="rounded border border-ink/10 px-2.5 py-1.5">{request.productCategory}</span>
        {request.languages.map((l) => (
          <span key={l} className="rounded border border-ink/10 px-2.5 py-1.5">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
