import { after } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { refreshExternalSnapshots } from "@/lib/admin-external";
import { getAdminPrefs } from "@/lib/admin-prefs-server";
import { accentCss } from "@/lib/admin-theme";
import { listOpenTasks, syncChecks } from "@/lib/admin-tasks";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPalette } from "@/components/admin/admin-palette";
import { ClaudePanel } from "@/components/admin/claude-panel";
import { MorningStart } from "@/components/admin/morning-start";
import { SetupWizard } from "@/components/admin/setup-wizard";
import { adminConnections } from "@/lib/admin-connections";
import { loadMorningStats } from "@/lib/admin-dashboard";
import { formatCents } from "@/lib/format";
import type { TaskView } from "@/components/admin/task-list";
import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

// The signed-in app: never in search, whatever links to it.
export const metadata: Metadata = { robots: NO_INDEX };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  // Sentry and Stripe are asked again in the background when their stored answer is a few minutes old.
  after(() => refreshExternalSnapshots());
  const prefs = await getAdminPrefs(session.user.id);

  // The fixed checks bring the Offen list up to date before it is read, so every admin page shows the same list.
  await syncChecks();
  const [tasks, openReports, openDisputes] = await Promise.all([
    listOpenTasks(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.interest.count({ where: { paymentStatus: "HELD", disputedAt: { not: null } } }),
  ]);

  // The morning screen's numbers, only fetched when it can show at all.
  const morningNeeded = prefs.setupDone && prefs.morningEnabled;
  const morning = morningNeeded ? await loadMorningStats(prefs.goalBrands) : null;
  const brandsLeft = morning?.brandsLeft ?? 0;

  const taskViews: TaskView[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    reason: t.reason,
    priority: t.priority,
    source: t.source,
    href: t.href,
  }));
  const spacing = prefs.compact ? ".admin-shell{--pad:.875rem;--gap:.625rem}" : ".admin-shell{--pad:1.25rem;--gap:1rem}";

  return (
    <div className="admin-shell flex flex-1 flex-col">
      <style dangerouslySetInnerHTML={{ __html: accentCss(prefs.accent) + spacing }} />
      <AdminShell
        counts={{ attention: openReports + openDisputes, tasks: tasks.length }}
        email={session.user.email ?? ""}
        backToApp={session.user.role !== "ADMIN"}
        panelOpen={prefs.panelOpen}
        panel={<ClaudePanel tasks={taskViews} />}
        overlays={
          <>
            <AdminPalette />
            <SetupWizard initial={prefs} needed={!prefs.setupDone} connections={adminConnections()} />
            {morningNeeded && (
              <MorningStart
                enabled={prefs.morningEnabled}
                from={prefs.morningFromHour}
                to={prefs.morningToHour}
                everyTime={prefs.morningEveryTime}
                volume={prefs.songVolume}
                name={prefs.displayName}
                stats={{ newUsers: morning?.newUsers ?? 0, openTasks: tasks.length, feeLabel: formatCents(morning?.feeCents ?? 0) }}
                goalLine={brandsLeft > 0 ? `Noch ${brandsLeft} Founding-${brandsLeft === 1 ? "Marke" : "Marken"} bis zum Ziel.` : "Das Ziel für Founding-Marken ist erreicht."}
              />
            )}
          </>
        }
      >
        {children}
      </AdminShell>
    </div>
  );
}
