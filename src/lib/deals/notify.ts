import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { dealNoticeEmail } from "@/lib/email-templates";
import { notify } from "@/lib/notifications";
import { SITE_URL } from "@/lib/site";
import { dealLocale } from "@/lib/deals/copy";
import { ACTION_NOTICES, EMAIL_NOTICES, noticeSubject, noticeText, type NoticeKey, type NoticeParams } from "@/lib/deals/notices";

// Tells one person about something on a deal, in their language: in the app always, and by e-mail when a deadline, a
// cancellation, a dispute or money is behind it (EMAIL_NOTICES). Those are not switched off by the payment notification
// setting either: missing one can cost the person a deal. Never throws: a notice that fails to go out must not undo the step
// that caused it.
export async function notifyDealParty(userId: string, key: NoticeKey, params: NoticeParams, link: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true, email: true, emailVerified: true, deletedAt: true, suspendedAt: true },
    });
    const language = dealLocale(user?.locale ?? "de");
    const text = noticeText(key, language, params);
    const byMail = EMAIL_NOTICES.has(key);
    await notify(userId, text, link, "payments", { force: byMail });

    const subject = byMail ? noticeSubject(key, language, params) : null;
    if (subject && user && user.emailVerified && !user.deletedAt && !user.suspendedAt) {
      await sendEmail({ to: user.email, ...dealNoticeEmail({ subject, text, url: `${SITE_URL}${link}`, actionNeeded: ACTION_NOTICES.has(key) }, language) });
    }
  } catch (err) {
    console.error("Deal notification failed", { key, err });
  }
}

export const dealHref = (dealId: string) => `/dashboard/deals/${dealId}`;
