import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { PaymentStatus, DepositStatus } from "@prisma/client";
import { FiUsers } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionButton } from "@/components/action-button";
import { BulkInterestedCreatorsList } from "@/components/bulk-interested-creators-list";
import { paymentStage } from "@/components/payment-status-badge";
import { EmptyState } from "@/components/empty-state";
import { closeRequestAction, reopenRequestAction, duplicateRequestAction } from "@/lib/actions/requests";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";

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
      include: {
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

  // Both a creator applying and this startup reaching out directly create
  // the same Interest row — split them back apart so "interested" only
  // ever describes creators who actually did that.
  const interestedCreators = request.interests.filter((i) => i.initiatedBy === "CREATOR");
  const contactedCreators = request.interests.filter((i) => i.initiatedBy === "STARTUP");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {request.niche} · {request.productCategory}
          </p>
          <h1 className="font-display text-title-1 font-bold flex items-center gap-2">
            {request.title}
            {request.status === "CLOSED" && (
              <span className="text-xs font-normal rounded bg-fog text-neutral-500 px-2 py-0.5 dark:text-neutral-400">
                Closed
              </span>
            )}
          </h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
            Min. {request.minFollowers.toLocaleString("en-US")} followers
          </p>
          <p className="text-neutral-700 whitespace-pre-wrap mt-4 dark:text-neutral-300">{request.description}</p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            href={`/dashboard/startup/requests/${request.id}/edit`}
            className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-center hover:bg-neutral-50 transition dark:border-neutral-700 dark:hover:bg-neutral-800/50"
          >
            Edit
          </Link>
          <form action={duplicateRequestAction.bind(null, request.id)}>
            <button
              type="submit"
              className="w-full rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition dark:border-neutral-700 dark:hover:bg-neutral-800/50"
            >
              Duplicate
            </button>
          </form>
          <ActionButton
            action={
              request.status === "OPEN"
                ? closeRequestAction.bind(null, request.id)
                : reopenRequestAction.bind(null, request.id)
            }
            successMessage={request.status === "OPEN" ? "Request closed." : "Request reopened."}
            className="w-full rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
          >
            {request.status === "OPEN" ? "Close request" : "Reopen request"}
          </ActionButton>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Interested creators ({interestedCreators.length})</h2>
        {interestedCreators.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title="No creator interest yet."
            description="Matching creators will show up here once they express interest."
          />
        ) : (
          <BulkInterestedCreatorsList
            requestId={request.id}
            interests={interestedCreators.map(toInterestEntry)}
            feeRatePercent={(startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE) * 100}
          />
        )}
      </div>

      {contactedCreators.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Creators you contacted ({contactedCreators.length})</h2>
          <BulkInterestedCreatorsList
            requestId={request.id}
            interests={contactedCreators.map(toInterestEntry)}
            feeRatePercent={(startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE) * 100}
          />
        </div>
      )}
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
