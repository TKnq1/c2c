"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiPlus, FiStar, FiX } from "react-icons/fi";
import { resizeImageFile } from "@/lib/resize-image";
import { MAX_REQUEST_PHOTOS } from "@/lib/request-photo-types";
import { haptic } from "@/lib/haptics";

// A photo on the form: one the request already has (a RequestImage, or the
// single legacy image older requests carry), or a new pick waiting to be
// uploaded with the form.
export type PhotoItem =
  | { key: string; kind: "existing"; id: string; url: string }
  | { key: string; kind: "legacy"; url: string }
  | { key: string; kind: "new"; file: File; url: string };

// Resized in the browser before upload — a phone photo can be several MB,
// and five of them have to fit one request body. 1280 px is plenty for a
// full-width card on any phone.
const MAX_DIMENSION = 1280;
// A finger that moves this far before the hold ends is scrolling the page,
// not picking the photo up.
const SCROLL_SLOP = 10;
const HOLD_MS = 200;

export function reorderPhotos<T>(photos: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return photos;
  const next = photos.slice();
  const [photo] = next.splice(from, 1);
  next.splice(to, 0, photo);
  return next;
}

// Where the pointer is, and whether the photo has been picked up yet. A
// mouse drag starts as soon as it moves; a finger has to hold still first,
// so scrolling the form still works when the touch begins on a photo.
type Drag = {
  key: string;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  el: HTMLDivElement;
  // The tile we last swapped with. Until the pointer leaves it, a second
  // move must not swap again — the grid hasn't caught up yet.
  overKey: string | null;
};

export function RequestPhotosInput({ photos, onChange }: { photos: PhotoItem[]; onChange: (photos: PhotoItem[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const holdRef = useRef<number | null>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  // Object URLs for new picks are revoked when they're removed (below) and
  // whatever's left when the form goes away.
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      for (const p of latest.current) if (p.kind === "new") URL.revokeObjectURL(p.url);
      if (holdRef.current) window.clearTimeout(holdRef.current);
    },
    [],
  );

  // The floating copy isn't in the document until the lift has rendered.
  useLayoutEffect(() => {
    const drag = dragRef.current;
    if (drag?.active) placeFloat(drag);
  }, [draggingKey]);

  // Once a photo is lifted, the finger has to move it rather than the page.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const block = (e: TouchEvent) => {
      if (dragRef.current?.active) e.preventDefault();
    };
    grid.addEventListener("touchmove", block, { passive: false });
    return () => grid.removeEventListener("touchmove", block);
  }, []);

  function placeFloat(drag: Drag) {
    const el = floatRef.current;
    if (!el) return;
    el.style.width = `${drag.width}px`;
    el.style.height = `${drag.height}px`;
    el.style.transform = `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px) scale(1.05)`;
  }

  function lift(drag: Drag) {
    if (drag.active || photosRef.current.length < 2) return;
    const rect = drag.el.getBoundingClientRect();
    drag.active = true;
    drag.width = rect.width;
    drag.height = rect.height;
    drag.offsetX = drag.x - rect.left;
    drag.offsetY = drag.y - rect.top;
    try {
      drag.el.setPointerCapture(drag.pointerId);
    } catch {
      // The pointer can already be gone; the move still reorders.
    }
    setDraggingKey(drag.key);
    haptic();
  }

  function clearHold() {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = null;
  }

  function drop() {
    clearHold();
    dragRef.current = null;
    setDraggingKey(null);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>, key: string) {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    clearHold();
    const drag: Drag = {
      key,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
      width: 0,
      height: 0,
      offsetX: 0,
      offsetY: 0,
      el: e.currentTarget,
      overKey: null,
    };
    dragRef.current = drag;
    if (e.pointerType === "touch") {
      holdRef.current = window.setTimeout(() => {
        if (dragRef.current === drag) lift(drag);
      }, HOLD_MS);
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (!drag.active) {
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (drag.pointerType === "touch") {
        if (dist > SCROLL_SLOP) drop();
        return;
      }
      if (dist < 4) return;
      lift(drag);
      if (!drag.active) return;
    }
    placeFloat(drag);
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-photo-key]");
    const overKey = hit?.dataset.photoKey ?? null;
    if (!overKey || overKey === drag.key) {
      drag.overKey = null;
      return;
    }
    if (overKey === drag.overKey) return;
    drag.overKey = overKey;
    const list = photosRef.current;
    const from = list.findIndex((p) => p.key === drag.key);
    const to = list.findIndex((p) => p.key === overKey);
    if (from < 0 || to < 0 || from === to) return;
    const next = reorderPhotos(list, from, to);
    photosRef.current = next;
    onChange(next);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === e.pointerId) drop();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>, index: number) {
    const cols = gridRef.current ? getComputedStyle(gridRef.current).gridTemplateColumns.split(" ").length : 4;
    const to =
      e.key === "ArrowLeft" ? index - 1 : e.key === "ArrowRight" ? index + 1 : e.key === "ArrowUp" ? index - cols : e.key === "ArrowDown" ? index + cols : null;
    if (to === null) return;
    e.preventDefault();
    if (to < 0 || to >= photos.length || to === index) return;
    onChange(reorderPhotos(photos, index, to));
  }

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = MAX_REQUEST_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setError(`A request can have ${MAX_REQUEST_PHOTOS} photos, so the rest weren't added.`);
    setBusy(true);
    try {
      const added = await Promise.all(
        picked.map(async (file): Promise<PhotoItem> => {
          const { blob } = await resizeImageFile(file, { maxDimension: MAX_DIMENSION, quality: 0.82 });
          const resized = new File([blob], `${file.name.replace(/\.\w+$/, "")}.jpg`, { type: "image/jpeg" });
          return { key: crypto.randomUUID(), kind: "new", file: resized, url: URL.createObjectURL(resized) };
        }),
      );
      onChange([...photos, ...added]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(key: string) {
    const photo = photos.find((p) => p.key === key);
    if (photo?.kind === "new") URL.revokeObjectURL(photo.url);
    onChange(photos.filter((p) => p.key !== key));
  }

  function makeCover(key: string) {
    const photo = photos.find((p) => p.key === key);
    if (photo) onChange([photo, ...photos.filter((p) => p.key !== key)]);
  }

  const dragging = photos.find((p) => p.key === draggingKey) ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div ref={gridRef} className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {photos.map((p, i) => (
          <div
            key={p.key}
            data-photo-key={p.key}
            tabIndex={0}
            role="group"
            aria-grabbed={draggingKey === p.key}
            aria-label={`Photo ${i + 1}${i === 0 ? ", cover" : ""}. Hold and drag to reorder.`}
            onPointerDown={(e) => onPointerDown(e, p.key)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={(e) => onKeyDown(e, i)}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative aspect-square touch-manipulation overflow-hidden rounded border border-ink/10 bg-fog select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${photos.length > 1 ? "cursor-grab" : ""} ${draggingKey === p.key ? "opacity-30" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(p.key)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
            {i === 0 ? (
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(p.key)}
                aria-label={`Make photo ${i + 1} the cover`}
                className="absolute bottom-1.5 left-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
              >
                <FiStar className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {photos.length < MAX_REQUEST_PHOTOS && (
          <label
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-neutral-300 text-neutral-500 transition hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400 ${busy ? "opacity-50" : ""}`}
          >
            <FiPlus className="h-5 w-5" />
            <span className="text-xs font-medium">{busy ? "Adding…" : "Add"}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              onChange={(e) => add(e.target.files)}
              className="sr-only"
            />
          </label>
        )}
      </div>
      {dragging && (
        <div ref={floatRef} className="pointer-events-none fixed top-0 left-0 z-50 overflow-hidden rounded shadow-xl" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dragging.url} alt="" draggable={false} className="h-full w-full object-cover" />
        </div>
      )}
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
