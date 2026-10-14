import { prisma } from "@/lib/prisma";
import { sendEmail, type MailAttachment } from "@/lib/email";
import { dealDocumentEmail } from "@/lib/email-templates";
import { SITE_URL } from "@/lib/site";
import { dealLocale } from "@/lib/deals/copy";
import { renderInvoicePdf } from "@/lib/billing/pdf";

// Sends the PDFs of issued documents to their recipient. A document is a transactional mail like a receipt: it does not depend
// on a notification setting. It only goes to an address that is confirmed and to an account that is not suspended or gone.
// Never throws: the documents exist whether or not the mail gets out, and they are always in the app.
export async function mailDocuments(args: {
  userId: string;
  kind: "invoice" | "credit" | "corrected";
  title: string;
  // The document the mail is about (the new one, for a correction), and the ones attached, in order.
  number: string;
  replaces?: string;
  openId: string;
  attachIds: string[];
}): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: args.userId }, select: { email: true, emailVerified: true, locale: true, deletedAt: true, suspendedAt: true } });
    if (!user || !user.emailVerified || user.deletedAt || user.suspendedAt) return;

    const invoices = await prisma.invoice.findMany({ where: { id: { in: args.attachIds }, recipientUserId: args.userId } });
    const attachments: MailAttachment[] = [];
    for (const id of args.attachIds) {
      const invoice = invoices.find((i) => i.id === id);
      if (invoice) attachments.push({ filename: `${invoice.number}.pdf`, content: await renderInvoicePdf(invoice) });
    }
    if (attachments.length === 0) return;

    const mail = dealDocumentEmail(
      { kind: args.kind, title: args.title, number: args.number, replaces: args.replaces, url: `${SITE_URL}/dashboard/invoices/${args.openId}` },
      dealLocale(user.locale),
    );
    await sendEmail({ to: user.email, ...mail, attachments });
  } catch (err) {
    console.error("Mailing the documents failed", { userId: args.userId, err });
  }
}
