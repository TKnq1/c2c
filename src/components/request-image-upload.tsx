"use client";

import { useRef, useState } from "react";
import { resizeImageFile } from "@/lib/resize-image";

const MAX_DIMENSION = 1024;

// Same data-URI pattern as AvatarUpload, just a wider reference-image crop
// (16:9, not a square) and a larger max dimension — this is meant to show
// real product detail on the swipe card, not act as a small icon.
export function RequestImageUpload({ initial }: { initial?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initial ?? null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoved(false);
    setError(null);
    try {
      const { blob, dataUrl } = await resizeImageFile(file, { maxDimension: MAX_DIMENSION });
      const resized = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
      const dt = new DataTransfer();
      dt.items.add(resized);
      if (inputRef.current) inputRef.current.files = dt.files;
      setPreview(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image.");
    }
  }

  function handleRemove() {
    setPreview(null);
    setRemoved(true);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="imageRemove" value={removed ? "1" : ""} />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="aspect-video w-full max-w-sm rounded-xl object-cover border border-neutral-300 bg-fog dark:border-neutral-700"
        />
      ) : (
        <div className="aspect-video w-full max-w-sm rounded-xl bg-fog border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 text-sm dark:border-neutral-700 dark:text-neutral-500">
          No image
        </div>
      )}
      <div className="flex items-center gap-3">
        <label className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 transition cursor-pointer dark:border-neutral-700 dark:hover:bg-neutral-800/50">
          Choose image
          <input
            ref={inputRef}
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-neutral-500 hover:text-ink transition dark:text-neutral-400"
          >
            Remove
          </button>
        )}
        {error && <p className="text-xs text-ink">{error}</p>}
      </div>
    </div>
  );
}
