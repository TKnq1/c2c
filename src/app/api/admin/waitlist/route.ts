import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminAccess } from "@/lib/admin-access";

// The confirmed part of the waitlist as a spreadsheet, for the launch
// email: an address nobody confirmed must not get it (double opt-in).
// Admin only.

function csvCell(value: string): string {
  // A leading = + - or @ would make Excel read the cell as a formula.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function GET() {
  const session = await auth();
  if (!session || !hasAdminAccess(session.user)) return new Response("Not authorized", { status: 401 });

  const entries = await prisma.waitlistEntry.findMany({
    where: { confirmedAt: { not: null } },
    orderBy: { createdAt: "asc" },
  });
  const lines = [
    ["Email", "Side", "Joined", "Confirmed"].join(","),
    ...entries.map((e) =>
      [
        csvCell(e.email),
        e.role === "STARTUP" ? "Brand" : e.role === "CREATOR" ? "Creator" : "",
        e.createdAt.toISOString().slice(0, 10),
        e.confirmedAt?.toISOString().slice(0, 10) ?? "",
      ].join(","),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="comtor-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
