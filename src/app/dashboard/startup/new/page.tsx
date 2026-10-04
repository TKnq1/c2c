import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brandRating } from "@/lib/request-photos";
import { RequestForm } from "@/components/request-form";
import { PageTitle } from "@/components/page-title";
import { getT } from "@/lib/i18n/server";

export default async function NewRequestPage() {
  const t = await getT();
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  const startup = await prisma.startupProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
    select: { id: true, companyName: true, avatarUrl: true },
  });
  const rating = await brandRating(startup.id);

  return (
    // On phones the header shows the title (see getPageTitle in nav.tsx).
    <div className="flex flex-col gap-6">
      <PageTitle>{t("nav.newRequest")}</PageTitle>
      <RequestForm brand={{ companyName: startup.companyName, avatarUrl: startup.avatarUrl, rating }} />
    </div>
  );
}
