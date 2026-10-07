import type { AdminNotice, AdminTaskPriority } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { getAdminPrefs } from "@/lib/admin-prefs-server";
import { DEFAULT_PREFS, type AdminPrefs } from "@/lib/admin-prefs";
import { loadAnomalies, type Anomaly } from "@/lib/admin-anomalies";
import { adminNoticeEmail } from "@/lib/admin-digest-mail";
import { focusSummary } from "@/lib/admin-focus";
import { loadKpis, type KpiTileModel } from "@/lib/admin-kpis";
import { formatNoticeBody } from "@/lib/admin-notice-format";
import { adminRecipients, createNotice, pruneNotices, type Recipient } from "@/lib/admin-notices";
import { listOpenTasks, syncChecks } from "@/lib/admin-tasks";
import { prisma } from "@/lib/prisma";
import { runAfter } from "@/lib/run-after";

const dayKey = (now: Date) => now.toISOString().slice(0, 10);
const short = (d: Date) => d.toLocaleDateString("de-DE", { day: "numeric", month: "short", timeZone: "Europe/Berlin" });

// "Nutzer: 19 (+4 diese Woche)": the figure and how far it moved, the same words as on the tile.
export function tileLine(tile: KpiTileModel): string {
  const d = tile.delta;
  if (!d) return `${tile.label}: ${tile.value}`;
  const sign = d.amount > 0 ? "+" : d.amount < 0 ? "−" : "±";
  const size = d.amount === 0 ? "0" : (d.text ?? Math.abs(d.amount).toLocaleString("de-DE"));
  return `${tile.label}: ${tile.value} (${sign}${size} ${d.label})`;
}

type TaskLike = { title: string; priority: AdminTaskPriority };

// The daily report: whether anything needs the admin, the headline figures of the week and what stands out. Pure.
export function composeDaily(input: { tasks: TaskLike[]; tiles: KpiTileModel[]; anomalies: Anomaly[] }): { title: string; body: string } {
  const summary = focusSummary(input.tasks);
  const urgent = input.tasks.filter((t) => t.priority !== "LOW");
  const title = summary.tone === "calm" ? "Tagesbericht: alles ruhig" : `Tagesbericht: ${summary.headline}`;
  const body = formatNoticeBody([
    { title: "Was jetzt ansteht", lines: urgent.length > 0 ? urgent.slice(0, 5).map((t) => t.title) : [summary.sub] },
    { title: "Die Zahlen, 7 Tage", lines: input.tiles.map(tileLine) },
    { title: "Aufgefallen", lines: input.anomalies.map((a) => a.text) },
  ]);
  return { title, body };
}

// The weekly report, on Mondays: the week in figures for growth and money, the forecast to the goal, what stands out.
export function composeWeekly(input: { now: Date; tasks: TaskLike[]; growth: KpiTileModel[]; money: KpiTileModel[]; anomalies: Anomaly[] }): { title: string; body: string } {
  const from = new Date(input.now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const founding = input.growth.find((t) => t.key === "founding");
  const urgent = input.tasks.filter((t) => t.priority !== "LOW").length;
  return {
    title: `Wochenbericht ${short(from)} bis ${short(input.now)}`,
    body: formatNoticeBody([
      { title: "Wachstum", lines: input.growth.map(tileLine) },
      { title: "Geld", lines: input.money.map(tileLine) },
      { title: "Ziel", lines: founding ? [founding.hint] : [] },
      { title: "Aufgefallen", lines: input.anomalies.map((a) => a.text) },
      { title: "Offen", lines: [`${input.tasks.length} ${input.tasks.length === 1 ? "Aufgabe" : "Aufgaben"} offen, davon ${urgent} dringend`] },
    ]),
  };
}

type MailPref = "mailDaily" | "mailUrgent" | "mailWeekly";

// The mail copy of a notice goes to every admin who has that kind switched on. One failed address does not stop the rest;
// the send log (and the Mails page) shows what went wrong.
async function mailCopies(notice: AdminNotice, pref: MailPref, recipients: Recipient[]) {
  const mail = adminNoticeEmail(notice);
  for (const r of recipients.filter((x) => x[pref])) {
    await sendEmail({ to: r.email, ...mail });
  }
}

// Writes the daily (and, on Mondays, the weekly) report once, shows it in the dashboard and mails the copies. Safe to call
// again and again: the date in the key makes a second call a no-op, so the cron job and the first visit of the day can both
// try without sending twice.
export async function runDigests(now = new Date()): Promise<{ daily: boolean; weekly: boolean }> {
  const result = { daily: false, weekly: false };
  const dailyKey = `daily-${dayKey(now)}`;
  const monday = now.getUTCDay() === 1;
  const weeklyKey = `weekly-${dayKey(now)}`;
  const [haveDaily, haveWeekly] = await Promise.all([
    prisma.adminNotice.findUnique({ where: { dedupeKey: dailyKey }, select: { id: true } }),
    monday ? prisma.adminNotice.findUnique({ where: { dedupeKey: weeklyKey }, select: { id: true } }) : Promise.resolve({ id: "not needed" }),
  ]);
  if (haveDaily && haveWeekly) return result;

  const recipients = await adminRecipients();
  const prefs: AdminPrefs = recipients[0] ? await getAdminPrefs(recipients[0].userId) : DEFAULT_PREFS;
  // The checks bring the task list up to date first, so the report says what is true now.
  await syncChecks(now);
  const [tasks, anomalies] = await Promise.all([listOpenTasks(now), loadAnomalies(now)]);

  if (!haveDaily) {
    const tiles = await loadKpis({ now, period: 7, prefs: { ...prefs, kpiSet: "wachstum" } });
    const { title, body } = composeDaily({ tasks, tiles, anomalies });
    const notice = await createNotice({ kind: "DAILY", title, body, href: "/admin", dedupeKey: dailyKey });
    if (notice) {
      result.daily = true;
      await mailCopies(notice, "mailDaily", recipients);
    }
  }
  if (monday && !haveWeekly) {
    const [growth, money] = await Promise.all([loadKpis({ now, period: 7, prefs: { ...prefs, kpiSet: "wachstum" } }), loadKpis({ now, period: 7, prefs: { ...prefs, kpiSet: "geld" } })]);
    const { title, body } = composeWeekly({ now, tasks, growth, money, anomalies });
    const notice = await createNotice({ kind: "WEEKLY", title, body, href: "/admin/wachstum", dedupeKey: weeklyKey });
    if (notice) {
      result.weekly = true;
      await mailCopies(notice, "mailWeekly", recipients);
    }
  }
  await pruneNotices(now);
  return result;
}

// Called from the admin layout after the response: the report exists even where the daily job is not set up. Not before
// 05:00 UTC (the early morning in Germany), so it describes the new day and not the end of the old one.
export function ensureDigests(now = new Date()) {
  if (now.getUTCHours() < 5) return;
  runAfter(() => runDigests(now));
}

// An urgent notice, written at the moment it happens: in the dashboard at once and by mail to those who want that. The key
// makes the same event (a report, a dispute) notify once.
export function notifyUrgent(args: { key: string; title: string; body: string; href?: string }) {
  runAfter(async () => {
    const notice = await createNotice({ kind: "URGENT", title: args.title, body: args.body, href: args.href ?? "/admin", dedupeKey: `urgent-${args.key}` });
    if (notice) await mailCopies(notice, "mailUrgent", await adminRecipients());
  });
}
