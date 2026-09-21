"use client";

import { useRef, useState } from "react";
import { FiTrash2 } from "react-icons/fi";

const THRESHOLD = 72;
const MAX_DRAG = 96;

// Generic swipe-left-to-dismiss wrapper for a list row — iOS Mail/Messages
// style. Gesture-only would leave keyboard/mouse users with no way to
// dismiss at all, so onDismiss is also wired to a small always-visible
// button (see NotificationsList) — this component just handles the drag.
export function SwipeToDismiss({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<number | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = e.clientX;
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (startRef.current === null) return;
    const delta = e.clientX - startRef.current;
    setDragX(Math.max(-MAX_DRAG, Math.min(0, delta)));
  }

  function handlePointerUp() {
    if (startRef.current === null) return;
    startRef.current = null;
    setDragging(false);
    if (dragX < -THRESHOLD) onDismiss();
    setDragX(0);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 flex w-24 items-center justify-end pr-5 text-ink/50"
        style={{ opacity: Math.min(Math.abs(dragX) / THRESHOLD, 1) }}
      >
        <FiTrash2 className="h-4 w-4" />
      </div>
      <div
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 200ms ease",
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}
      </div>
    </div>
  );
}
