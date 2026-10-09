import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { PaymentStatus, DepositStatus } from "@prisma/client";
import { FiUsers } from "react-icons/fi";
import { IoChevronBack } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BulkInterestedCreatorsList } from "@/components/bulk-interested-creators-list";
import { paymentStage } from "@/lib/payment-stage";
import { EmptyState } from "@/components/empty-state";
import { RequestActions } from "@/components/request-actions";
import { RequestFacts } from "@/components/request-card-face";
import { RequestPhotoRow } from "@/components/request-photo-row";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";
import { photoUrlsByRequestId, requestPhotoIds } from "@/lib/request-photos";
import { getLocale, getT } from "@/lib/i18n/server";
import { dealLocale } from "@/lib/deals/copy";
import { dealsEnabled } from "@/lib/deals/flag";
import { uiText } from "@/lib/deals/ui-copy";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");
  const t = await getT();
  const u = uiText(dealLocale(await getLocale()));

  // The request query doesn't actually need `startup` first — only the
  // ownership check below does — so both run as one round-trip.
  const [startup, request] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.request.findUnique({
      where: { id },
      omit: { imageUrl: true },
      include: {
        ...requestPhotoIds,
        briefing: { select: { id: true } },
        interests: {
          include: {
            // Their name, photo, niches and reach: never the account (email, password hash, 2FA secret).
            creator: {
              select: {
                displayName: true,
                avatarUrl: true,
                niches: true,
                platforms: { select: { platform: true, followerCount: true } },
              },
            },
            reviews: { where: { authorRole: "STARTUP" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  if (!request || request.startupId !== startup.id) notFound();
  // Nothing to look at yet (no creators, no facts for them): a draft opens in the form.
  if (request.status === "DRAFT") redirect(`/dashboard/startup/requests/${id}/edit`);
  const photos = (await photoUrlsByRequestId([request])).get(request.id) ?? [];
  const isOpen = request.status === "OPEN";
  // The brand's own rate. Without Pro on the brand, a creator with Pro still gets the Pro rate, which the hint says.
  const feeRatePercent = (startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE) * 100;
  const creatorProNote = !startup.isPro;

  // Both a creator applying and this startup reaching out directly create
  // the same Interest row — split them back apart so "interested" only
  // ever describes creators who actually did that.
  const interestedCreators = request.interests.filter((i) => i.initiatedBy === "CREATOR");
  const contactedCreators = request.interests.filter((i) => i.initiatedBy === "STARTUP");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/startup"
          className="flex items-center gap-1 self-start text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400"
        >
          <IoChevronBack className="h-4 w-4" aria-hidden />
          {t("nav.requests")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-3 font-display text-title-1 font-bold text-balance">
              {request.title}
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  isOpen ? "border border-ink text-ink" : "bg-ink/10 text-stone"
                }`}
              >
                {isOpen ? t("screens.requests.open") : t("screens.requests.closed")}
              </span>
            </h1>
          </div>
          <RequestActions requestId={request.id} isOpen={isOpen} />
        </div>
      </div>

      {/* Desktop: what the request is on the left, the facts in a column on
          the right next to all of it. Phones: one column, facts after the
          description and before the creators. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex min-w-0 flex-col gap-5 lg:col-start-1">
          <RequestPhotoRow photos={photos} />
          <p className="whitespace-pre-wrap leading-relaxed text-neutral-700 dark:text-neutral-300">{request.description}</p>
        </section>

        <aside className="flex flex-col gap-3 lg:sticky lg:top-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <RequestFacts
            request={{
              budgetMinCents: request.budgetMinCents,
              budgetMaxCents: request.budgetMaxCents,
              platform: request.platform,
              deliverables: request.deliverables,
              postBy: request.postBy ? request.postBy.toISOString().slice(0, 10) : null,
              productIncluded: request.productIncluded,
              productCategory: request.productCategory,
              niche: request.niche,
              languages: request.languages,
              minFollowers: request.minFollowers,
            }}
          />
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded bg-fog px-4 py-3">
              <dt className="text-footnote text-neutral-500 dark:text-neutral-400">{t("screens.requests.interested")}</dt>
              <dd className="font-display text-title-2 font-bold tabular-nums">{interestedCreators.length}</dd>
            </div>
            <div className="rounded bg-fog px-4 py-3">
              <dt className="text-footnote text-neutral-500 dark:text-neutral-400">{t("screens.requests.contacted")}</dt>
              <dd className="font-display text-title-2 font-bold tabular-nums">{contactedCreators.length}</dd>
            </div>
          </dl>
          {/* The campaign rules a deal is made under: advertising label, process, exclusivity, usage rights. */}
          {dealsEnabled() && (
            <Link
              href={`/dashboard/startup/requests/${request.id}/briefing`}
              className="flex flex-col gap-0.5 rounded bg-fog px-4 py-3 transition hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">{u("briefing.open")}</span>
                <span className="rounded-full border border-neutral-300 px-2.5 py-0.5 text-xs font-medium dark:border-neutral-700">
                  {request.briefing ? u("briefing.set") : u("briefing.defaults")}
                </span>
              </span>
              <span className="text-footnote text-neutral-500 dark:text-neutral-400">{u("briefing.openHint")}</span>
            </Link>
          )}
        </aside>

        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1">
          <section className="flex flex-col gap-3">
            <h2 className="font-semibold">{t("screens.requests.interestedHeading", { count: interestedCreators.length })}</h2>
            {interestedCreators.length === 0 ? (
              <div className="rounded bg-fog">
                <EmptyState
                  icon={FiUsers}
                  title={t("screens.requests.noInterest")}
                  description={t("screens.requests.noInterestBody")}
                />
              </div>
            ) : (
              <BulkInterestedCreatorsList
                requestId={request.id}
                interests={interestedCreators.map(toInterestEntry)}
                feeRatePercent={feeRatePercent}
                creatorProNote={creatorProNote}
              />
            )}
          </section>

          {contactedCreators.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-semibold">{t("screens.requests.contactedHeading", { count: contactedCreators.length })}</h2>
              <BulkInterestedCreatorsList
                requestId={request.id}
                interests={contactedCreators.map(toInterestEntry)}
                feeRatePercent={feeRatePercent}
                creatorProNote={creatorProNote}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function toInterestEntry(i: {
  id: string;
  creator: {
    displayName: string;
    avatarUrl: string | null;
    niches: string[];
    platforms: { platform: string; followerCount: number }[];
  };
  paymentStatus: PaymentStatus | null;
  amountCents: number | null;
  payoutCents: number | null;
  depositStatus: DepositStatus | null;
  depositCents: number | null;
  proofSubmittedAt: Date | null;
  disputedAt: Date | null;
  reviews: unknown[];
}) {
  return {
    id: i.id,
    displayName: i.creator.displayName,
    avatarUrl: i.creator.avatarUrl,
    niche: i.creator.niches.join(", "),
    platforms: i.creator.platforms,
    paymentStatus: i.paymentStatus,
    paymentStage:
      i.paymentStatus === null
        ? null
        : paymentStage({ paymentStatus: i.paymentStatus, proofSubmittedAt: i.proofSubmittedAt, disputedAt: i.disputedAt }),
    amountCents: i.amountCents,
    payoutCents: i.payoutCents,
    depositStatus: i.depositStatus,
    depositCents: i.depositCents,
    hasReview: i.reviews.length > 0,
  };
}
