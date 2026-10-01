import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { PaymentStatus, DepositStatus } from "@prisma/client";
import { FiUsers } from "react-icons/fi";
import { IoChevronBack } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BulkInterestedCreatorsList } from "@/components/bulk-interested-creators-list";
import { paymentStage } from "@/components/payment-status-badge";
import { EmptyState } from "@/components/empty-state";
import { RequestActions } from "@/components/request-actions";
import { RequestFacts } from "@/components/request-card-face";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";
import { photoUrlsByRequestId, requestPhotoIds } from "@/lib/request-photos";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  // The request query doesn't actually need `startup` first — only the
  // ownership check below does — so both run as one round-trip.
  const [startup, request] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.request.findUnique({
      where: { id },
      omit: { imageUrl: true },
      include: {
        ...requestPhotoIds,
        interests: {
          include: {
            creator: { include: { user: true, platforms: true } },
            reviews: { where: { authorRole: "STARTUP" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  if (!request || request.startupId !== startup.id) notFound();
  const photos = (await photoUrlsByRequestId([request])).get(request.id) ?? [];
  const isOpen = request.status === "OPEN";
  const feeRatePercent = (startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE) * 100;

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
          Requests
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {request.niche} · {request.productCategory}
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-title-1 font-bold text-balance">
              {request.title}
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  isOpen ? "border border-ink text-ink" : "bg-ink/10 text-stone"
                }`}
              >
                {isOpen ? "Open" : "Closed"}
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
          {photos.length > 0 && (
            <div className="-mx-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-6 md:mx-0 md:px-0" style={{ scrollbarWidth: "none" }}>
              {photos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="aspect-[4/5] w-44 shrink-0 snap-start rounded object-cover md:w-52"
                />
              ))}
            </div>
          )}
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
              <dt className="text-footnote text-neutral-500 dark:text-neutral-400">Interested</dt>
              <dd className="font-display text-title-2 font-bold tabular-nums">{interestedCreators.length}</dd>
            </div>
            <div className="rounded bg-fog px-4 py-3">
              <dt className="text-footnote text-neutral-500 dark:text-neutral-400">Contacted</dt>
              <dd className="font-display text-title-2 font-bold tabular-nums">{contactedCreators.length}</dd>
            </div>
          </dl>
        </aside>

        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1">
          <section className="flex flex-col gap-3">
            <h2 className="font-semibold">Interested creators ({interestedCreators.length})</h2>
            {interestedCreators.length === 0 ? (
              <div className="rounded bg-fog">
                <EmptyState
                  icon={FiUsers}
                  title="No creator interest yet."
                  description="Matching creators will show up here once they express interest."
                />
              </div>
            ) : (
              <BulkInterestedCreatorsList
                requestId={request.id}
                interests={interestedCreators.map(toInterestEntry)}
                feeRatePercent={feeRatePercent}
              />
            )}
          </section>

          {contactedCreators.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-semibold">Creators you contacted ({contactedCreators.length})</h2>
              <BulkInterestedCreatorsList
                requestId={request.id}
                interests={contactedCreators.map(toInterestEntry)}
                feeRatePercent={feeRatePercent}
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
    niche: string;
    user: { email: string };
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
    niche: i.creator.niche,
    email: i.creator.user.email,
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
