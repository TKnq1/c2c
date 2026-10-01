import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  const [openReports, openDisputes] = await Promise.all([
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.interest.count({ where: { paymentStatus: "HELD", disputedAt: { not: null } } }),
  ]);

  return (
    <div className="flex flex-1 flex-col pt-[var(--safe-top)]">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-fog px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline dark:text-neutral-400">{session.user.email}</span>
            {session.user.role !== "ADMIN" && (
              <Link href="/dashboard" className="text-sm underline">
                Back to app
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-8">
        <aside className="md:sticky md:top-8 md:w-52 md:shrink-0 md:self-start">
          <AdminNav attentionCount={openReports + openDisputes} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-0 md:py-0">{children}</main>
      </div>
    </div>
  );
}
