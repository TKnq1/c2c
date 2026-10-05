import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { OutreachList } from "@/components/admin/outreach-list";

export default async function AdminMailingPage() {
  await requireAdminSession();
  const rows = await prisma.outreachAddress.findMany({ orderBy: { createdAt: "desc" } });
  const creators = rows.filter((row) => row.side === "CREATOR");
  const brands = rows.filter((row) => row.side === "STARTUP");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-bold">Mailing</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Two lists. Add the addresses yourself. You write the subject. The email itself is in English and explains what
          comtor is: brands post a paid deal, creators swipe, the money is held until the post is approved.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <OutreachList
          side="CREATOR"
          title="Creators"
          blurb="The button opens their feed. The note says comtor has their email as a creator."
          addresses={creators}
        />
        <OutreachList
          side="STARTUP"
          title="Brands"
          blurb="The button opens a new request. The note says comtor has their email as a brand."
          addresses={brands}
        />
      </div>
    </div>
  );
}
