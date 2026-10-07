import Link from "next/link";
import { FiAlertTriangle, FiCalendar, FiSun } from "react-icons/fi";
import { requireAdminSession } from "@/lib/admin-session";
import { listNotices } from "@/lib/admin-notices";
import { NOTICE_KIND_LABEL, parseNoticeBody } from "@/lib/admin-notice-format";
import { DashCard, PageHeader } from "@/components/admin/dashboard-parts";
import { MarkNoticesRead } from "@/components/admin/notice-read";
import { LocalDate } from "@/components/local-date";

export const metadata = { title: "Mitteilungen" };

const KIND_ICON = { DAILY: FiSun, WEEKLY: FiCalendar, URGENT: FiAlertTriangle } as const;

export default async function AdminNoticesPage() {
  await requireAdminSession();
  const notices = await listNotices();
  const unread = notices.filter((n) => n.readAt === null).length;

  return (
    <div className="flex flex-col gap-6">
      <MarkNoticesRead unread={unread} />
      <PageHeader
        title="Mitteilungen"
        sub="Der Tagesbericht jeden Morgen, der Wochenbericht montags und alles Dringende, sobald es passiert. Per Mail kommen Kopien davon, das stellst du unter „Anpassen“ ein."
      />

      {notices.length === 0 ? (
        <DashCard>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Noch nichts da. Der erste Tagesbericht erscheint am Morgen, sobald du das Dashboard öffnest oder der tägliche Job läuft.</p>
        </DashCard>
      ) : (
        <ol className="flex flex-col gap-[var(--gap,1rem)]">
          {notices.map((n) => {
            const Icon = KIND_ICON[n.kind];
            const isNew = n.readAt === null;
            return (
              <li key={n.id}>
                <DashCard>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.kind === "URGENT" ? "bg-[#d03b3b]/12 text-[#d03b3b]" : "bg-fog text-graphite"}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">{NOTICE_KIND_LABEL[n.kind]}</span>
                        <LocalDate ms={n.createdAt.getTime()} locale="de-DE" withTime />
                        {isNew && <span className="rounded-full bg-accent px-2 py-px text-[0.6875rem] font-bold text-on-accent">Neu</span>}
                      </p>
                      <h2 className="font-display text-lg leading-6 font-black">{n.title}</h2>
                      <div className="mt-3 flex flex-col gap-3">
                        {parseNoticeBody(n.body).map((section, i) => (
                          <div key={i}>
                            {section.title && <h3 className="mb-1 text-xs font-bold text-graphite">{section.title}</h3>}
                            <ul className="flex flex-col gap-0.5 text-sm">
                              {section.lines.map((line, j) => (
                                <li key={j}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      {n.href && (
                        <p className="mt-3 text-sm">
                          <Link href={n.href} className="font-bold underline underline-offset-2">
                            Öffnen
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                </DashCard>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
