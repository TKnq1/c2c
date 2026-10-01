import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brandRating, legacyRequestPhotoUrl, requestPhotoUrl } from "@/lib/request-photos";
import { RequestForm } from "@/components/request-form";
import type { PhotoItem } from "@/components/request-photos-input";
import { PageTitle } from "@/components/page-title";

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  const [startup, request] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      select: { id: true, companyName: true, avatarUrl: true },
    }),
    prisma.request.findUnique({
      where: { id },
      include: { images: { select: { id: true }, orderBy: { position: "asc" } } },
    }),
  ]);
  if (!request || request.startupId !== startup.id) notFound();
  const rating = await brandRating(startup.id);

  const photos: PhotoItem[] =
    request.images.length > 0
      ? request.images.map((i) => ({ key: i.id, kind: "existing", id: i.id, url: requestPhotoUrl(i.id) }))
      : request.imageUrl
        ? [{ key: "legacy", kind: "legacy", url: legacyRequestPhotoUrl(request.id) }]
        : [];

  return (
    // On phones the header shows the title (see getPageTitle in nav.tsx).
    <div className="flex flex-col gap-6">
      <PageTitle>Edit request</PageTitle>
      <RequestForm
        requestId={request.id}
        brand={{ companyName: startup.companyName, avatarUrl: startup.avatarUrl, rating }}
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
    </div>
  );
}
