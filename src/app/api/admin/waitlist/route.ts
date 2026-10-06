import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/audit";
import { csvRow } from "@/lib/csv";

// The confirmed part of the waitlist as a spreadsheet, for the launch
// email: an address nobody confirmed must not get it (double opt-in).
// Admin only.

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response("Not authorized", { status: 401 });

  const entries = await prisma.waitlistEntry.findMany({
    where: { confirmedAt: { not: null } },
    orderBy: { createdAt: "asc" },
  });
  const lines = [
    csvRow(["Email", "Side", "Joined", "Confirmed"]),
    ...entries.map((e) =>
      csvRow([
        e.email,
        e.role === "STARTUP" ? "Brand" : e.role === "CREATOR" ? "Creator" : "",
        e.createdAt.toISOString().slice(0, 10),
        e.confirmedAt?.toISOString().slice(0, 10) ?? "",
      ]),
    ),
  ];
  await audit(session.user.id, "waitlist.export", undefined, { rows: entries.length });

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="comtor-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
