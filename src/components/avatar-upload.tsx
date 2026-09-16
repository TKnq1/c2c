"use client";

import { useState } from "react";

export function AvatarUpload({
  name,
  initial,
  emptyLabel = "No image",
}: {
  name: string;
  initial?: string | null;
  emptyLabel?: string;
}) {
  const [preview, setPreview] = useState<string | null>(initial ?? null);
  const [removed, setRemoved] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoved(false);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    setPreview(null);
    setRemoved(true);
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
          <input type="file" name={name} accept="image/*" onChange={handleChange} className="hidden" />
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
      </div>
    </div>
  );
}
