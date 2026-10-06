import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { RoleBadge } from "@/components/admin/role-badge";
import { OutreachList } from "@/components/admin/outreach-list";
import { SentMailings } from "@/components/admin/sent-mailings";
import { outreachStats } from "@/lib/outreach-tracking";

// Several addresses go out one after another. The default limit cuts that
// off and the whole page turns into the error screen.
export const maxDuration = 60;

export default async function AdminMailingPage() {
  await requireAdminSession();
  const rows = await prisma.outreachAddress.findMany({
    orderBy: { createdAt: "desc" },
    include: { deliveries: { select: { openCount: true, clickCount: true } } },
  });
  const listed = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    side: row.side,
    ...outreachStats(row.deliveries),
  }));
  const creators = listed.filter((row) => row.side === "CREATOR");
  const brands = listed.filter((row) => row.side === "STARTUP");
  const consented = await prisma.user.findMany({
    where: { marketingConsentAt: { not: null }, deletedAt: null },
    orderBy: { marketingConsentAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      marketingConsentAt: true,
      creatorProfile: { select: { displayName: true } },
      startupProfile: { select: { companyName: true } },
    },
  });
  const mailings = await prisma.outreachMailing.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      deliveries: {
        orderBy: { sentAt: "asc" },
        select: {
          id: true,
          recipientName: true,
          recipientEmail: true,
          openCount: true,
          clickCount: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-bold">Mailing</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Only business email addresses. Do not add a private person. Mark who should get this mail. Sent is every mail that already went out, and who got it.
          Opened counts when the images load, so it can fire without anyone reading. Clicked is the button.
        </p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-title-2 font-bold">May receive product news ({consented.length})</h2>
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          These accounts pressed the button in the confirmation email. Only they may get product news. Opening the link does not count. The lists below are typed-in addresses and are not this consent.
        </p>
        {consented.length === 0 ? (
          <p className="text-sm text-neutral-500">Nobody has confirmed yet.</p>
        ) : (
          <ul className="divide-y divide-ink/10 rounded border border-ink/10">
            {consented.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {person.creatorProfile?.displayName ?? person.startupProfile?.companyName ?? person.email}
                  </p>
                  <p className="truncate text-sm text-neutral-500">{person.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-neutral-500 tabular-nums">
                    {person.marketingConsentAt?.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <RoleBadge role={person.role} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <OutreachList
          side="CREATOR"
          title="Creators"
          blurb="The headline says their name, then “earn money posting on social media.” The button opens the creator side of the landing page."
          addresses={creators}
        />
        <OutreachList
          side="STARTUP"
          title="Brands"
          blurb="The headline says their name, then “grow your brand with content creators.” The button opens the brand side of the landing page."
          addresses={brands}
        />
      </div>
      <SentMailings
        mailings={mailings.map((mailing) => ({
          id: mailing.id,
          side: mailing.side,
          subject: mailing.subject,
          createdAt: mailing.createdAt.getTime(),
          recipients: mailing.deliveries.map((delivery) => ({
            id: delivery.id,
            name: delivery.recipientName,
            email: delivery.recipientEmail,
            openCount: delivery.openCount,
            clickCount: delivery.clickCount,
          })),
        }))}
      />
    </div>
  );
}
