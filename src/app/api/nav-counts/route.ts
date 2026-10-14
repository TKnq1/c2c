import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import { getUnreadMessageCount } from "@/lib/messages";
import { getBrandPendingPaymentActionCount, getPendingPaymentActionCount } from "@/lib/payments";
import { canUseDeals, getDealActionCount } from "@/lib/deals/queries";
import type { NavCounts } from "@/lib/nav-links";

// Fetched client-side by Nav (see nav.tsx) instead of passed down as a
// server prop from dashboard/layout.tsx — that layout sits inside
// PageTransition's key={pathname} div, which remounts on every navigation
// by design (see page-transition.tsx). Nav lives above that boundary now
// so the tab bar itself never remounts; it just re-fetches its badge
// counts on each pathname change instead.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const [unreadCount, unreadMessages, pendingPayments, dealsToDo, dealsVisible] = await Promise.all([
    getUnreadCount(session.user.id),
    getUnreadMessageCount(session.user.id, session.user.role),
    session.user.role === "CREATOR"
      ? getPendingPaymentActionCount(session.user.id)
      : getBrandPendingPaymentActionCount(session.user.id),
    getDealActionCount(session.user.id, session.user.role),
    canUseDeals(session.user.id, session.user.role),
  ]);

  const counts: NavCounts = { unreadCount, unreadMessages, pendingPayments, dealsToDo, dealsVisible };
  return NextResponse.json(counts);
}
