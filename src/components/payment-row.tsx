import Link from "next/link";
import { IoChatbubbleOutline } from "react-icons/io5";
import { Avatar } from "@/components/avatar";

// The conversation behind a row — every offer, payment and deposit is
// negotiated in the chat, so each row leads back to it.
export function ChatLink({ interestId, name }: { interestId: string; name: string }) {
  return (
    <Link
      href={`/dashboard/messages/${interestId}`}
      transitionTypes={["nav-forward"]}
      aria-label={`Chat with ${name}`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 transition hover:border-neutral-400 no-print dark:border-neutral-700"
    >
      <IoChatbubbleOutline className="h-5 w-5" />
    </Link>
  );
}

// A titled group on the Payments pages — "Offers", "Payments", "Deposits" —
// with an optional count and something on the right (e.g. Export).
export function PaymentSection({
  title,
  count,
  description,
  action,
  className = "",
  children,
}: {
  title: string;
  count?: number;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">
            {title}
            {count !== undefined && <span className="ml-1.5 font-normal text-neutral-500">{count}</span>}
          </h2>
          {description && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// One collab on the Payments pages, laid out the same at every stage: who
// it's with and for which request, the amount with its status, one line on
// what happens next, dates, then that stage's actions — so rows scan as a
// column instead of each stage's own layout. The status sits beside the
// amount rather than the name: a badge like "Deposit requested" next to
// the name left a phone about ten characters of it.
export function PaymentRow({
  avatarUrl,
  name,
  title,
  titleHref,
  badge,
  headerAction,
  amount,
  detail,
  meta,
  children,
}: {
  avatarUrl: string | null;
  name: string;
  title: string;
  titleHref?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  amount?: string;
  detail?: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-ink/10 p-4">
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl} name={name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{name}</p>
          {titleHref ? (
            <Link
              href={titleHref}
              className="block truncate text-sm text-neutral-500 hover:underline dark:text-neutral-400"
            >
              {title}
            </Link>
          ) : (
            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
          )}
        </div>
        {!amount && badge}
        {headerAction}
      </div>
      {amount && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xl font-bold tabular-nums">{amount}</p>
          {badge}
        </div>
      )}
      {detail && (
        <p className={`${amount ? "mt-0.5" : "mt-3"} text-sm text-neutral-600 dark:text-neutral-400`}>{detail}</p>
      )}
      {meta && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{meta}</p>}
      {children}
    </div>
  );
}

// The summary at the top of each Payments page — always shown, zeros
// included, so a new account sees what it's working towards instead of a
// blank page: the two money figures large, then a row of smaller counts
// (collabs completed, in progress, rating), plus an optional line.
export function PaymentStats({
  stats,
  counts,
  footnote,
}: {
  stats: { label: string; value: string; hint: string }[];
  counts?: { label: string; value: string }[];
  footnote?: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-ink/10 p-4 no-print">
      <div className="grid grid-cols-2 divide-x divide-ink/10">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 px-4 first:pl-0 last:pr-0">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</p>
            <p className="mt-1 truncate font-display text-title-3 font-bold tabular-nums">{s.value}</p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{s.hint}</p>
          </div>
        ))}
      </div>
      {counts && (
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-ink/10 pt-3">
          {counts.map((c) => (
            <div key={c.label} className="flex min-w-0 flex-col">
              <dt className="order-2 truncate text-xs text-neutral-500 dark:text-neutral-400">{c.label}</dt>
              <dd className="order-1 truncate text-headline font-bold tabular-nums">{c.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {footnote && (
        <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-neutral-500 dark:text-neutral-400">{footnote}</p>
      )}
    </div>
  );
}
