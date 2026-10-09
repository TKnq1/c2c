import { auth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { HOUR, takeToken } from "@/lib/rate-limit";
import { renderInvoicePdf } from "@/lib/billing/pdf";

// An issued invoice or credit note as a PDF, for the one it was issued to and for admins, nobody else. Built from what was stored
// when the document was issued, so every download of the same document is the same file.
const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cache-Control": "private, no-store",
};

export async function GET(_request: Request, ctx: RouteContext<"/api/invoices/[id]/pdf">) {
  const session = await auth();
  if (!session) return new Response("Not authorized", { status: 401 });
  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || (invoice.recipientUserId !== session.user.id && !hasAdminAccess(session.user))) return new Response("Not found", { status: 404 });
  if (!(await takeToken("invoice-pdf", session.user.id, 60, HOUR))) return new Response("Too many downloads. Try again later.", { status: 429 });

  const pdf = await renderInvoicePdf(invoice);
  return new Response(Buffer.from(pdf), {
    headers: { ...HEADERS, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${invoice.number}.pdf"` },
  });
}
