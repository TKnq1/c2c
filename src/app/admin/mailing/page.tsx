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
          Two lists. Each row is a name and an email. You write the subject. The headline uses their name.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <OutreachList
          side="CREATOR"
          title="Creators"
          blurb="The headline says their name, then “brand collabs just got easier.” The button is See paid deals."
          addresses={creators}
        />
        <OutreachList
          side="STARTUP"
          title="Brands"
          blurb="The headline says their name, then “find the right creators for your product.” The button is Post your first deal."
          addresses={brands}
        />
      </div>
    </div>
  );
}
