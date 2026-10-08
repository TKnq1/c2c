import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { hasAdminAccess } from "@/lib/admin-access";
import { formatCents } from "@/lib/format";
import { parseUserAgent } from "@/lib/user-agent";
import { deleteUserAction, revokeFoundingProAction, unsuspendUserAction } from "@/lib/actions/admin";
import { Avatar } from "@/components/avatar";
import { LocalDate } from "@/components/local-date";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { paymentStage } from "@/lib/payment-stage";
import { RoleBadge } from "@/components/admin/role-badge";
import { StatTile } from "@/components/admin/stat-tile";
import { SuspendUserButton } from "@/components/admin/suspend-user-button";
import { UserTimeline } from "@/components/admin/user-timeline";
import { loadTimeline } from "@/lib/admin-timeline";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h2 className="px-1 text-footnote text-neutral-500 dark:text-neutral-400">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">{children}</p>;
}

export default async function AdminUserPage(props: PageProps<"/admin/users/[id]">) {
  const session = await requireAdminSession();
  const { id } = await props.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      startupProfile: { include: { _count: { select: { requests: true } } } },
      creatorProfile: { include: { platforms: true } },
      reportsReceived: { include: { reporter: { select: { email: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { reportsMade: true, blocksReceived: true } },
      loginAttempts: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!user) notFound();

  const brand = user.startupProfile;
  const creator = user.creatorProfile;
  // Pro and the founding place, on whichever side the account is.
  const pro = brand ?? creator;
  const paymentWhere = brand
    ? { request: { startupId: brand.id }, paymentStatus: { not: null } }
    : creator
      ? { creatorId: creator.id, paymentStatus: { not: null } }
      : null;

  const [payments, releasedAgg, requests, timeline] = await Promise.all([
    paymentWhere
      ? prisma.interest.findMany({
          where: paymentWhere,
          include: { creator: true, request: { include: { startup: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [],
    paymentWhere
      ? prisma.interest.aggregate({
          where: { ...paymentWhere, paymentStatus: "RELEASED" },
          _sum: { amountCents: true, payoutCents: true },
          _count: true,
        })
      : null,
    brand
      ? prisma.request.findMany({
          where: { startupId: brand.id },
          include: { _count: { select: { interests: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [],
    loadTimeline(id),
  ]);

  const name = brand?.companyName ?? creator?.displayName ?? user.email;
  const openReports = user.reportsReceived.filter((r) => r.status === "OPEN").length;
  const canSuspend = !hasAdminAccess(user) && user.id !== session.user.id;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/users"
        className="flex items-center gap-1.5 self-start text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400"
      >
        <FiArrowLeft className="h-4 w-4" aria-hidden /> Users
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar src={brand?.avatarUrl ?? creator?.avatarUrl ?? null} name={name} size={56} />
          <div className="min-w-0">
            <h1 className="truncate font-display text-title-2 font-bold">{name}</h1>
            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RoleBadge role={user.role} isAdmin={user.isAdmin} />
              {pro?.isPro && (
                <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-paper">
                  {pro.foundingNumber ? `Pro · Founding #${pro.foundingNumber}` : "Pro"}
                </span>
              )}
              <span className="text-footnote text-neutral-500 dark:text-neutral-400">
                Joined <LocalDate ms={user.createdAt.getTime()} /> · {user.emailVerified ? "Email verified" : "Email not verified"}
                {user.totpEnabled && " · 2FA on"}
              </span>
            </div>
          </div>
        </div>
        {canSuspend && (
          <div className="flex flex-wrap items-center gap-2">
            {!user.suspendedAt && <SuspendUserButton userId={user.id} label={name} isBrand={!!brand} />}
            {pro?.foundingNumber && (
              <ConfirmActionButton
                action={revokeFoundingProAction.bind(null, user.id)}
                successMessage={`${name} no longer has a founding place.`}
                title={`Take founding Pro from ${name}?`}
                description={`Founding ${brand ? "brand" : "creator"} #${pro.foundingNumber} loses the free Pro (the fee goes back to the standard rate) and the number is free for the next ${brand ? "brand" : "creator"}. A Pro subscription paid for separately keeps running.`}
                confirmLabel="Take away"
                pendingLabel="Taking away…"
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-ink dark:border-neutral-700"
              >
                Take founding Pro away
              </ConfirmActionButton>
            )}
            <ConfirmActionButton
              action={deleteUserAction.bind(null, user.id)}
              requirePassword
              successMessage={`${name} is deleted.`}
              title={`Delete ${name}?`}
              description={`${user.email} is deleted for good, with everything that belongs to the account: the profile${brand ? ", its requests" : ""}, interests, messages, reviews and notifications. Payment records, if there are any, stay without the person. This can't be undone.`}
              confirmLabel="Delete"
              pendingLabel="Deleting…"
              redirectTo="/admin/users"
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-ink dark:border-neutral-700"
            >
              Delete account
            </ConfirmActionButton>
          </div>
        )}
      </div>

      {user.suspendedAt && (
        <div className="flex flex-col gap-3 rounded border border-dashed border-ink px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-medium">
              Suspended since <LocalDate ms={user.suspendedAt.getTime()} withTime />
            </p>
            {user.suspendedReason && <p className="text-neutral-600 dark:text-neutral-400">“{user.suspendedReason}”</p>}
          </div>
          <ConfirmActionButton
            action={unsuspendUserAction.bind(null, user.id)}
            successMessage={`${name} can sign in again.`}
            title={`Unsuspend ${name}?`}
            description="They can sign in again right away. Requests closed by the suspension stay closed until the brand reopens them."
            confirmLabel="Unsuspend"
            pendingLabel="Unsuspending…"
            className="shrink-0 self-start rounded-full border border-ink px-4 py-2 text-sm font-medium transition hover:bg-fog sm:self-auto"
          >
            Unsuspend
          </ConfirmActionButton>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {brand && (
          <>
            <StatTile label="Requests" value={String(brand._count.requests)} hint="Posted by this brand" />
            <StatTile
              label="Paid out to creators"
              value={formatCents(releasedAgg?._sum.amountCents ?? 0)}
              hint={`${releasedAgg?._count ?? 0} released payments`}
            />
          </>
        )}
        {creator && (
          <>
            <StatTile
              label="Earned"
              value={formatCents(releasedAgg?._sum.payoutCents ?? 0)}
              hint={`${releasedAgg?._count ?? 0} released payments`}
            />
            <StatTile
              label="Payouts"
              value={creator.stripeOnboarded ? "Connected" : "Not set up"}
              hint={creator.stripeOnboarded ? "Stripe can send them money" : "No Stripe account yet"}
            />
          </>
        )}
        <StatTile
          label="Reports about them"
          value={String(user.reportsReceived.length)}
          hint={`${openReports} open · blocked by ${user._count.blocksReceived} · filed ${user._count.reportsMade}`}
        />
      </div>

      <Section title="Verlauf">
        <UserTimeline events={timeline} />
      </Section>

      {creator && (
        <Section title="Profile">
          <div className="flex flex-col gap-1 rounded bg-fog px-4 py-3 text-sm">
            <p>
              {creator.niches.join(", ") || "No niche set"}
              {creator.contentLanguage && ` · ${creator.contentLanguage}`}
            </p>
            {creator.platforms.length > 0 && (
              <p className="text-neutral-600 dark:text-neutral-400">
                {creator.platforms
                  .map((p) => `${p.platform} ${p.followerCount.toLocaleString("en-US")}`)
                  .join(" · ")}
              </p>
            )}
            {creator.bio && <p className="text-neutral-600 dark:text-neutral-400">{creator.bio}</p>}
          </div>
        </Section>
      )}

      {brand && (
        <Section title="Brand">
          <div className="flex flex-col gap-1 rounded bg-fog px-4 py-3 text-sm">
            <p>
              {brand.niche ?? "No niche set"}
              {brand.website && (
                <>
                  {" · "}
                  <a href={brand.website} target="_blank" rel="noopener noreferrer" className="underline">
                    {brand.website.replace(/^https?:\/\//, "")}
                  </a>
                </>
              )}
            </p>
            {brand.description && <p className="text-neutral-600 dark:text-neutral-400">{brand.description}</p>}
          </div>
        </Section>
      )}

      <Section title="Reports about this account">
        {user.reportsReceived.length === 0 ? (
          <Empty>Nobody has reported this account.</Empty>
        ) : (
          <ul className="rounded bg-fog">
            {user.reportsReceived.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 border-ink/10 px-4 py-3 [&+&]:border-t">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{r.reason}</span>
                  <span className="text-xs font-medium">{r.status === "OPEN" ? "Open" : r.status === "RESOLVED" ? "Resolved" : "Dismissed"}</span>
                </div>
                {r.details && <p className="text-sm text-neutral-600 dark:text-neutral-400">{r.details}</p>}
                <p className="text-footnote text-neutral-500 dark:text-neutral-400">
                  {r.reporter?.email ?? "Automated flag"} · <LocalDate ms={r.createdAt.getTime()} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {brand && (
        <Section title="Latest requests">
          {requests.length === 0 ? (
            <Empty>No requests yet.</Empty>
          ) : (
            <ul className="rounded bg-fog">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 border-ink/10 px-4 py-3 [&+&]:border-t">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    <span className="block text-footnote text-neutral-500 dark:text-neutral-400">
                      {r.niche} · {r._count.interests} interested · <LocalDate ms={r.createdAt.getTime()} />
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium">{r.status === "OPEN" ? "Open" : r.status === "DRAFT" ? "Draft" : "Closed"}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {(brand || creator) && (
        <Section title="Latest payments">
          {payments.length === 0 ? (
            <Empty>No payments yet.</Empty>
          ) : (
            <ul className="rounded bg-fog">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 border-ink/10 px-4 py-3 [&+&]:border-t">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {brand ? p.creator.displayName : p.request.startup.companyName} · {p.request.title}
                    </span>
                    <span className="block text-footnote tabular-nums text-neutral-500 dark:text-neutral-400">
                      {p.amountCents !== null ? formatCents(p.amountCents) : "No amount"}
                    </span>
                  </span>
                  <PaymentStatusBadge status={paymentStage({ ...p, paymentStatus: p.paymentStatus! })} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title="Sign-in attempts">
        {user.loginAttempts.length === 0 ? (
          <Empty>No sign-ins recorded.</Empty>
        ) : (
          <ul className="rounded bg-fog">
            {user.loginAttempts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 border-ink/10 px-4 py-3 [&+&]:border-t">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{parseUserAgent(a.userAgent)}</span>
                  <span className="block text-footnote tabular-nums text-neutral-500 dark:text-neutral-400">
                    <LocalDate ms={a.createdAt.getTime()} withTime />
                    {a.ipAddress && ` · ${a.ipAddress}`}
                  </span>
                </span>
                <span className={`shrink-0 text-xs font-medium ${a.succeeded ? "" : "underline decoration-dashed"}`}>
                  {a.succeeded ? "Signed in" : "Failed"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
