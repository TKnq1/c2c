// One group on the Settings pages, the way iOS Settings does it: a small
// grey label, the controls together on a grey panel, and any explanation
// as a footnote underneath. `bare` skips the panel for content that's
// already one (the plan card).
export function SettingsSection({
  id,
  title,
  description,
  bare = false,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  bare?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-16 flex-col gap-2">
      <h2 className="px-1 text-footnote text-neutral-500 dark:text-neutral-400">{title}</h2>
      {bare ? children : <div className="rounded bg-fog p-4">{children}</div>}
      {description && <p className="px-1 text-footnote text-neutral-500 dark:text-neutral-400">{description}</p>}
    </section>
  );
}

// A row inside a settings card — label (and a line under it) on the left,
// its control on the right. Stacked rows get a hairline between them.
export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-ink/10 py-3 first:pt-0 last:pb-0 [&+&]:border-t">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
