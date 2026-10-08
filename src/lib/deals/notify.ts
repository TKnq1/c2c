import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { dealLocale } from "@/lib/deals/copy";
import { noticeText, type NoticeKey, type NoticeParams } from "@/lib/deals/notices";

// Tells one person about something on a deal, in their language. Never throws: a notice that fails to go out must not
// undo the step that caused it.
export async function notifyDealParty(userId: string, key: NoticeKey, params: NoticeParams, link: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
    await notify(userId, noticeText(key, dealLocale(user?.locale ?? "de"), params), link, "payments");
  } catch (err) {
    console.error("Deal notification failed", { key, err });
  }
}

export const dealHref = (dealId: string) => `/dashboard/deals/${dealId}`;
