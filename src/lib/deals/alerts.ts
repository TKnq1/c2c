import { notifyUrgent } from "@/lib/admin-digest";
import { formatNoticeBody } from "@/lib/admin-notice-format";

// Tells the admins about something on a deal that only a person can settle: in the admin dashboard at once, by mail to those
// who want that. The key makes the same event notify once, so an event that is retried (a webhook, the daily job) does not
// pile up notices; a problem that lasts is also picked up by the checks on the Open page (src/lib/admin-tasks.ts).
export function alertAdmins(args: { key: string; title: string; lines: string[]; href?: string }) {
  notifyUrgent({ key: args.key, title: args.title, body: formatNoticeBody([{ lines: args.lines }]), href: args.href ?? "/admin/deals" });
}

// The calendar day, to let a problem that goes on notify once a day instead of once.
export function dayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
