import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { BriefingBuilder } from "@/components/deals/briefing-builder";
import { PageTitle } from "@/components/page-title";
import { briefingStartValues } from "@/lib/deals/briefing-templates";
import { dealLocale } from "@/lib/deals/copy";
import { dealsEnabled } from "@/lib/deals/flag";
import { uiText } from "@/lib/deals/ui-copy";

export default async function BriefingPage(props: PageProps<"/dashboard/startup/requests/[id]/briefing">) {
  const { id } = await props.params;
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");
  if (!dealsEnabled()) notFound();
  const u = uiText(dealLocale(await getLocale()));

  const request = await prisma.request.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      platform: true,
      postBy: true,
      budgetMinCents: true,
      budgetMaxCents: true,
      briefing: true,
      startup: { select: { userId: true } },
    },
  });
  if (!request || request.startup.userId !== session.user.id) notFound();

  // The builder starts from an unfinished draft, the saved briefing, the brand's default template or the defaults, in that order.
  const start = await briefingStartValues(id, session.user.id);
  if (!start) notFound();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
      <Link href={`/dashboard/startup/requests/${id}`} className="inline-flex w-fit items-center gap-1 text-sm text-neutral-500 hover:text-ink dark:text-neutral-400">
        <IoChevronBack className="h-4 w-4" aria-hidden />
        {u("briefing.back")}
      </Link>
      <PageTitle description={u("briefing.description")}>{u("briefing.title")}</PageTitle>
      <p className="text-sm font-medium">{request.title}</p>
      {!request.briefing && <p className="text-sm text-neutral-500 dark:text-neutral-400">{u("briefing.notSet")}</p>}
      <BriefingBuilder requestId={id} initialValues={start.values} budgetMaxCents={request.budgetMaxCents ?? request.budgetMinCents ?? null} />
    </div>
  );
}
