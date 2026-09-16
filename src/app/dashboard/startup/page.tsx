import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiInbox } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/avatar";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { RequestsFilterBar } from "@/components/requests-filter-bar";
import { BulkRequestsList } from "@/components/bulk-requests-list";
import { EmptyState } from "@/components/empty-state";

export default async function StartupDashboardPage(props: PageProps<"/dashboard/startup">) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  const searchParams = await props.searchParams;
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const sort = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const allRequests = await prisma.request.findMany({
    where: { startupId: startup.id },
    include: { _count: { select: { interests: true } } },
    orderBy: { createdAt: "desc" },
  });

  const hasAnyRequests = allRequests.length > 0;
  const requests = allRequests
    .filter((r) => (status === "OPEN" || status === "CLOSED" ? r.status === status : true))
    .sort((a, b) => {
      if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
      if (sort === "interest") return b._count.interests - a._count.interests;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  return (
    <div className="flex flex-col gap-6">
      <OnboardingChecklist
        storageKey="onboarding-startup"
        items={[
          { label: "Add your logo", done: !!startup.avatarUrl, href: "/dashboard/startup/settings#profile" },
          {
            label: "Tell creators about your brand",
            done: !!startup.description,
            href: "/dashboard/startup/settings#profile",
          },
          { label: "Post your first request", done: hasAnyRequests, href: "/dashboard/startup/new" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={startup.avatarUrl} name={startup.companyName} size={48} />
          <h1 className="font-display text-3xl font-normal">{startup.companyName}</h1>
        </div>
        <Link
          href="/dashboard/startup/new"
          className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition whitespace-nowrap"
        >
          + New request
        </Link>
      </div>

      {hasAnyRequests && (
        <Suspense fallback={<div className="h-10" />}>
          <RequestsFilterBar />
        </Suspense>
      )}

      {requests.length === 0 ? (
        hasAnyRequests ? (
          <EmptyState icon={FiInbox} title="No requests match this filter." description="Try switching to a different tab above." />
        ) : (
          <EmptyState
            icon={FiInbox}
            title="No requests yet."
            description="Post a request so matching creators can find and apply to it."
            action={{ label: "Create your first request", href: "/dashboard/startup/new" }}
          />
        )
      ) : (
        <BulkRequestsList
          requests={requests.map((r) => ({
            id: r.id,
            title: r.title,
            niche: r.niche,
            minFollowers: r.minFollowers,
            status: r.status,
            interestCount: r._count.interests,
          }))}
        />
      )}
    </div>
  );
}
