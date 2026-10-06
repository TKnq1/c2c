import Link from "next/link";
import type { Prisma, Role } from "@prisma/client";
import { FiUsers } from "react-icons/fi";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { EmptyState } from "@/components/empty-state";
import { LocalDate } from "@/components/local-date";
import { RoleBadge } from "@/components/admin/role-badge";
import { FilterTabs, ListSearch, Pagination, firstParams, pageFrom } from "@/components/admin/list-controls";

const PATH = "/admin/users";
const PAGE_SIZE = 25;
const ROLES: Role[] = ["STARTUP", "CREATOR", "ADMIN"];

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  await requireAdminSession();
  const params = firstParams(await props.searchParams);
  const page = pageFrom(params.page);
  const role = ROLES.includes(params.role as Role) ? (params.role as Role) : undefined;
  const q = params.q?.trim();

  const where: Prisma.UserWhereInput = {
    ...(role && (role === "ADMIN" ? { OR: [{ role: "ADMIN" as const }, { isAdmin: true }] } : { role })),
    ...(params.status === "suspended" && { suspendedAt: { not: null } }),
    ...(params.pro === "1" && { startupProfile: { isPro: true } }),
    ...(q && {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { startupProfile: { companyName: { contains: q, mode: "insensitive" } } },
        { creatorProfile: { displayName: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const [users, total, roleCounts, suspendedCount, adminCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        startupProfile: { select: { companyName: true, isPro: true, foundingNumber: true } },
        creatorProfile: { select: { displayName: true, niches: true } },
        _count: { select: { reportsReceived: { where: { status: "OPEN" } } } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.user.count({ where: { suspendedAt: { not: null } } }),
    prisma.user.count({ where: { OR: [{ role: "ADMIN" }, { isAdmin: true }] } }),
  ]);
  const countFor = (r: Role) => roleCounts.find((c) => c.role === r)?._count ?? 0;
  const allCount = roleCounts.reduce((sum, c) => sum + c._count, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-bold">Users</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Every account on comtor. Open one to see its activity or suspend it.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          path={PATH}
          params={{ ...params, pro: undefined }}
          name="role"
          options={[
            { value: undefined, label: "All", count: allCount },
            { value: "STARTUP", label: "Brands", count: countFor("STARTUP") },
            { value: "CREATOR", label: "Creators", count: countFor("CREATOR") },
            { value: "ADMIN", label: "Admins", count: adminCount },
          ]}
        />
        <ListSearch path={PATH} params={params} placeholder="Search email or name" />
      </div>
      <FilterTabs
        path={PATH}
        params={params}
        name="status"
        options={[
          { value: undefined, label: "Any status" },
          { value: "suspended", label: "Suspended", count: suspendedCount },
        ]}
      />

      {users.length === 0 ? (
        <EmptyState icon={FiUsers} title="No users found" description="Try another search or filter." />
      ) : (
        <ul className="rounded bg-fog">
          {users.map((u) => {
            const name = u.startupProfile?.companyName ?? u.creatorProfile?.displayName ?? u.email;
            return (
              <li key={u.id} className="border-ink/10 [&+&]:border-t">
                <Link
                  href={`/admin/users/${u.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-ink/5 md:grid-cols-[minmax(0,1fr)_8rem_7rem_11rem]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {name}
                      {u.startupProfile?.isPro && (
                        <span className="ml-2 text-xs font-medium">
                          {u.startupProfile.foundingNumber ? `Pro · Founding #${u.startupProfile.foundingNumber}` : "Pro"}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-footnote text-neutral-500 dark:text-neutral-400">
                      {u.email}
                      {u.creatorProfile && ` · ${u.creatorProfile.niches.join(", ")}`}
                    </span>
                  </span>
                  <span className="hidden text-footnote text-neutral-500 md:block dark:text-neutral-400">
                    {u.emailVerified ? "Verified" : "Unverified"}
                    {u.totpEnabled && " · 2FA"}
                  </span>
                  <span className="hidden text-footnote tabular-nums text-neutral-500 md:block dark:text-neutral-400">
                    <LocalDate ms={u.createdAt.getTime()} />
                  </span>
                  <span className="flex items-center gap-2 justify-self-end">
                    {u._count.reportsReceived > 0 && (
                      <span className="whitespace-nowrap text-xs font-medium">
                        {u._count.reportsReceived} report{u._count.reportsReceived === 1 ? "" : "s"}
                      </span>
                    )}
                    <RoleBadge role={u.role} isAdmin={u.isAdmin} suspended={!!u.suspendedAt} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination path={PATH} params={params} page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
