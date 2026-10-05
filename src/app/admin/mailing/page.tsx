import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { OutreachList } from "@/components/admin/outreach-list";
import { outreachStats } from "@/lib/outreach-tracking";

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-bold">Mailing</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Two lists. Each row is a name and an email. You write the subject. The headline uses their name. Opened
          counts when the images load, so it can fire without anyone reading. Clicked is the button.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <OutreachList
          side="CREATOR"
          title="Creators"
          blurb="The headline says their name, then “earn money posting TikToks.” The button opens the creator side of the landing page."
          addresses={creators}
        />
        <OutreachList
          side="STARTUP"
          title="Brands"
          blurb="The headline says their name, then “grow your brand with content creators.” The button opens the brand side of the landing page."
          addresses={brands}
        />
      </div>
    </div>
  );
}
