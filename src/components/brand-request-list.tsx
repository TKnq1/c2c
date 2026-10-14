"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IoCalendarClearOutline,
  IoChatbubble,
  IoChevronForward,
  IoGiftOutline,
  IoPeopleOutline,
} from "react-icons/io5";
import { startConversationAsCreatorAction } from "@/lib/actions/requests";
import { formatBudget, formatFollowers, formatPostBy } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { Dialog } from "@/components/dialog";
import { useI18n } from "@/components/i18n-provider";
import { PlatformIcon } from "@/components/platform-icons";
import { PhotoStrip, RequestFacts, postByDate, type RequestFactFields } from "@/components/request-card-face";

export type BrandRequest = RequestFactFields & {
  id: string;
  title: string;
  description: string;
  photos: string[];
  // This creator's conversation about it, if there is one.
  interestId: string | null;
  // Whether this creator meets its requirements (and could start one).
  matches: boolean;
};

const PRIMARY =
  "flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-40";

// A brand's open requests on its profile: rows with the cover, budget and
// what the job is, each opening the full details in a sheet, with the way
// to start (or open) the conversation about that one request.
export function BrandRequestList({
  requests,
  companyName,
  companyAvatarUrl,
}: {
  requests: BrandRequest[];
  companyName: string;
  companyAvatarUrl: string | null;
}) {
  const { t, locale } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const open = requests.find((r) => r.id === openId) ?? null;

  return (
    <>
      <ul className="flex flex-col gap-2">
        {requests.map((r, i) => {
          const budget = formatBudget(r.budgetMinCents, r.budgetMaxCents);
          return (
            <li key={r.id} className="animate-stagger-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <button
                type="button"
                onClick={() => setOpenId(r.id)}
                className="flex w-full items-center gap-4 rounded bg-fog p-3 text-left transition hover:bg-ink/5"
              >
                {r.photos[0] ? (
                  // Served by our own image route; nothing for next/image to do.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photos[0]} alt="" loading="lazy" className="aspect-[4/5] w-16 shrink-0 rounded object-cover" />
                ) : (
                  <span className="flex aspect-[4/5] w-16 shrink-0 items-center justify-center rounded bg-background">
                    <Avatar src={companyAvatarUrl} name={companyName} size={40} />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  {budget && <span className="font-display text-body font-black">{budget}</span>}
                  <span className="line-clamp-2 font-semibold leading-snug">{r.title}</span>
                  <span className="flex flex-wrap gap-x-3 gap-y-1 text-footnote text-neutral-500 dark:text-neutral-400">
                    {r.platform && r.deliverables && (
                      <span className="inline-flex items-center gap-1">
                        <PlatformIcon platform={r.platform} mono className="h-3 w-3 shrink-0" />
                        {r.deliverables}
                      </span>
                    )}
                    {r.postBy && (
                      <span className="inline-flex items-center gap-1">
                        <IoCalendarClearOutline className="h-3 w-3 shrink-0" aria-hidden />
                        {formatPostBy(postByDate(r.postBy), locale)}
                      </span>
                    )}
                    {r.productIncluded && (
                      <span className="inline-flex items-center gap-1">
                        <IoGiftOutline className="h-3 w-3 shrink-0" aria-hidden />
                        {t("extras.misc.productIncluded")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <IoPeopleOutline className="h-3 w-3 shrink-0" aria-hidden />
                      {t("screens.discover.followersCount", { count: formatFollowers(r.minFollowers) })}
                    </span>
                  </span>
                </span>
                {(r.interestId || r.matches) && (
                  <span className="hidden shrink-0 rounded-full border border-ink/15 px-2.5 py-1 text-xs font-medium sm:inline">
                    {r.interestId ? t("screens.matches.inChat") : t("screens.discover.youMatch")}
                  </span>
                )}
                <IoChevronForward className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.title ?? ""}
        media={open && open.photos.length > 0 ? <PhotoStrip photos={open.photos} /> : undefined}
      >
        {open && (
          <>
            <RequestFacts request={open} />
            {open.description && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {open.description}
              </p>
            )}
            {open.interestId ? (
              <Link href={`/dashboard/messages/${open.interestId}`} className={PRIMARY}>
                <IoChatbubble className="h-4 w-4" aria-hidden />
                {t("screens.requests.openChat")}
              </Link>
            ) : open.matches ? (
              <form action={startConversationAsCreatorAction} onSubmit={() => setPending(true)}>
                <input type="hidden" name="requestId" value={open.id} />
                <button type="submit" disabled={pending} className={PRIMARY}>
                  <IoChatbubble className="h-4 w-4" aria-hidden />
                  {pending ? t("screens.requests.openingChat") : t("screens.requests.messageAbout")}
                </button>
              </form>
            ) : (
              <p className="rounded bg-fog px-4 py-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
                {t("screens.requests.requirementsGap")}
              </p>
            )}
          </>
        )}
      </Dialog>
    </>
  );
}
