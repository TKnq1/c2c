"use client";

import { useState } from "react";

export function StarRatingInput({ name, defaultValue = 5 }: { name: string; defaultValue?: number }) {
  const [rating, setRating] = useState(defaultValue);
  const [hovered, setHovered] = useState<number | null>(null);

  const shown = hovered ?? rating;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
      <input type="hidden" name={name} value={rating} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setRating(n)}
          onMouseEnter={() => setHovered(n)}
          className={`text-2xl leading-none transition-colors ${
            n <= shown
              ? "text-neutral-900 dark:text-neutral-100"
              : "text-neutral-300 hover:text-neutral-500 dark:text-neutral-700 dark:hover:text-neutral-400"
          }`}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
