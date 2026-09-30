"use client";

import { useEffect, useRef, useState } from "react";
import { FiPlus, FiStar, FiX } from "react-icons/fi";
import { resizeImageFile } from "@/lib/resize-image";
import { MAX_REQUEST_PHOTOS } from "@/lib/request-photo-types";

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

export function RequestPhotosInput({ photos, onChange }: { photos: PhotoItem[]; onChange: (photos: PhotoItem[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Object URLs for new picks are revoked when they're removed (below) and
  // whatever's left when the form goes away.
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      for (const p of latest.current) if (p.kind === "new") URL.revokeObjectURL(p.url);
    },
    [],
  );

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = MAX_REQUEST_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setError(`A request can have ${MAX_REQUEST_PHOTOS} photos — the rest weren't added.`);
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

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {photos.map((p, i) => (
          <div key={p.key} className="relative aspect-square overflow-hidden rounded-[14px] border border-ink/10 bg-fog">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(p.key)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
            {i === 0 ? (
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">Cover</span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(p.key)}
                aria-label={`Make photo ${i + 1} the cover`}
                className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
              >
                <FiStar className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {photos.length < MAX_REQUEST_PHOTOS && (
          <label
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-neutral-300 text-neutral-500 transition hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400 ${busy ? "opacity-50" : ""}`}
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
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
