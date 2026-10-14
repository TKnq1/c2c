import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { PageTitle } from "@/components/page-title";
import { TemplateManager } from "@/components/deals/template-manager";
import { listTemplates } from "@/lib/deals/briefing-templates";
import { dealLocale } from "@/lib/deals/copy";
import { dealsEnabled } from "@/lib/deals/flag";
import { uiText } from "@/lib/deals/ui-copy";

export default async function BriefingTemplatesPage() {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");
  if (!dealsEnabled()) notFound();
  const u = uiText(dealLocale(await getLocale()));

  const [templates, requests] = await Promise.all([
    listTemplates(session.user.id),
    prisma.request.findMany({
      where: { startup: { userId: session.user.id } },
      select: { id: true, title: true, status: true, briefing: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
      <Link href="/dashboard/startup" className="inline-flex w-fit items-center gap-1 text-sm text-neutral-500 hover:text-ink dark:text-neutral-400">
        <IoChevronBack className="h-4 w-4" aria-hidden />
        {u("templates.back")}
      </Link>
      <PageTitle description={u("templates.description")}>{u("templates.title")}</PageTitle>
      <TemplateManager
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          isDefault: t.isDefault,
          lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
          formats: t.formats,
          market: t.market,
          usageType: t.usageType,
        }))}
        requests={requests.map((r) => ({ id: r.id, title: r.title, status: r.status, hasBriefing: r.briefing !== null }))}
      />
    </div>
  );
}
