import { Avatar } from "@/components/avatar";

export type ProfileStat = { label: string; value: string };

// A public profile (a brand seen by creators, a creator seen by brands).
// Phones: the card on top, then the content. From lg: the card is a sticky
// column on the left and the content runs beside it.
export function ProfileLayout({
  name,
  avatarUrl,
  tags,
  actions,
  stats,
  children,
}: {
  name: string;
  avatarUrl: string | null;
  // Niche, language, … under the name.
  tags: React.ReactNode;
  actions: React.ReactNode;
  stats: ProfileStat[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-10">
      <aside className="flex flex-col gap-5 lg:sticky lg:top-0 lg:rounded lg:bg-fog lg:p-5">
        <div className="flex items-center gap-4 lg:flex-col lg:gap-3 lg:text-center">
          <Avatar src={avatarUrl} name={name} size={80} />
          <div className="flex min-w-0 flex-col gap-2 lg:items-center">
            <h1 className="font-display text-title-1 font-bold text-balance break-words">{name}</h1>
            <div className="flex flex-wrap items-center gap-1.5 lg:justify-center">{tags}</div>
          </div>
        </div>
        {actions}
        <ProfileStats stats={stats} />
      </aside>
      <div className="flex min-w-0 flex-col gap-8">{children}</div>
    </div>
  );
}

function ProfileStats({ stats }: { stats: ProfileStat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col-reverse gap-0.5 rounded bg-fog px-3 py-2.5 lg:bg-background">
          <dt className="text-footnote text-neutral-500 dark:text-neutral-400">{s.label}</dt>
          <dd className="truncate font-display text-body font-bold tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProfileTag({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-fog px-2.5 py-1 text-xs text-neutral-700 lg:bg-background dark:text-neutral-300">
      {icon}
      {children}
    </span>
  );
}

// A titled block in the content column.
export function ProfileSection({
  title,
  aside,
  children,
}: {
  title: string;
  // Small text on the heading's right, e.g. a total.
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {aside && <span className="text-sm text-neutral-500 dark:text-neutral-400">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
