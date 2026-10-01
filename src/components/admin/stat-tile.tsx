import Link from "next/link";

// One headline figure on the admin overview. Linked tiles lead to the page
// that breaks the number down.
export function StatTile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-footnote text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 font-display text-title-1 font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-footnote text-neutral-500 dark:text-neutral-400">{hint}</p>}
    </>
  );

  return href ? (
    <Link href={href} className="block rounded bg-fog p-4 transition hover:bg-ink/10">
      {body}
    </Link>
  ) : (
    <div className="rounded bg-fog p-4">{body}</div>
  );
}
