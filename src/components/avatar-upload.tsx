"use client";

import { useRef, useState } from "react";
import { resizeImageFile } from "@/lib/resize-image";

export function AvatarUpload({
  name,
  initial,
  emptyLabel = "No image",
}: {
  name: string;
  initial?: string | null;
  emptyLabel?: string;
}) {
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
      const { blob, dataUrl } = await resizeImageFile(file);
      // Swap the input's own FileList for the resized version — the form
      // submits whatever this input carries, so the server (which just
      // reads formData.get("avatar") as-is, see processAvatarUpload) ends
      // up saving the small re-encoded file without needing any changes.
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
    <div className="flex items-center gap-4">
      <input type="hidden" name={`${name}Remove`} value={removed ? "1" : ""} />
      {preview ? (
        // Data-URI preview of a locally picked file (or the saved avatar) —
        // next/image doesn't add value here since there's nothing to optimize.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="h-16 w-16 rounded-full object-cover border border-neutral-300 bg-white dark:border-neutral-700"
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-fog border border-neutral-300 flex items-center justify-center text-neutral-400 text-xs text-center px-1 dark:border-neutral-700 dark:text-neutral-500">
          {emptyLabel}
        </div>
      )}
      <div className="flex flex-col items-start gap-1.5">
        <label className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 transition cursor-pointer dark:border-neutral-700 dark:hover:bg-neutral-800/50">
          Choose image
          <input
            ref={inputRef}
            type="file"
            name={name}
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
