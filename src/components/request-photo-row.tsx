"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/components/i18n-provider";

// The brand's photos in one sideways row. The page scrolls vertically, so a
// plain overflow row never moved for a mouse wheel and, with the scrollbar
// hidden, there was nothing to drag. A wheel over the row scrolls it
// sideways until the last photo, then the page takes over again.
export function RequestPhotoRow({ photos }: { photos: string[] }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      // A trackpad already scrolling sideways keeps doing that itself.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const distance = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * el.clientWidth : e.deltaY;
      const max = el.scrollWidth - el.clientWidth;
      const next = Math.min(max, Math.max(0, el.scrollLeft + distance));
      if (next === el.scrollLeft) return;
      e.preventDefault();
      el.scrollLeft = next;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (photos.length === 0) return null;

  return (
    <div
      ref={ref}
      className="-mx-6 flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pr-6 pb-2 md:mx-0 md:pr-0"
      style={{ touchAction: "pan-x pan-y", scrollbarWidth: "thin" }}
    >
      {photos.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt={t("screens.ui.photoAlt", { n: i + 1 })}
          draggable={false}
          className="aspect-[4/5] w-44 shrink-0 rounded object-cover"
        />
      ))}
    </div>
  );
}
