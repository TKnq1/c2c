import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brandRating, legacyRequestPhotoUrl, requestPhotoUrl } from "@/lib/request-photos";
import { emailIsVerified } from "@/lib/verified";
import { deleteDraftAction } from "@/lib/actions/requests";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { RequestForm } from "@/components/request-form";
import type { PhotoItem } from "@/components/request-photos-input";
import { PageTitle } from "@/components/page-title";
import { getT } from "@/lib/i18n/server";

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");
  const t = await getT();

  const [startup, request, emailVerified] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      select: { id: true, companyName: true, avatarUrl: true },
    }),
    prisma.request.findUnique({
      where: { id },
      include: { images: { select: { id: true }, orderBy: { position: "asc" } } },
    }),
    emailIsVerified(session.user.id),
  ]);
  if (!request || request.startupId !== startup.id) notFound();
  const rating = await brandRating(startup.id);

  const photos: PhotoItem[] =
    request.images.length > 0
      ? request.images.map((i) => ({ key: i.id, kind: "existing", id: i.id, url: requestPhotoUrl(i.id) }))
      : request.imageUrl
        ? [{ key: "legacy", kind: "legacy", url: legacyRequestPhotoUrl(request.id) }]
        : [];

  const isDraft = request.status === "DRAFT";

  return (
    // On phones the header shows the title (see getPageTitle in nav.tsx).
    <div className="flex flex-col gap-6">
      <PageTitle>{isDraft ? t("screens.requests.editDraft") : t("nav.editRequest")}</PageTitle>
      <RequestForm
        requestId={request.id}
        status={request.status}
        brand={{ companyName: startup.companyName, avatarUrl: startup.avatarUrl, rating }}
        emailVerified={emailVerified}
        initial={{
          title: request.title,
          description: request.description,
          niche: request.niche,
          languages: request.languages,
          productCategory: request.productCategory,
          minFollowers: request.minFollowers,
          photos,
          budgetMinCents: request.budgetMinCents,
          budgetMaxCents: request.budgetMaxCents,
          platform: request.platform,
          deliverables: request.deliverables,
          postBy: request.postBy ? request.postBy.toISOString().slice(0, 10) : null,
          productIncluded: request.productIncluded,
        }}
      />
      {isDraft && (
        <ConfirmActionButton
          action={deleteDraftAction.bind(null, request.id)}
          successMessage={t("screens.requests.draftDeleted")}
          title={t("screens.requests.deleteDraftTitle")}
          description={t("screens.requests.deleteDraftBody")}
          confirmLabel={t("screens.requests.deleteDraft")}
          redirectTo="/dashboard/startup"
          className="self-start text-sm text-neutral-500 underline transition hover:text-ink dark:text-neutral-400"
        >
          {t("screens.requests.deleteDraft")}
        </ConfirmActionButton>
      )}
    </div>
  );
}
