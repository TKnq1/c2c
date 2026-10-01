"use client";

import { useEffect, useRef } from "react";
import { IoCalendarClearOutline, IoCubeOutline, IoGiftOutline, IoLanguageOutline } from "react-icons/io5";
import { Avatar } from "@/components/avatar";
import { RatingSummary } from "@/components/stars";
import { PlatformIcon } from "@/components/platform-icons";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";
import { formatBudget, formatPostBy } from "@/lib/format";

// Everything a request card shows — the Feed's swipe card, its details
// sheet, and the live preview on the brand's New request form all draw
// from this, so the preview is exactly what creators will see.
export type CardRequest = {
  title: string;
  description: string;
  niche: string;
  languages: string[];
  minFollowers: number;
  productCategory: string;
  companyName: string;
  companyAvatarUrl: string | null;
  rating: { average: number; count: number };
  // Cover first.
  photos: string[];
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  platform: string | null;
  deliverables: string | null;
  // "YYYY-MM-DD", or null for flexible.
  postBy: string | null;
  productIncluded: boolean;
};

export function postByDate(postBy: string) {
  return new Date(`${postBy}T00:00:00Z`);
}

// The face of the card: the cover (or current) photo full-bleed with the
// budget up top and the brand, title and what the job is laid over the
// bottom — or, without photos, the same on paper.
export function RequestCardFace({ request, photoIndex = 0 }: { request: CardRequest; photoIndex?: number }) {
  const photo = request.photos[photoIndex] ?? request.photos[0];
  const budget = formatBudget(request.budgetMinCents, request.budgetMaxCents);

  if (!photo) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pt-6 pb-8">
        {budget && (
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-title-2 font-black">{budget}</span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">budget</span>
          </p>
        )}
        <CardHeader request={request} />
        <CardChips request={request} className="mt-auto" />
      </div>
    );
  }

  return (
    // Full-bleed — the photo fills the card and everything else reads as an
    // overlay on top of it. A size container, so the blurred copy below can
    // be exactly the card's size (100cqh) whatever the photo's shape.
    <div className="relative min-h-0 flex-1" style={{ containerType: "size" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />

      {request.photos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-3 top-2.5 flex gap-1">
          {request.photos.map((_, i) => (
            <span key={i} className={`h-[3px] flex-1 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/45"}`} />
          ))}
        </div>
      )}

      {/* White in both themes (it sits on the photo), so its text is a
          fixed dark too — text-ink would turn white with it in dark mode. */}
      {budget && (
        <p className="absolute top-6 left-4 flex items-baseline gap-1 rounded-full bg-white/90 px-3 py-1.5 text-neutral-900 shadow-md">
          <span className="text-base font-black">{budget}</span>
          <span className="text-xs font-semibold text-neutral-500">budget</span>
        </p>
      )}

      {/* The overlay is as tall as its text, never the photo — a portrait
          phone photo used to stretch it up over the whole card. Behind the
          text: the same photo, blurred, framed exactly like the one above
          (card-sized, pinned to the bottom) and faded in from the top; then
          a plain gradient. A blurred copy rather than backdrop-blur through
          a mask, which composited as a visible seam. */}
      {/* data-card-info: a tap here opens the details (see SwipeCard). */}
      <div data-card-info className="absolute inset-x-0 bottom-0 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt=""
            draggable={false}
            className="absolute bottom-0 left-0 w-full select-none object-cover blur-xl"
            style={{ height: "100cqh" }}
          />
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="relative flex flex-col gap-4 px-6 pt-6 pb-8 text-white">
          <CardHeader request={request} light />
          <CardChips request={request} light />
        </div>
      </div>
    </div>
  );
}

function CardHeader({ request, light }: { request: CardRequest; light?: boolean }) {
  return (
    <div className="flex items-center gap-3.5">
      <Avatar src={request.companyAvatarUrl} name={request.companyName} size={56} />
      <div className="min-w-0">
        <p className={`text-base ${light ? "text-white/70" : "text-neutral-500 dark:text-neutral-400"}`}>{request.companyName}</p>
        <h3 className="font-display text-body font-bold">{request.title}</h3>
        <RatingSummary average={request.rating.average} count={request.rating.count} light={light} />
      </div>
    </div>
  );
}

// What the job is: where and what to post, by when, whether the product
// comes with it. Requests from before those existed fall back to their
// niche and product category so the card never ends up bare.
function CardChips({ request, light, className = "" }: { request: CardRequest; light?: boolean; className?: string }) {
  const filled = light ? "bg-white/25 backdrop-blur-sm" : "bg-fog text-neutral-700 dark:text-neutral-300";
  const outlined = light ? "border border-white/40" : "border border-ink/10";
  const chip = "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5";
  const NicheIcon = NICHE_ICONS[request.niche] ?? DEFAULT_NICHE_ICON;
  const hasDeal = !!(request.platform && request.deliverables);
  const otherLanguages = request.languages.filter((l) => l !== "English");

  return (
    <div className={`flex flex-wrap gap-2.5 text-sm ${light ? "text-white/90" : "text-neutral-500 dark:text-neutral-400"} ${className}`}>
      {hasDeal ? (
        <span className={`${chip} ${filled}`}>
          <PlatformIcon platform={request.platform!} mono className="h-3.5 w-3.5 shrink-0" />
          {request.deliverables}
        </span>
      ) : (
        <>
          <span className={`${chip} ${filled}`}>
            <NicheIcon className="h-3.5 w-3.5 shrink-0" />
            {request.niche}
          </span>
          <span className={`${chip} ${outlined}`}>
            <IoCubeOutline className="h-3.5 w-3.5 shrink-0" />
            {request.productCategory}
          </span>
        </>
      )}
      {request.postBy && (
        <span className={`${chip} ${outlined}`}>
          <IoCalendarClearOutline className="h-3.5 w-3.5 shrink-0" />
          Post by {formatPostBy(postByDate(request.postBy))}
        </span>
      )}
      {request.productIncluded && (
        <span className={`${chip} ${outlined}`}>
          <IoGiftOutline className="h-3.5 w-3.5 shrink-0" />
          Product included
        </span>
      )}
      {otherLanguages.length > 0 && (
        <span className={`${chip} ${outlined}`}>
          <IoLanguageOutline className="h-3.5 w-3.5 shrink-0" />
          {request.languages.join(", ")}
        </span>
      )}
    </div>
  );
}

export type RequestFactFields = Pick<
  CardRequest,
  | "budgetMinCents"
  | "budgetMaxCents"
  | "platform"
  | "deliverables"
  | "postBy"
  | "productIncluded"
  | "productCategory"
  | "niche"
  | "languages"
  | "minFollowers"
>;

// The facts under the description in the details sheet — every field, in
// the same order the brand filled them in. Also the brand's own request
// page, which is why it only needs the request, not the brand.
export function RequestFacts({ request }: { request: RequestFactFields }) {
  const budget = formatBudget(request.budgetMinCents, request.budgetMaxCents);
  const rows: [string, React.ReactNode][] = [];
  if (budget) rows.push(["Budget", <span key="b" className="font-bold">{budget}</span>]);
  if (request.platform)
    rows.push([
      "Platform",
      <span key="p" className="inline-flex items-center gap-1.5">
        <PlatformIcon platform={request.platform} className="h-3.5 w-3.5" />
        {request.platform}
      </span>,
    ]);
  if (request.deliverables) rows.push(["Content", request.deliverables]);
  rows.push(["Post by", request.postBy ? formatPostBy(postByDate(request.postBy)) : "Flexible"]);
  rows.push(["Product", request.productIncluded ? `${request.productCategory} · included` : request.productCategory]);
  rows.push(["Niche", request.niche]);
  rows.push(["Language", request.languages.join(", ")]);
  rows.push(["Min. followers", request.minFollowers.toLocaleString("en-US")]);

  return (
    <dl className="rounded bg-fog px-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 border-ink/10 py-2.5 [&+&]:border-t">
          <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
          <dd className="text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// All of a request's photos in a swipeable strip, for the details sheet —
// opening on `start`, the photo the card was showing.
export function PhotoStrip({ photos, start = 0 }: { photos: string[]; start?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && start > 0) ref.current.scrollLeft = start * ref.current.clientWidth;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only where it opens
  }, []);
  if (photos.length === 0) return null;
  return (
    <div ref={ref} className="flex h-56 w-full shrink-0 snap-x snap-mandatory overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {photos.map((p, i) => (
        <div key={i} className="relative h-full w-full shrink-0 snap-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p} alt="" className="h-full w-full object-cover" />
          {photos.length > 1 && (
            <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">
              {i + 1}/{photos.length}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
