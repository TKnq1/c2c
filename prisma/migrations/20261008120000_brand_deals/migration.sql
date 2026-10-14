-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('CONTRACT_PENDING', 'AWAITING_ESCROW', 'IN_PRODUCTION', 'DRAFT_SUBMITTED', 'CHANGES_REQUESTED', 'DRAFT_APPROVED', 'POST_SCHEDULED', 'POST_SUBMITTED', 'VERIFYING', 'REPOST_REQUIRED', 'PAYOUT_PENDING', 'COMPLETED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealDraftKind" AS ENUM ('SCRIPT', 'VIDEO_PREVIEW', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "DealDraftStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UsageRightsType" AS ENUM ('ORGANIC_ONLY', 'CROSS_POST', 'PAID_ADS');

-- CreateEnum
CREATE TYPE "PostVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REMOVED', 'UNREACHABLE', 'REJECTED');

-- CreateEnum
CREATE TYPE "PostVerificationSource" AS ENUM ('MANUAL', 'OEMBED', 'API', 'WEBHOOK', 'PROOF');

-- CreateEnum
CREATE TYPE "DealProofKind" AS ENUM ('SCREENSHOT', 'ANALYTICS');

-- CreateEnum
CREATE TYPE "DisputeReason" AS ENUM ('MISSED_DEADLINE', 'DRAFT_REJECTED', 'POST_REMOVED', 'DISCLOSURE_MISSING', 'CONTENT_MISMATCH', 'USAGE_RIGHTS_MISSING', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED_RELEASE', 'RESOLVED_REFUND', 'RESOLVED_RESUME');

-- CreateEnum
CREATE TYPE "TaxTreatment" AS ENUM ('DOMESTIC_VAT', 'REVERSE_CHARGE_EU', 'REVERSE_CHARGE_13B', 'OUT_OF_SCOPE', 'SMALL_BUSINESS_EXEMPT');

-- CreateEnum
CREATE TYPE "InvoiceKind" AS ENUM ('BRAND_INVOICE', 'CREATOR_CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VatIdStatus" AS ENUM ('UNCHECKED', 'VALID', 'INVALID', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "CampaignBriefing" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "targetMarket" TEXT NOT NULL DEFAULT 'DE',
    "contentFormats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "talkingPoints" TEXT,
    "doNots" TEXT,
    "requiredHashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredMentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "disclosureLabels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirePaidPartnershipLabel" BOOLEAN NOT NULL DEFAULT true,
    "draftRequired" BOOLEAN NOT NULL DEFAULT true,
    "draftDueDaysBeforePost" INTEGER NOT NULL DEFAULT 5,
    "brandReviewDays" INTEGER NOT NULL DEFAULT 3,
    "maxRevisionRounds" INTEGER NOT NULL DEFAULT 2,
    "postingWindowStart" DATE,
    "postingWindowEnd" DATE,
    "minLiveHours" INTEGER NOT NULL DEFAULT 24,
    "exclusivityEnabled" BOOLEAN NOT NULL DEFAULT false,
    "exclusivityCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exclusivityCompetitors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exclusivityDaysBefore" INTEGER NOT NULL DEFAULT 0,
    "exclusivityDaysAfter" INTEGER NOT NULL DEFAULT 0,
    "usageType" "UsageRightsType" NOT NULL DEFAULT 'ORGANIC_ONLY',
    "usageChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usageDurationDays" INTEGER,
    "usageFeeCents" INTEGER,
    "usageTerritory" TEXT NOT NULL DEFAULT 'EU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignBriefing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'CONTRACT_PENDING',
    "statusBeforeDispute" "DealStatus",
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terms" JSONB NOT NULL,
    "termsHash" TEXT NOT NULL,
    "brandSignedAt" TIMESTAMP(3),
    "brandSignedBy" TEXT,
    "creatorSignedAt" TIMESTAMP(3),
    "creatorSignedBy" TEXT,
    "fundedAt" TIMESTAMP(3),
    "draftDueAt" TIMESTAMP(3),
    "draftReviewDueAt" TIMESTAMP(3),
    "revisionDueAt" TIMESTAMP(3),
    "revisionRound" INTEGER NOT NULL DEFAULT 0,
    "postWindowStart" TIMESTAMP(3),
    "postWindowEnd" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "graceUntil" TIMESTAMP(3),
    "remindersSent" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "firstLiveAt" TIMESTAMP(3),
    "verificationEndsAt" TIMESTAMP(3),
    "payoutEligibleAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "usageDeliveredAt" TIMESTAMP(3),
    "usageConfirmedAt" TIMESTAMP(3),
    "usageStartsAt" TIMESTAMP(3),
    "usageExpiresAt" TIMESTAMP(3),
    "sparkAdsCode" TEXT,
    "sparkAdsCodeExpiresAt" TIMESTAMP(3),
    "usageExpiryNoticeAt" TIMESTAMP(3),
    "taxSnapshot" JSONB,
    "brandNetCents" INTEGER,
    "brandVatCents" INTEGER,
    "brandTotalCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealDraft" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "kind" "DealDraftKind" NOT NULL,
    "url" TEXT,
    "notes" TEXT,
    "caption" TEXT,
    "disclosureConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "DealDraftStatus" NOT NULL DEFAULT 'SUBMITTED',
    "feedback" TEXT,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "DealDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealPost" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "url" TEXT,
    "externalId" TEXT,
    "status" "PostVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "source" "PostVerificationSource" NOT NULL DEFAULT 'MANUAL',
    "caption" TEXT,
    "disclosureLabel" TEXT,
    "paidPartnershipLabel" BOOLEAN NOT NULL DEFAULT false,
    "disclosureInContent" BOOLEAN NOT NULL DEFAULT false,
    "hashtagsFound" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "checkFailures" INTEGER NOT NULL DEFAULT 0,
    "brandConfirmedAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "DealPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealProof" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "kind" "DealProofKind" NOT NULL DEFAULT 'SCREENSHOT',
    "contentType" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealPostMetric" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "source" TEXT NOT NULL,
    "eventId" TEXT,

    CONSTRAINT "DealPostMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealEvent" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fromStatus" "DealStatus",
    "toStatus" "DealStatus",
    "actorRole" "Role",
    "actorUserId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealDispute" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "reason" "DisputeReason" NOT NULL,
    "details" TEXT,
    "openedByRole" "Role",
    "openedByUserId" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedByAdminId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DealDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "registerNumber" TEXT,
    "taxNumber" TEXT,
    "vatId" TEXT,
    "vatIdStatus" "VatIdStatus" NOT NULL DEFAULT 'UNCHECKED',
    "vatIdCheckedAt" TIMESTAMP(3),
    "vatIdConsultationNumber" TEXT,
    "vatIdRegisteredName" TEXT,
    "vatIdRegisteredAddress" TEXT,
    "smallBusinessExempt" BOOLEAN NOT NULL DEFAULT false,
    "traderSelfCertifiedAt" TIMESTAMP(3),
    "traderCertVersion" TEXT,
    "selfBillingAcceptedAt" TIMESTAMP(3),
    "selfBillingVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "kind" "InvoiceKind" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "dealId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "servicePeriodStart" TIMESTAMP(3),
    "servicePeriodEnd" TIMESTAMP(3),
    "netCents" INTEGER NOT NULL,
    "vatCents" INTEGER NOT NULL,
    "grossCents" INTEGER NOT NULL,
    "vatRateBp" INTEGER NOT NULL,
    "taxTreatment" "TaxTreatment" NOT NULL,
    "legalNote" TEXT,
    "issuer" JSONB NOT NULL,
    "recipient" JSONB NOT NULL,
    "lines" JSONB NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSequence" (
    "key" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceSequence_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignBriefing_requestId_key" ON "CampaignBriefing"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_interestId_key" ON "Deal"("interestId");

-- CreateIndex
CREATE INDEX "Deal_status_statusChangedAt_idx" ON "Deal"("status", "statusChangedAt");

-- CreateIndex
CREATE INDEX "Deal_creatorId_status_idx" ON "Deal"("creatorId", "status");

-- CreateIndex
CREATE INDEX "Deal_startupId_status_idx" ON "Deal"("startupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DealDraft_dealId_version_key" ON "DealDraft"("dealId", "version");

-- CreateIndex
CREATE INDEX "DealPost_dealId_idx" ON "DealPost"("dealId");

-- CreateIndex
CREATE INDEX "DealPost_status_lastCheckedAt_idx" ON "DealPost"("status", "lastCheckedAt");

-- CreateIndex
CREATE INDEX "DealPost_externalId_idx" ON "DealPost"("externalId");

-- CreateIndex
CREATE INDEX "DealProof_postId_idx" ON "DealProof"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "DealPostMetric_eventId_key" ON "DealPostMetric"("eventId");

-- CreateIndex
CREATE INDEX "DealPostMetric_postId_capturedAt_idx" ON "DealPostMetric"("postId", "capturedAt");

-- CreateIndex
CREATE INDEX "DealEvent_dealId_createdAt_idx" ON "DealEvent"("dealId", "createdAt");

-- CreateIndex
CREATE INDEX "DealDispute_dealId_idx" ON "DealDispute"("dealId");

-- CreateIndex
CREATE INDEX "DealDispute_status_openedAt_idx" ON "DealDispute"("status", "openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON "BusinessProfile"("userId");

-- CreateIndex
CREATE INDEX "BusinessProfile_vatId_idx" ON "BusinessProfile"("vatId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_recipientUserId_issuedAt_idx" ON "Invoice"("recipientUserId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_dealId_kind_key" ON "Invoice"("dealId", "kind");

-- AddForeignKey
ALTER TABLE "CampaignBriefing" ADD CONSTRAINT "CampaignBriefing_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDraft" ADD CONSTRAINT "DealDraft_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealPost" ADD CONSTRAINT "DealPost_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealProof" ADD CONSTRAINT "DealProof_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DealPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealPostMetric" ADD CONSTRAINT "DealPostMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DealPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDispute" ADD CONSTRAINT "DealDispute_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

